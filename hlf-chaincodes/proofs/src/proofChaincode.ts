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

import { Chaincode, Helpers, StubHelper, ChaincodeError } from '@theledger/fabric-chaincode-utils';
import * as Yup from 'yup';
import { Proof } from './proof';
import { TRANSACTION_STATUS, Utils } from './utils';
import { UtilsProxy } from './utilsProxy';
import { ProofEncrypted } from './proofEncrypted';

export class ProofChaincode extends Chaincode {

    initLedger = async (stubHelper: StubHelper, args: string[]) => {
        this.logger.info('InitLedger invoked successfully');
    }

    createProof = async (stubHelper: StubHelper, args: string[]) => {
        const verifiedArgs = await Helpers.checkArgs<any>(args[0], Proof.CreateProofYupSchema());
    
        // Get the public key
        const publicKey = await Utils.getPublicKey(stubHelper, this.logger);

        // check if the proof exists
        const idProof = UtilsProxy.generateIdProof(verifiedArgs.idOffer, verifiedArgs.idOperator,
            verifiedArgs.idUser, verifiedArgs.idOperatorUser);
        const results = await stubHelper.getQueryResultAsList({
          selector: {
              docType: 'proof',
              idProof,
          },
          use_index: ['_design/indexProofDoc', 'indexProof']
        });

        if (results.length > 0) {
          const error = `Proof (${idProof}) already exists`;
          this.logger.error(error);
          throw new ChaincodeError(error, 500);
        }

        const proof: Proof = {
          docType: 'proof',
          idProof,
          idTrip: UtilsProxy.generateIdTrip(verifiedArgs.idOffer, verifiedArgs.idOperator),
          idOffer: verifiedArgs.idOffer,
          idOperator: verifiedArgs.idOperator,
          idUser: verifiedArgs.idUser,
          userShortname: verifiedArgs.userShortname,
          idOperatorUser: verifiedArgs.idOperatorUser,
          role: verifiedArgs.role,
          type: verifiedArgs.type,
          created_at: verifiedArgs.created_at,

          origin: verifiedArgs.origin,
          destination: verifiedArgs.destination,
          departureDate: verifiedArgs.departureDate,
          arrivalDate: verifiedArgs.arrivalDate,
          departureGps: verifiedArgs.departureGps,
          arrivalGps: verifiedArgs.arrivalGps,

          userDepartureDate: verifiedArgs.userDepartureDate,
          userArrivalDate: verifiedArgs.userArrivalDate,
          userDepartureGps: verifiedArgs.userDepartureGps,
          userArrivalGps: verifiedArgs.userArrivalGps,
          userPhone: verifiedArgs.userPhone,
        };

        const encryptedProof = UtilsProxy.encrypt(proof, publicKey);

        await stubHelper.putState(encryptedProof.idProof, encryptedProof);

        this.logger.info('New proof created successfully. Added <--> ', encryptedProof);

        return Promise.resolve({ idProof: encryptedProof.idProof });
    }

    upgradeProof = async (stubHelper: StubHelper, args: any[]) => {
        const verifiedArgs = await Helpers.checkArgs<any>(args[0], Proof.UpgradeProofYupSchema());

        // Get the private key
        const privateKey = await Utils.getPrivateKey(stubHelper, this.logger);

        // Get the public key
        const publicKey = await Utils.getPublicKey(stubHelper, this.logger);

        const idProof = UtilsProxy.generateIdProof(verifiedArgs.idOffer, verifiedArgs.idOperator, verifiedArgs.idUser, verifiedArgs.idOperatorUser);

        // check if the proof exists
        const encryptedProofs = await stubHelper.getQueryResultAsList({
            selector: {
                docType: 'proof',
                idProof,
            },
            use_index: ['_design/indexProofDoc', 'indexProof']
        });

        if (encryptedProofs.length == 0) {
            const error = `Proof (${verifiedArgs.idTrip} - ${verifiedArgs.idUser} - ${verifiedArgs.idOperatorUser}) not exists`;
            this.logger.error(error);
            throw new ChaincodeError(error);
        }

        const idOperator = Utils.getInvokerOperator(stubHelper);
        const { message, entities } = await UtilsProxy.recrypt(<ProofEncrypted[]> encryptedProofs, idOperator);
        const proof = UtilsProxy.decrypt(<ProofEncrypted> entities[0], privateKey);

        proof.type = verifiedArgs.type;
        proof.userPhone = verifiedArgs.phone;
        if (verifiedArgs.type === TRANSACTION_STATUS.TRIP_STARTED)  {
          proof.userDepartureDate = verifiedArgs.date;
          proof.userDepartureGps = verifiedArgs.gps;
        } else {
          proof.userArrivalDate = verifiedArgs.date;
          proof.userArrivalGps = verifiedArgs.gps;
        }

        const encryptedProof = UtilsProxy.encrypt(proof, publicKey);

        await stubHelper.putState(encryptedProof.idProof, encryptedProof);

        this.logger.info('New proof updated successfully. Upgraded <--> ', proof);
    }

    queryProofById = async (stubHelper: StubHelper, args: string[]): Promise<any> => {
        const verifiedArgs = await Helpers.checkArgs<{ idProof: string }>(args[0], Yup.object()
        .shape({
            idProof: Yup.string().required(),
        }));

        // Get the private key
        const privateKey = await Utils.getPrivateKey(stubHelper, this.logger);

        const encryptedProof = await stubHelper.getQueryResultAsList({
          selector: {
              docType: 'proof',
              idProof: verifiedArgs.idProof
          },
          use_index: ['_design/indexProofDoc', 'indexProof']
        });

        let decryptedProof = [];

        if (encryptedProof.length > 0) {
            const idOperator = Utils.getInvokerOperator(stubHelper);
            const { message, entities } = await UtilsProxy.recrypt(<ProofEncrypted[]> encryptedProof, idOperator);
            decryptedProof[0] = UtilsProxy.decrypt(<ProofEncrypted> entities[0], privateKey);
        }

        return (decryptedProof);
    }

    queryProofByTrip = async (stubHelper: StubHelper, args: string[]): Promise<any> => {
        const verifiedArgs = await Helpers.checkArgs<{ idOffer: string, idOperator: string }>(args[0], Yup.object()
        .shape({
            idOffer: Yup.string().required(),
            idOperator: Yup.string().required()
        }));

        // Get the private key
        const privateKey = await Utils.getPrivateKey(stubHelper, this.logger);

        const idTrip = UtilsProxy.generateIdTrip(verifiedArgs.idOffer, verifiedArgs.idOperator);

        const encryptedProofs = await stubHelper.getQueryResultAsList({
            selector: {
                docType: 'proof',
                idTrip,
            },
            use_index: ['_design/indexProofTripDoc', 'indexProofTrip']
        });

        if (encryptedProofs.length < 1) {
            return encryptedProofs;
        }

        const idOperator = Utils.getInvokerOperator(stubHelper);
        const { message, entities } = await UtilsProxy.recrypt(<ProofEncrypted[]> encryptedProofs, idOperator);

        entities.forEach((item: any, index: string | number) => {
            const proofEncrypted = <ProofEncrypted> entities[index];
            entities[index] = <Proof> UtilsProxy.decrypt(proofEncrypted, privateKey);
        });
    
        return entities;
    }
}
