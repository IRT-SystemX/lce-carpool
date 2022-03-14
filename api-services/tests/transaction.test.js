const request = require('supertest');
const chai = require('chai');
const chaiHttp = require('chai-http');
const randomstring = require('randomstring');

const axios = require('axios/index');
const MockAdapter = require('axios-mock-adapter');

const { expect } = chai;
const httpStatus = require('http-status');
const app = require('../src');
const { validIdOperator, validTransactionType, webhooks } = require('../src/config');
const { getRandomBasicOffer, getRandomTransaction, getTransactionForOffer } = require('./helpers/helpers');
const logger = require('../src/config/logger');
const { TransactionMsg } = require('../src/config/logging.enums');

const mock = new MockAdapter(axios, { delayResponse: 500 });
mock.onAny(webhooks.op1).reply(200, { message: 'mock notification received' });

chai.use(chaiHttp);

describe('## Transaction APIs', () => {
  before(async () => {
    this.user = {
      "username": randomstring.generate(5),
      "idOperator": validIdOperator[1]
    };
    try {
      const resp = await request(app).post('/api/v1/auth/login')
        .send(this.user)
        .expect(httpStatus.OK);
      expect(resp.body).to.have.property('token');
      this.token = resp.body.token.value;
      logger.debug('Before all: user created successfully');
    } catch (e) {
      logger.error(e.stack);
    }
  });

  describe('# POST /transaction', () => {

    describe('Push transaction successfully', () => {
      before(async () => {
        // Create an offer
        this.offer = getRandomBasicOffer();
        await request(app)
          .post('/api/v1/offer')
          .set('Content-Type', 'application/json')
          .set('Authorization', `Bearer ${this.token}`)
          .send({ 'offers' : [this.offer] })
          .expect(httpStatus.CREATED);
      });

      it('Push transaction rejected (no linked offer)', async () => {
        const transaction = getRandomTransaction(this.offer.idOffer);
        const resp = await request(app)
          .post('/api/v1/transaction')
          .set('Content-Type', 'application/json')
          .set('Authorization', `Bearer ${this.token}`)
          .send(transaction)
          .expect(httpStatus.CREATED);

        expect(resp.body).to.have.property('result');
        expect(resp.body.result).to.have.property('id');
      });
    });

    it('Push transaction rejected (no linked offer)', async () => {
      const transaction = getRandomTransaction();
      const resp = await request(app)
        .post('/api/v1/transaction')
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${this.token}`)
        .send(transaction)
        .expect(httpStatus.BAD_REQUEST);

      expect(resp.body).to.have.property('message', TransactionMsg.TRANSACTION_OFFER_NOT_EXIST);
    });

    it('should handle express validation error - idOffer is required', async () => {
      const postTransactionBadRequest = {
        idTransaction: '456',
        idOperator: 'op1',
        idPassenger: '666',
        passengerShortname: 'BBob',
        idOperatorPassenger: 'op2',
        type: 'CONFIRMATION',
        created_at: 1548851963
      };

      const res = await request(app)
        .post('/api/v1/transaction')
        .send(postTransactionBadRequest)
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${this.token}`)
        .expect(httpStatus.BAD_REQUEST);

      expect(res.body.errors[0].messages[0]).to.equal('"idOffer" is required');
    });

    describe('should push confirmation transaction and check offer update seats', () => {
      before(async () => {
        // Create an offer
        this.offer = getRandomBasicOffer();
        await request(app)
          .post('/api/v1/offer')
          .set('Content-Type', 'application/json')
          .set('Authorization', `Bearer ${this.token}`)
          .send({ 'offers' : [this.offer] })
          .expect(httpStatus.CREATED);

        // create an inscription transaction
        this.transaction = getTransactionForOffer(this.offer.idOffer);
        const resp = await request(app)
          .post('/api/v1/transaction')
          .set('Content-Type', 'application/json')
          .set('Authorization', `Bearer ${this.token}`)
          .send(this.transaction)
          .expect(httpStatus.CREATED);
        this.transaction.idTransaction = resp.body.result.id;
      });

      it('Confirmation transaction and offer update', async () => {
        // create a confirmation transaction
        const transactionConfirmation = {
          idOffer: this.offer.idOffer,
          idOperator: this.transaction.idOperator,
          idPassenger: this.transaction.idPassenger,
          passengerShortname: this.transaction.passengerShortname,
          idOperatorPassenger: this.transaction.idOperatorPassenger,
          type: validTransactionType[1]
        };

        // Create a confirmation transaction
        let resp = await request(app)
          .post('/api/v1/transaction')
          .set('Content-Type', 'application/json')
          .set('Authorization', `Bearer ${this.token}`)
          .send(transactionConfirmation)
          .expect(httpStatus.CREATED);
        expect(resp.body.result).to.have.property('id', this.transaction.idTransaction);
        transactionConfirmation.idTransaction = resp.body.result.id;

        // check if offer seat was updated
        resp = await request(app)
          .get(`/api/v1/offer/${this.offer.idOperator}/${this.offer.idOffer}`)
          .set('Authorization', `Bearer ${this.token}`)
          .send(transactionConfirmation)
          .expect(httpStatus.OK);
        expect(resp.body.availableSeats).to.equal((this.offer.availableSeats-1));
      })
    })
  });

  describe('# GET /transaction/:idOperator/:idOffer', () => {
    before(async () => {
      this.offer = getRandomBasicOffer();
      await request(app)
        .post('/api/v1/offer')
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${this.token}`)
        .send({ 'offers' : [this.offer] })
        .expect(httpStatus.CREATED);

      this.transaction = getRandomTransaction(this.offer.idOffer);
      const resp = await request(app)
        .post('/api/v1/transaction')
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${this.token}`)
        .send(this.transaction)
        .expect(httpStatus.CREATED);
      this.transaction.idTransaction = resp.body.result.id;
    });

    it('should get transactions of all passengers related to an offer', async () => {
      const res = await request(app)
        .get(`/api/v1/transaction/${this.transaction.idOperator}/${this.transaction.idOffer}`)
        .expect(httpStatus.OK);
      expect(res.body).to.be.an('array').and.to.have.length(1);
    });

    it('should report error with message - Not found', async () => {
      await request(app)
        .get('/api/v1/transaction')
        .expect(httpStatus.NOT_FOUND);
    });
  });

  describe('# GET /transaction/:idTransaction', () => {
    before(async () => {
      this.offer = getRandomBasicOffer();
      await request(app)
        .post('/api/v1/offer')
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${this.token}`)
        .send({ 'offers' : [this.offer] })
        .expect(httpStatus.CREATED);

      this.transaction = getRandomTransaction(this.offer.idOffer);
      const resp = await request(app)
        .post('/api/v1/transaction')
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${this.token}`)
        .send(this.transaction)
        .expect(httpStatus.CREATED);
      this.transaction.idTransaction = resp.body.result.id;
    });

    it('should get a specific transaction', async () => {
      const res = await request(app)
        .get(`/api/v1/transaction/${this.transaction.idTransaction}`)
        .expect(httpStatus.OK);
      expect(res.body).to.be.an('array').and.to.have.length(1);
      expect(res.body[0].idTransaction).to.eq(this.transaction.idTransaction);
    });
  });

});