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

// @ts-ignore
import * as Yup from 'yup';
import axios from 'axios';
import { resolve } from 'path';
import { config } from 'dotenv';
import { Chaincode, StubHelper, Helpers, ChaincodeError, NotFoundError } from '@theledger/fabric-chaincode-utils';
import { Kms } from './kms';
import { KmsPrivateDetails } from './kmsPrivateDetails';
import {Utils} from './utils';

config({ path: resolve(__dirname, '../.env.default') });

export class KmsChaincode extends Chaincode {

    initLedger = async () => {
        this.logger.info('InitLedger invoked successfully');
    }

    // Store operator keys public and private keys in the blockchain
    createKeys = async (stubHelper: StubHelper, args: string[]) => {        
        const verifiedArgs = await Helpers.checkArgs<any>(args[0], Kms.CreateKeysYupSchema());

        // private key is received in transient field for more security
        const privateKey = stubHelper.getStub().getTransient().get('privateKey').toString('utf8');
        if (privateKey === undefined) {
            throw new ChaincodeError('No private key passed', 500);
        }

        const idOperator = Utils.getInvokerOperator(stubHelper);
        if (verifiedArgs.idOperator !== idOperator) {
            throw new ChaincodeError('You are not authorized', 500);
        }

        // public key is stored in public collection shared with other organizations
        const kmsCollection = 'kmsCollection';
        const kms: Kms = {
            docType: 'kms',
            idOperator: verifiedArgs.idOperator,
            publicKey: verifiedArgs.publicKey
        };

        // private key is only stored locally in a private collection only in owner's organization
        const kmsCollectionPrivate = `${idOperator}PrivateKmsCollection`;
        const kmsPrivate: KmsPrivateDetails = {
            docType: 'kms',
            idOperator: verifiedArgs.idOperator,
            privateKey
        };

        await stubHelper.putState(kms.idOperator, kms, {privateCollection: kmsCollection});

        await stubHelper.putState(kmsPrivate.idOperator, kmsPrivate, {privateCollection: kmsCollectionPrivate});
    
        const message = `Added in ${kmsCollection} and ${kmsCollectionPrivate} collections`;

        return Promise.resolve({ message });
    }

    // request to send re-encryption key to the proxy
    createRekey = async (stubHelper: StubHelper, args: string[]) => {        
        const verifiedArgs = await Helpers.checkArgs<any>(args[0], Kms.CreateRekeyYupSchema());

        const idOperator = Utils.getInvokerOperator(stubHelper);
        if (verifiedArgs.idOperatorDelegator !== idOperator) {
            throw new ChaincodeError('You are not authorized', 500);
        }

        const url = process.env.PROXY_URL;

        const resp = await axios.post(
            url,
            JSON.stringify({
                idOperatorDelegator: verifiedArgs.idOperatorDelegator,
                idOperatorDelegatee: verifiedArgs.idOperatorDelegatee,
                reKey: verifiedArgs.reKey
            }),
            { headers: { 'Content-Type': 'application/json' } }
        );

        return Promise.resolve(resp.data);
    }

    // get public and private key of an operator
    async getKeysById(stubHelper: StubHelper, args: string[]) {
        const verifiedArgs = await Helpers.checkArgs<any>(args[0], Yup.object()
            .shape({
                idOperator: Yup.string().required(),
            }));
        
        const idOperator = Utils.getInvokerOperator(stubHelper);

        const kmsCollection = 'kmsCollection';
        const kmsCollectionPrivate = `${verifiedArgs.idOperator}PrivateKmsCollection`;

        const kms = await stubHelper.getStateAsObject(verifiedArgs.idOperator, {privateCollection: kmsCollection});

        if (!kms) {
            throw new NotFoundError('Kms does not exist');
        }

        // the private key is returned only to owner
        if (verifiedArgs.idOperator === idOperator) {
            const kmsPrivate = await stubHelper.getStateAsObject(verifiedArgs.idOperator, {privateCollection: kmsCollectionPrivate});
            return { kms, kmsPrivate };
        }

        return { kms };
    }

}
