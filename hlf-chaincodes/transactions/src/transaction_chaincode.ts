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
import {Chaincode, Helpers, StubHelper, NotFoundError, ChaincodeError} from '@theledger/fabric-chaincode-utils';
import * as Yup from 'yup';
import {Transaction, TRANSACTION_STATUS} from './transaction';
import { TransactionEncrypted } from './transactionEncrypted';
import {Utils} from './utils';
import {UtilsProxy} from './utilsProxy';

export class TransactionChaincode extends Chaincode {

    initLedger = async () => {
        this.logger.info('InitLedger invoked successfully');
    }

    // push transasction to blockchain
    pushTransaction = async (stubHelper: StubHelper, args: string[]) => {
        const verifiedArgs = await Helpers.checkArgs<any>(args[0], Transaction.TransactionYupSchema());

        // Get the public key
        const publicKey = await Utils.getPublicKey(stubHelper, this.logger);

        // check owner in case of confirmation
        if (verifiedArgs.type === TRANSACTION_STATUS.CONFIRMATION) {
            if (!Utils.checkIsOwner(stubHelper, verifiedArgs.idOperator, this.logger)) {
                throw new ChaincodeError('Not authorized to create a confirmation transaction - you are not the owner');
            }

            // Update offer seat available if it's a confirmation
            const idOperator = verifiedArgs.idOperator;
            const idOffer = verifiedArgs.idOffer;

            // Invoke Offer chaincode to update available seats
            await Utils.invokeChaincode(
                stubHelper,
                'offers',
                'updateOfferFromTransaction',
                [{ idOperator, idOffer }],
                'mychannel',
                this.logger);

            this.logger.info('Offer seat updated successfully');
        }

        //check if the transaction exists
        const idTransaction = UtilsProxy.generateIdTransaction(verifiedArgs.idOffer, verifiedArgs.idOperator,
            verifiedArgs.idPassenger, verifiedArgs.idOperatorPassenger);
        const results = await stubHelper.getQueryResultAsList({
            selector: {
                docType: 'transaction',
                idTransaction,
            },
            use_index: ['_design/indexTransactionDoc', 'indexTransaction']
        });
        
        const transaction: Transaction = {
            docType: 'transaction',
            idTransaction,
            idTrip: UtilsProxy.generateIdTrip(verifiedArgs.idOffer, verifiedArgs.idOperator),
            idOffer: verifiedArgs.idOffer,
            idOperator: verifiedArgs.idOperator,
            idPassenger: verifiedArgs.idPassenger,
            idOperatorPassenger: verifiedArgs.idOperatorPassenger,
            passengerShortname: verifiedArgs.passengerShortname,
            type: verifiedArgs.type,
            createdAt: verifiedArgs.createdAt
        };

        const invokerOperator = Utils.getInvokerOperator(stubHelper);
        this.logger.info('operatorInvoker in transaction chaincode');
        this.logger.info(invokerOperator);
        const encryptedTransaction = UtilsProxy.encrypt(transaction, publicKey, invokerOperator);

        await stubHelper.putState(encryptedTransaction.idTransaction, encryptedTransaction);

        if (results.length == 0) {
            this.logger.info('New transaction created successfully');
        } else {
            this.logger.info('Update existing transaction successfully');
        }

        return Promise.resolve({ id: encryptedTransaction.idTransaction});
    }

    // retrieve the last transaction by id
    queryTransactionById = async (stubHelper: StubHelper, args: string[]): Promise<any> => {

        const verifiedArgs = await Helpers.checkArgs<{ idTransaction: string }>(args[0], Yup.object()
            .shape({
                idTransaction: Yup.string().required(),
            }));

        // Get the private key
        const privateKey = await Utils.getPrivateKey(stubHelper, this.logger);

        const encryptedTransactions = await stubHelper.getQueryResultAsList({
            selector: {
                docType: 'transaction',
                idTransaction: verifiedArgs.idTransaction,
            },
            use_index: ['_design/indexTransactionDoc', 'indexTransaction']
        });

        let decryptedTransactions = [];

        if (encryptedTransactions.length > 0) {
            const idOperator = Utils.getInvokerOperator(stubHelper);
            console.log(idOperator);
            const { entities } = await UtilsProxy.recrypt(<TransactionEncrypted[]> encryptedTransactions, idOperator);
            decryptedTransactions[0] = UtilsProxy.decrypt(<TransactionEncrypted> entities[0], privateKey);
        }

        return (decryptedTransactions);
    }

    // retrieve transaction by offer id
    queryTransactionByOffer = async (stubHelper: StubHelper, args: string[]): Promise<any> => {

        const verifiedArgs = await Helpers.checkArgs<{ idOffer: string, idOperator: string }>(args[0], Yup.object()
            .shape({
                idOffer: Yup.string().required(),
                idOperator: Yup.string().required()
            }));
            
        // Get the private key
        const privateKey = await Utils.getPrivateKey(stubHelper, this.logger);

        const idTrip = UtilsProxy.generateIdTrip(verifiedArgs.idOffer, verifiedArgs.idOperator);

        const encryptedTransactions = await stubHelper.getQueryResultAsList({
            selector: {
                docType: 'transaction',
                idTrip: idTrip,
            },
            use_index: ['_design/indexTransactionOfferDoc', 'indexTransactionOffer']
        });

        if (encryptedTransactions.length < 1) {
            return encryptedTransactions;
        }

        const idOperator = Utils.getInvokerOperator(stubHelper);
        const { entities } = await UtilsProxy.recrypt(<TransactionEncrypted[]> encryptedTransactions, idOperator);

        entities.forEach((item: any, index: string | number) => {
            const transactionEncrypted = <TransactionEncrypted> entities[index];
            entities[index] = <Transaction> UtilsProxy.decrypt(transactionEncrypted, privateKey);
        });
    
        return entities;
    }

    // update offer available seats
    updateTransactionAvailableSeats = async (stubHelper: StubHelper, args: any[]): Promise<any> => {
        const verifiedArgs = await Helpers
            .checkArgs<{ idTransaction: string, seatAvailable: number }>(args[0], Yup.object()
                .shape({
                    idTransaction: Yup.string().required(),
                    seatAvailable: Yup.number().integer().min(1).max(5).required(),
                }));

        // Check if transaction exist
        const transaction = <Transaction>await stubHelper.getStateAsObject(verifiedArgs.idTransaction);

        if (!transaction) {
            throw new NotFoundError(`Transaction (${verifiedArgs.idTransaction}) not found`);
        }

        // Check transaction owner
        if (!Utils.checkIsOwner(stubHelper, transaction.idOperator, this.logger)) {
            throw new ChaincodeError('Not authorized to update the offer available seats');
        }

        // Update the transaction seat value - Call the offer update
        await Utils.invokeChaincode(
            stubHelper,
            'offers',
            'updateOffer',
            [
                'idOperator', transaction.idOperator,
                'idOffer', transaction.idOffer,
                'availableSeats', verifiedArgs.seatAvailable
            ],
            stubHelper.getStub().getChannelID(),
            this.logger);
    }

    // retrieve the list of transactions by id
    queryTransactionHistory = async (stubHelper: StubHelper, args: string[]): Promise<any> => {
        const verifiedArgs = await Helpers
            .checkArgs<{ idTransaction: string }>(args[0], Yup.object()
                .shape({
                    idTransaction: Yup.string().required(),
                }));

        // Check if transaction exist
        const transaction = await stubHelper.getStateAsObject(verifiedArgs.idTransaction);

        if (!transaction) {
            throw new NotFoundError(`Transaction ${verifiedArgs.idTransaction} does not exist`);
        }

        // Query
        return await stubHelper.getHistoryForKeyAsList(verifiedArgs.idTransaction);
    }
}
