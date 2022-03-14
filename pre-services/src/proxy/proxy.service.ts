/*
 * Ledger Carpool Exchange (LCE) - A blockchain based carpooling interoperability platform
 * Copyright (C) 2018 - 2021 IRT SystemX - Métropole de Lyon - Coopgo
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

import * as crypto from "crypto";
import * as fs from "fs";
import {
  BadRequestException,
  Injectable,
  Inject,
  NotAcceptableException,
} from "@nestjs/common";
import { Model } from "mongoose";
import { InjectModel } from "@nestjs/mongoose";
import { ConfigService } from "../config/config.service";
import { IGenericMessage } from "./model/generic.message.model";
import { IKeys } from "./model/keys.model";
import { IReKey } from "./model/rekey.model";
import { PostKeysPayload } from "./payload/post.keys.payload";
import { PostRekeyPayload } from "./payload/post.rekey.payload";
import { PostReencryptPayload } from "./payload/post.reencrypt.payload";
import { Logger } from "winston";

// tslint:disable-next-line: no-var-requires
const Proxy = require("./sdk/proxy.js");

@Injectable()
export class ProxyService {
  /**
   * Constructor
   * @param {Model<IReKey>} reKeyModel
   * @param logger
   * @param configService
   * @param logger
   * @param configService
   */
  constructor(
    @InjectModel("ReKey") private readonly reKeyModel: Model<IReKey>,
    @Inject("winston") private readonly logger: Logger,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Create a RSA key pair with PostKeysPayload fields
   * @param {PostRekeyPayload} payload keys payload
   * @returns {Promise<IReKey>} created keys data
   */
  async createKeys(payload: PostKeysPayload): Promise<IKeys> {
    const { passphrase } = payload;
    const keysFolder = this.configService.get("KEYS_FOLDER");

    const { privateKey, publicKey } = crypto.generateKeyPairSync("rsa", {
      modulusLength: 4096,
      publicKeyEncoding: {
        type: "spki",
        format: "pem"
      },
      privateKeyEncoding: {
        type: "pkcs8",
        format: "pem",
        cipher: "aes-256-cbc",
        passphrase,
      }
    });

    const privateKeyB64 = Buffer.from(privateKey).toString("base64");
    const publicKeyB64 = Buffer.from(publicKey).toString("base64");

    fs.writeFileSync(`${keysFolder}/sk`, privateKey);
    fs.writeFileSync(`${keysFolder}/pk`, publicKey);

    fs.writeFileSync(`${keysFolder}/skB64`, privateKeyB64);
    fs.writeFileSync(`${keysFolder}/pkB64`, publicKeyB64);

    return { privateKey, publicKey };
  }

  /**
   * Create a re-encryption key with PostRekeyPayload fields
   * @param {PostRekeyPayload} payload rekey payload
   * @returns {Promise<IReKey>} created rekey data
   */
  async createRekey(payload: PostRekeyPayload): Promise<IReKey> {
    const user = await this.getRekeyById(payload.idOperatorDelegator, payload.idOperatorDelegatee);
    if (user) {
      throw new NotAcceptableException(
        "The re-encryption key with the provided operators IDs currently exists.",
      );
    }

    const createReKey = new this.reKeyModel({
      ...payload,
    });

    return createReKey.save();
  }

  /**
   * Fetches a rekey from database by id operators
   * @param {string} idOperatorDelegator
   * @param {string} idOperatorDelegatee
   * @returns {Promise<IReKey>} queried rekey data
   */
  getRekeyById(idOperatorDelegator: string, idOperatorDelegatee: string): Promise<IReKey> {
    return this.reKeyModel.findOne({ idOperatorDelegator, idOperatorDelegatee }).exec();
  }

  /**
   * Delete re-encryption given a idOperatorDelegator and idOperatorDelegatee
   * @param {string} idOperatorDelegator
   * @param {string} idOperatorDelegatee
   * @returns {Promise<IGenericMessage>} whether or not the crud operation was completed
   */
  deleteRekeyById(idOperatorDelegator: string, idOperatorDelegatee: string): Promise<IGenericMessage> {
    return this.reKeyModel.deleteOne({ idOperatorDelegator, idOperatorDelegatee }).then(profile => {
      if (profile.deletedCount === 1) {
        return { message: `Deleted ${idOperatorDelegator}, ${idOperatorDelegatee} from records` };
      } else {
        throw new BadRequestException(
          `Failed to delete keys with id: ${idOperatorDelegator}-${idOperatorDelegatee}`,
        );
      }
    });
  }

  /**
   * Re-encrypt entitites with PostReencryptPayload fields
   * @param {PostReencryptPayload} payload reencrypt payload
   * @returns {Promise<PostReencryptPayload>} re-encrypted data
   */
  async reEncrypt(payload: PostReencryptPayload): Promise<PostReencryptPayload> {
    try {
      const { idOperator, entities } = payload;

      const keysFolder = this.configService.get("KEYS_FOLDER");
      const skProxyB64 = fs.readFileSync(`${keysFolder}/skB64`, {encoding:'utf8', flag:'r'}); //this.configService.get("SK_PROXY_B64");
      const skProxyPassphrase = this.configService.get("SK_PROXY_PASSPHRASE");
      const skProxy = Buffer.from(skProxyB64, "base64").toString();

      const reEncryptedEntities = [];

      await Promise.all(
        entities.map(async (value, index) => {
          const metadata = Buffer.from(value.metadata, "base64");

          const idOperatorMetadata = crypto.privateDecrypt({
            key: skProxy,
            passphrase: skProxyPassphrase
          }, metadata).toString();

          this.logger.info("Re-encrypt request with:");
          this.logger.info("idOperator(invoker) " + idOperator);
          this.logger.info("idOperatormetadata(owner) " + idOperatorMetadata);

          if (idOperatorMetadata !== idOperator) {
            const key = await this.getRekeyById(idOperatorMetadata, idOperator);
            if (!key) return;

            const rkBytes = new Uint8Array(Buffer.from(key.reKey, "base64"));
            const capsuleBytes = new Uint8Array(Buffer.from(value.capsule, "base64"));

            const rk = Proxy.re_encryption_key_from_bytes(rkBytes);
            const capsule = Proxy.capsule_from_bytes(capsuleBytes);
            let reCapsule = Proxy.re_encrypt_capsule(capsule, rk);
            reCapsule = Buffer.from(reCapsule.to_bytes()).toString("base64");

            this.logger.info("A capsule was re-encrypted:");
            this.logger.info("- " + entities[index].capsule);
            this.logger.info("+ " + reCapsule);

            reEncryptedEntities.push(entities[index]);
            reEncryptedEntities[reEncryptedEntities.length - 1].capsule = reCapsule;
          } else {
            reEncryptedEntities.push(entities[index]);
          }
        })
      );

      return { idOperator, entities: reEncryptedEntities };
    } catch(e) {
      throw e;
    }
  }
}
