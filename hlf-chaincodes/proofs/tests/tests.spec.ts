/* tslint:disable */
import * as moment from 'moment';
import * as _ from 'lodash';
import { expect } from "chai";
import { ChaincodeMockStub, Transform } from '@theledger/fabric-mock-stub';

import { ProofChaincode } from '../src/proofChaincode';
import { OPERATORS, TRANSACTION_STATUS, ROLES } from '../src/utils';
import { getBasicRandomProof, getCompleteRandomProof } from './helpers/helpers';
import {
  initKmsChaincode,
  userCertOvx,
} from './utils'

const chaincode = new ProofChaincode();

// @ts-ignore
describe('# Test ProofChaincode',  () => {
  this.stub = new ChaincodeMockStub("MyMockStub", chaincode, userCertOvx);

    // @ts-ignore
    it("Should init without issues", async () => {
      let response = await this.stub.mockInit("tx1", []);

      expect(response.status).to.eql(200);

      response = await initKmsChaincode(this.stub);

      expect(response.status).to.eql(200);
    });

    // @ts-ignore
    describe('## Create Proof', () => {
      // @ts-ignore
      it("Should be able to create a basic valid proof", async () => {
        const proof = getBasicRandomProof(TRANSACTION_STATUS.CONFIRMATION, OPERATORS.OVX, ROLES.DRIVER);
        
        const res = await this.stub.mockInvoke("tx1", ['createProof', JSON.stringify(proof)]);
        expect(res.status).to.eql(200);
      });

      // @ts-ignore
      it("Should be able to create a complete valid proof", async () => {
        const proof = getCompleteRandomProof(TRANSACTION_STATUS.CONFIRMATION, OPERATORS.OVX, ROLES.DRIVER);
        
        const res = await this.stub.mockInvoke("tx1", ['createProof', JSON.stringify(proof)]);
        expect(res.status).to.eql(200);
      });

      // @ts-ignore
      it("Should not be able to create a basic proof", async () => {
        const proof = getBasicRandomProof(TRANSACTION_STATUS.INSCRIPTION, OPERATORS.OVX, ROLES.DRIVER);
        
        const res = await this.stub.mockInvoke("tx1", ['createProof', JSON.stringify(proof)]);
        expect(res.status).to.eql(500);
      });
    });

    // @ts-ignore
    describe('## Query Proof', () => {
      // @ts-ignore
      before(async () => {
        const proofOne = getBasicRandomProof(TRANSACTION_STATUS.CONFIRMATION, OPERATORS.OVX, ROLES.DRIVER);
        const proofTwo = getBasicRandomProof(TRANSACTION_STATUS.CONFIRMATION, OPERATORS.OVX, ROLES.PASSENGER);
        const proofThree = getBasicRandomProof(TRANSACTION_STATUS.CONFIRMATION, OPERATORS.RIDYGO, ROLES.PASSENGER);
        proofOne.idOffer = proofTwo.idOffer = proofThree.idOffer;

        let res = await this.stub.mockInvoke("tx1", ['createProof', JSON.stringify(proofOne)]);
        expect(res.status).to.eql(200);
        res = await this.stub.mockInvoke("tx1", ['createProof', JSON.stringify(proofTwo)]);
        expect(res.status).to.eql(200);
        res = await this.stub.mockInvoke("tx1", ['createProof', JSON.stringify(proofThree)]);
        expect(res.status).to.eql(200);

        this.idProof = Transform.bufferToObject(res.payload).idProof;
        this.idOffer = proofOne.idOffer;
        this.idOperator = proofOne.idOperator;
      });
  
      // @ts-ignore
      it("Should be able to query proof by idProof", async () => {
        const res = await this.stub.mockInvoke('tx1', ['queryProofById', JSON.stringify({
          idProof: this.idProof
        })]);
  
        const proofs = Transform.bufferToObject(res.payload);
        expect(proofs).to.be.length(1);
      });
      
      // @ts-ignore
      it("Should be able to query proof by idTrip", async () => {
        const res = await this.stub.mockInvoke('tx1', ['queryProofByTrip', JSON.stringify({
          idOffer: this.idOffer,
          idOperator: this.idOperator,
        })]);

        const proofs = Transform.bufferToObject(res.payload);
        expect(proofs).to.be.length(3);
      });
    });
    
    // @ts-ignore
    describe('## Upgrade Proof', () => {
      // @ts-ignore
      before(async () => {
        const proofOne = getBasicRandomProof(TRANSACTION_STATUS.CONFIRMATION, OPERATORS.OVX, ROLES.DRIVER);

        let res = await this.stub.mockInvoke("tx1", ['createProof', JSON.stringify(proofOne)]);
        expect(res.status).to.eql(200);

        this.idProof = Transform.bufferToObject(res.payload).idProof;
        this.idOffer = proofOne.idOffer;
        this.idOperator = proofOne.idOperator;
        this.idUser = proofOne.idUser;
        this.idOperatorUser = proofOne.idOperatorUser;
      });
 
      // @ts-ignore
      it("Should be able to upgrade proof", async () => {
        const departureGps = "90, 90";
        const arrivalGps = "85, 85";
        const departureDate = moment().unix();
        const arrivalDate = moment().add(1, 'h').unix();

        let res = await this.stub.mockInvoke('tx1', ['upgradeProof', JSON.stringify({
          idOffer: this.idOffer,
          idOperator: this.idOperator,
          idUser: this.idUser,
          idOperatorUser: this.idOperatorUser,
          gps: departureGps,
          date: departureDate,
          type: TRANSACTION_STATUS.TRIP_STARTED,
          phone: "0000000000"
        })]);
        expect(res.status).to.eql(200);

        res = await this.stub.mockInvoke('tx1', ['upgradeProof', JSON.stringify({
          idOffer: this.idOffer,
          idOperator: this.idOperator,
          idUser: this.idUser,
          idOperatorUser: this.idOperatorUser,
          gps: arrivalGps,
          date: arrivalDate,
          type: TRANSACTION_STATUS.TRIP_ENDED,
          phone: "0000000000"
        })]);
        expect(res.status).to.eql(200);

        res = await this.stub.mockInvoke('tx1', ['queryProofById', JSON.stringify({
          idProof: this.idProof,
        })]);
        const proofs = Transform.bufferToObject(res.payload);
  
        expect(proofs).to.be.length(1);
        expect(proofs[0].userDepartureGps).to.be.equal(departureGps);
        expect(proofs[0].userDepartureDate).to.be.equal(departureDate);
        expect(proofs[0].userArrivalGps).to.be.equal(arrivalGps);
        expect(proofs[0].userArrivalDate).to.be.equal(arrivalDate);
        expect(proofs[0].type).to.be.equal(TRANSACTION_STATUS.TRIP_ENDED);
      });
    });
});