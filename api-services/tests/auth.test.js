/* eslint-disable arrow-body-style */
const request = require('supertest');
const chai = require('chai');
const chaiHttp = require('chai-http');
const randomstring = require('randomstring');

const {expect} = chai;
const httpStatus = require('http-status/lib/index');
const app = require('../src');
const { validIdOperator } = require('../src/config');
const { JwtInfo } = require('../src/config/logging.enums')

chai.use(chaiHttp);

describe('Authentication test', () => {
  this.user = { username: randomstring.generate(5), idOperator: validIdOperator[0]};

  it('Should generate a JWT token', async () => {
    const resp = await request(app)
      .post('/api/v1/auth/login')
      .send(this.user)
      .expect(httpStatus.OK);
    
    expect(resp.body).to.have.property('token');
    expect(resp.body).to.have.property('username', this.user.username);
    expect(resp.body).to.have.property('idOperator', this.user.idOperator);
  });

  it('Should regenerate JWT when we resubmit the same credentials', async () => {
    const user = { username: randomstring.generate(5), idOperator: validIdOperator[0]};
    let resp = await request(app).post('/api/v1/auth/login').send(user).expect(httpStatus.OK);
    expect(resp.body).to.have.property('token');

    resp = await request(app).post('/api/v1/auth/login').send(user).expect(httpStatus.OK);
    expect(resp.body).to.have.property('token');
  })

  it('Should fails when changing operator', async () => {
    const user = { username: randomstring.generate(5), idOperator: validIdOperator[0]};
    let resp = await request(app).post('/api/v1/auth/login').send(user).expect(httpStatus.OK);
    expect(resp.body).to.have.property('token');

    user.idOperator = validIdOperator[1]; // eslint-disable-line prefer-destructuring
    resp = await request(app).post('/api/v1/auth/login').send(user).expect(httpStatus.UNAUTHORIZED);
    expect(resp.body).to.have.property('message', JwtInfo.ERROR_USER_DIFF_OPERATOR);


  })
});