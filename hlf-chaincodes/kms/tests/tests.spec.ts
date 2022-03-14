/* tslint:disable */
import {expect} from "chai";
import {ChaincodeMockStub, Transform} from '@theledger/fabric-mock-stub';
import {KmsChaincode} from '../src/kmsChaincode';
// @ts-ignore
import {getRandomKms, userCertOvx} from './utils';

const chaincode = new KmsChaincode();

// @ts-ignore
describe('TestTransactionChaincode',  () => {
    // @ts-ignore
    it("Should init without issues", async () => {
        const stub = new ChaincodeMockStub("MyMockStub", chaincode, userCertOvx);

        const response = await stub.mockInit("tx1", []);

        expect(response.status).to.eql(200)
    });

    // @ts-ignore
    it("Should be able to add a kms", async () => {
        const stub = new ChaincodeMockStub("MyMockStub", chaincode, userCertOvx);
        const transientPrivateKey = new Map().set('privateKey', 'myPrivateKey');
        const kms = getRandomKms();

        let resp = await stub.mockInvoke("tx1", ['createSharedCollection', JSON.stringify(kms)], transientPrivateKey);
        expect(resp.status).to.eql(200);

        // Get transaction by ID, should return the latest one
        resp = await stub.mockInvoke('tx1', ['queryPrivateCar', JSON.stringify({
            idOperator: kms.idOperator
        })]);
        expect(resp.status).to.eq(200);

        // Check result
        const result = Transform.bufferToObject(resp.payload);

        console.log(result);
        // expect(result).to.be.length(1);
        // expect(result[0]).to.deep.equal(transactionTypeUpdate);

    });
});
