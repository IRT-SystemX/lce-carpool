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

import * as crypto from 'crypto';
import axios from 'axios';
import { resolve } from 'path';
import { config } from 'dotenv';
import { SHA3 } from 'sha3';
import { Offer } from './offer';
import { OfferEncrypted } from './offerEncrypted';

const Proxy = require('./proxy/proxy');
config({ path: resolve(__dirname, '../.env.default') });

export class UtilsProxy {
    public static generateUUID(idOffer: string, idOperator: string) {
        const hash = new SHA3(512);

        hash.update(`lce_${idOffer}-${idOperator}`);

        return hash.digest('hex');
    }

    private static encryptMetadata(idOperator: string): string {
        /* Encrypt the metadata - the public is decoded from base64 */
        const pkProxy = Buffer.from(process.env.PK_PROXY_B64, 'base64').toString();
        return crypto.publicEncrypt(pkProxy, Buffer.from(idOperator)).toString('base64');
    }

    private static encryptEntity(offer: Offer, publicKey: string) {
        /* Encapsulate and get the symmetric key */
        const pkBytes = new Uint8Array(Buffer.from(publicKey, 'base64'));
        const pk = Proxy.public_key_from_bytes(pkBytes);
        const cp = Proxy.encapsulate(pk);
        const capsule = Buffer.from(cp.capsule.to_bytes()).toString('base64');
        const symmetricKey = cp.symmetric_key.to_bytes();

        /* Encrypt the offer */
        const algorithm = 'aes-256-cbc';
        const key = Buffer.from(symmetricKey);
        const iv = Buffer.from('0123456789012345');
        let cipher = crypto.createCipheriv(algorithm, key, iv);
        let entity = cipher.update(JSON.stringify(offer), 'utf8', 'base64');
        entity += cipher.final('base64');
        return { entity, capsule };
    }

    public static encrypt(offer: Offer, publicKey: string): OfferEncrypted {
        const {
            idTrip,
            idOperator,
            startDate,
            endDate,
            availableSeats,
            geohashDeparture,
            geohashArrival,
        } = offer;

        const metadata = UtilsProxy.encryptMetadata(idOperator);
        const { capsule, entity } = UtilsProxy.encryptEntity(offer, publicKey);

        const offerEncrypted: OfferEncrypted = {
            docType: 'offer',
            idTrip,
            metadata,
            capsule,
            entity,
            startDate,
            endDate,
            availableSeats,
            geohashDeparture,
            geohashArrival
        };

        return offerEncrypted;
    }

    public static decrypt(offerEncrypted: OfferEncrypted, privateKey: string): Offer {
        const {
            capsule,
            entity,
        } = offerEncrypted;
        
        /* Decapsulate and get the symmetric key */
        const skBytes = new Uint8Array(Buffer.from(privateKey, 'base64'));
        
        const reCapsuleBytes = new Uint8Array(Buffer.from(capsule, 'base64'));

        const sk = Proxy.private_key_from_bytes(skBytes);
        const reCapsule = Proxy.capsule_from_bytes(reCapsuleBytes);
        const symmetricKey = Proxy.decapsulate(reCapsule, sk);

        /* Decrypt the offer */
        const offerEntity = Buffer.from(entity, 'base64');
        const algorithm = 'aes-256-cbc';
        const key =  Buffer.from(symmetricKey.to_bytes());
        const iv = Buffer.from('0123456789012345');

        let decipher = crypto.createDecipheriv(algorithm, key, iv);
        let offer = decipher.update(offerEntity);
        offer = Buffer.concat([offer, decipher.final()]);

        return <Offer> JSON.parse(offer.toString());
    }

    public static async recrypt(offersEncrypted: OfferEncrypted[], idOperator: string): Promise<any> {
        const url = process.env.PROXY_URL;

        const resp = await axios.post(
            url,
            JSON.stringify({ idOperator,  'entities': offersEncrypted }),
            { headers: { 'Content-Type': 'application/json' } }
        );

        return resp.data;
    }
}
