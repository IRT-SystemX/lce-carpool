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

import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Delete
} from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { ProxyService } from "./proxy.service";
import { IGenericMessage } from "./model/generic.message.model";
import { IKeys } from "./model/keys.model";
import { IReKey } from "./model/rekey.model";
import { PostKeysPayload } from "./payload/post.keys.payload";
import { PostRekeyPayload } from "./payload/post.rekey.payload";
import { PostReencryptPayload } from "./payload/post.reencrypt.payload";

/**
 * Profile Controller
 */
@ApiTags("proxy")
@Controller("api/proxy")
export class ProxyController {

  /**
   * Constructor
   * @param proxyService
   */
  constructor(private readonly proxyService: ProxyService) {}

  /**
   * Create RSA keys
   * @param {PostRekeyPayload} payload
   * @returns {Promise<IKeys>} created RSA keys
   */
  @Post("keys")
  @ApiResponse({ status: 200, description: "Post Keys Request Received" })
  @ApiResponse({ status: 400, description: "Post Keys Request Failed" })
  async createKeys(@Body() payload: PostKeysPayload): Promise<IKeys> {
    return await this.proxyService.createKeys(payload);
  }

  /**
   * Create a re-encryption key
   * @param {PostRekeyPayload} payload
   * @returns {Promise<IReKey>} created re-encryption key
   */
  @Post("rekey")
  @ApiResponse({ status: 200, description: "Post Rekey Request Received" })
  @ApiResponse({ status: 400, description: "Post Rekey Request Failed" })
  async createRekey(@Body() payload: PostRekeyPayload) {
    return await this.proxyService.createRekey(payload);
  }

  /**
   * Retrieves a particular re-encryption key
   * @param idOperatorDelegator the idOperatorDelegator to fetch
   * @param idOperatorDelegatee the idOperatorDelegatee to fetch
   * @returns {Promise<IReKey>} queried re-encryption key data
   */
  @Get("rekey/:idOperatorDelegator/:idOperatorDelegatee")
  @ApiResponse({ status: 200, description: "Fetch Rekey Request Received" })
  @ApiResponse({ status: 400, description: "Fetch Rekey Request Failed" })
  async getRekey(@Param("idOperatorDelegator") idOperatorDelegator: string,
      @Param("idOperatorDelegatee") idOperatorDelegatee: string): Promise<IReKey> {
    const reKey = await this.proxyService.getRekeyById(idOperatorDelegator, idOperatorDelegatee);
    if (!reKey) {
      throw new BadRequestException(
        "The re-encryption with that IDs operators could not be found.",
      );
    }
    return reKey;
  }

  /**
   * Removes a re-encryption key from the database
   * @param idOperatorDelegator the idOperatorDelegator to delete
   * @param idOperatorDelegatee the idOperatorDelegatee to delete
   * @returns {Promise<IGenericMessageBody>} whether or not the key has been deleted
   */
  @Delete("rekey/:idOperatorDelegator/:idOperatorDelegatee")
  @ApiResponse({ status: 200, description: "Delete Rekey Request Received" })
  @ApiResponse({ status: 400, description: "Delete Rekey Request Failed" })
  async deleteRekey(
    @Param("idOperatorDelegator") idOperatorDelegator: string,
    @Param("idOperatorDelegatee") idOperatorDelegatee: string): Promise<IGenericMessage> {
    return await this.proxyService.deleteRekeyById(idOperatorDelegator, idOperatorDelegatee);
  }

  /**
   * Reencrypt data
   * @param {PostReencryptPayload} payload
   * @returns {Promise<PostReencryptPayload>} reencrypted data
   */
  @Post("reencrypt")
  @ApiResponse({ status: 200, description: "Post Reencrypt Request Received" })
  @ApiResponse({ status: 400, description: "Post Reencrypt Request Failed" })
  async reEncrypt(@Body() payload: PostReencryptPayload): Promise<PostReencryptPayload> {
    return await this.proxyService.reEncrypt(payload);
  }
}
