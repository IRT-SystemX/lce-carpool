/* eslint-disable arrow-body-style */
const request = require('supertest');
const { expect } = require('chai');
const httpStatus = require('http-status');
const randomstring = require('randomstring');
const axios = require('axios/index');
const MockAdapter = require('axios-mock-adapter');
const app = require('../src');
const { validIdOperator, validMessageStatus } = require('../src/config');
const { MessageMsg } = require('../src/config/logging.enums');
const { webhooks } = require('../src/config');
const Message = require('../src/api/models/message.model');
const logger = require('../src/config/logger');
const { getMessage } = require('./helpers/helpers');

const mock = new MockAdapter(axios, { delayResponse: 500 });
mock.onAny(webhooks.op1).reply(200, { message: 'mock notification received' });

describe('## Message APIs', () => {
  before(async () => {
    this.user = {
      "username": randomstring.generate(5),
      "idOperator": validIdOperator[0]
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

  describe('# POST /message', () => {
    it('should send a message', async () => {
      const message = getMessage();
      const resp = await request(app)
        .post('/api/v1/message')
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${this.token}`)
        .send(message)
        .expect(httpStatus.OK);
      expect(resp.body).to.have.property('message', MessageMsg.MESSAGE_POST_SUCCESSFULLY);
      expect(resp.body).to.have.property('result');
      expect(resp.body.result).to.have.property('id');

      // fetch message from mongo
      const msgs = await Message.find({ _id: resp.body.result.id}).lean().lean().exec();
      expect(msgs).to.have.length(1)
    });
  });

  describe('# PATCH /message', () => {
    before(async () => {
      this.message = getMessage();
      const resp =await request(app)
        .post('/api/v1/message')
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${this.token}`)
        .send(this.message)
        .expect(httpStatus.OK);
      this.message.idMessage = resp.body.result.id;
    });

    it('should update message status', async () => {
      const resp = await request(app)
        .patch(`/api/v1/message/${this.message.idMessage}`)
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${this.token}`)
        .send({
          state: validMessageStatus[2] // 'seen'
        })
        .expect(httpStatus.OK);

      expect(resp.body).to.have.property('message', MessageMsg.MESSAGE_UPDATED_SUCCESSFULLY);

      // fetch the message and check
      // const message = await Message.find({ _id: this.message.digest }).lean().exec();
      // expect(message).to.have.length(1);
      // expect(message[0]).to.have.property('state', validMessageStatus[1]);
    });

    it('should reject update message status (id incorrect)', async () => {
      const resp = await request(app)
        .patch('/api/v1/message/test')
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${this.token}`)
        .send({
          state: validMessageStatus[2], // 'seen'
        })
        .expect(httpStatus.NOT_FOUND);
      expect(resp.body).to.have.property('message', "Message does not exist");
    });
  });
});
