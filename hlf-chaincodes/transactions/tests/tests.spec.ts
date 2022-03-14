/* tslint:disable */
// @ts-nocheck
import {expect} from "chai";
import {ChaincodeMockStub, Transform} from '@theledger/fabric-mock-stub';
import {TransactionChaincode} from '../src/transaction_chaincode';
import {TRANSACTION_STATUS} from '../src/transaction';
// @ts-ignore
import {initKmsChaincode, get_random_transaction, get_transaction, userCertOvx} from './utils';

const chaincode = new TransactionChaincode();

// @ts-ignore
describe('TestTransactionChaincode',  () => {

    this.stub = new ChaincodeMockStub("MyMockStub", chaincode, userCertOvx);

    it("Should init without issues", async () => {
        let response = await this.stub.mockInit("tx1", []);

        expect(response.status).to.eql(200);

        response = await initKmsChaincode(this.stub);

        expect(response.status).to.eql(200);
    });

    it("Should be able to add a transaction", async () => {
        const transaction = get_random_transaction(TRANSACTION_STATUS.INSCRIPTION);
        const resp = await this.stub.mockInvoke("tx1", ['pushTransaction', JSON.stringify(transaction)]);
        expect(resp.status).to.eql(200);
    });

    it("Should be able to update existing transaction", async () => {
        const transaction = get_random_transaction(TRANSACTION_STATUS.INSCRIPTION);
        const transactionTypeUpdate = get_transaction(
            transaction.idOffer,
            transaction.idOperator,
            transaction.idPassenger,
            TRANSACTION_STATUS.PAYMENT,
            transaction.passengerShortname);

        // add the first transaction
        let resp = await this.stub.mockInvoke("tx1", ['pushTransaction', JSON.stringify(transaction)]);
        expect(resp.status).to.eql(200);

        // Get the id of the first transaction
        let result = Transform.bufferToObject(resp.payload);
        expect(result).to.have.property('id');
        transaction.idTransaction = result["id"];
        transaction.docType = 'transaction';

        // add the second transaction
        resp = await this.stub.mockInvoke("tx1", ['pushTransaction', JSON.stringify(transactionTypeUpdate)]);
        expect(resp.status).to.eql(200);

        // Enrich the second transaction
        result = Transform.bufferToObject(resp.payload);
        expect(result).to.have.property('id');
        transactionTypeUpdate.idTransaction = result["id"];
        transactionTypeUpdate.docType = 'transaction';

        // check if it the same id as the first transaction
        expect(transactionTypeUpdate.idTransaction).to.eq(transaction.idTransaction);

        // Get transaction by ID, should return the latest one
        resp = await this.stub.mockInvoke('tx1', ['queryTransactionById', JSON.stringify({
            idTransaction: transaction.idTransaction
        })]);
        expect(resp.status).to.eq(200);

        // Check result
        result = Transform.bufferToObject(resp.payload);
        expect(result).to.be.length(1);
        transactionTypeUpdate.idTrip = result[0].idTrip;
        expect(result[0]).to.deep.equal(transactionTypeUpdate);
    });

    it("Should be able to query existing transaction using the transaction Id", async () => {
        const transaction = get_random_transaction(TRANSACTION_STATUS.INSCRIPTION);

        // Create new transaction
        let resp = await this.stub.mockInvoke("tx1", ['pushTransaction', JSON.stringify(transaction)]);
        expect(resp.status).to.eql(200);

        // Get the
        let result = Transform.bufferToObject(resp.payload);
        expect(result).to.have.property('id');

        // @ts-ignore
        transaction.idTransaction = result.id;
        transaction.docType = 'transaction';

        // query the offer by Id
        resp = await this.stub.mockInvoke('tx1', ['queryTransactionById', JSON.stringify({
            idTransaction: transaction.idTransaction
        })]);
        expect(resp.status).to.eql(200);

        // Check result
        result = Transform.bufferToObject(resp.payload);
        expect(result).to.be.length(1);
        transaction.idTrip = result[0].idTrip;
        expect(result[0]).to.deep.eq(transaction);
    });

    it("Should be able to query existing transaction using the idOffer and idOperator", async () => {
        const transaction = get_random_transaction(TRANSACTION_STATUS.INSCRIPTION);

        // Create new transaction
        let resp = await this.stub.mockInvoke("tx1", ['pushTransaction', JSON.stringify(transaction)]);
        expect(resp.status).to.eql(200);

        // Get the
        let result = Transform.bufferToObject(resp.payload);
        expect(result).to.have.property('id');

        // @ts-ignore
        transaction.idTransaction = result.id;
        transaction.docType = 'transaction';

        // query the offer by Id
        // @ts-ignore
        resp = await this.stub.mockInvoke('tx1', ['queryTransactionByOffer', JSON.stringify({
            idOffer: transaction.idOffer,
            idOperator: transaction.idOperator
        })]);
        expect(resp.status).to.eql(200);

        // Check result
        result = Transform.bufferToObject(resp.payload);
        expect(result).to.be.length(1);
        transaction.idTrip = result[0].idTrip;
        expect(result[0]).to.deep.eq(transaction);
    });
});
