const request = require('supertest');
const chai = require('chai');
const chaiHttp = require('chai-http');
const randomstring = require('randomstring');

const { expect } = chai;
const httpStatus = require('http-status');
const app = require('../src');
const { validIdOperator, validTransactionType } = require('../src/config');
const { getRandomBasicOffer, getTransactionForOffer } = require('./helpers/helpers');
const logger = require('../src/config/logger');

chai.use(chaiHttp);

describe('## Proof APIs', () => {
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

  describe('# GET /proof', () => {
    before(async () => {
      // Create offer
      const postOffers = {"offers": [getRandomBasicOffer()]};
      const params = {
        "idOffer": postOffers.offers[0].idOffer,
        "idOperator": postOffers.offers[0].idOperator
      };

      await request(app)
        .post('/api/v1/offer')
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${this.token}`)
        .send(postOffers)
        .expect(httpStatus.CREATED);
      
      const res = await request(app)
        .get(`/api/v1/offer/${params.idOperator}/${params.idOffer}`)
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${this.token}`)
        .expect(httpStatus.OK);

      this.idTrip = res.body.idTrip;

      const txOne = getTransactionForOffer(params.idOffer);
      const txTwo = getTransactionForOffer(params.idOffer);
      const txThree = getTransactionForOffer(params.idOffer);
      // eslint-disable-next-line prefer-destructuring
      txOne.type = validTransactionType[1];
      // eslint-disable-next-line prefer-destructuring
      txTwo.type = validTransactionType[1];
      // eslint-disable-next-line prefer-destructuring
      txThree.type = validTransactionType[1];

      await request(app)
        .post('/api/v1/transaction')
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${this.token}`)
        .send(txOne)
        .expect(httpStatus.CREATED);

      await request(app)
        .post('/api/v1/transaction')
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${this.token}`)
        .send(txTwo)
        .expect(httpStatus.CREATED);

      await request(app)
        .post('/api/v1/transaction')
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${this.token}`)
        .send(txThree)
        .expect(httpStatus.CREATED);
    });
    
    it('Should get proof for an operator for a trip', async () => {
      const resp = await request(app)
        .get(`/api/v1/proof/${this.idTrip}`)
        .set('Authorization', `Bearer ${this.token}`)
        .expect(httpStatus.OK);
      expect(resp.body).to.be.an('array').and.to.have.length(3);
    });
  });
});
