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

const CaClient = require('fabric-ca-client');
const X509 = require('@ampretia/x509');
const httpStatus = require('http-status');
const { HlfInfo, HlfErrors } = require('./logging.enum');
const logger = require('../../../config/logger');
const APIError  = require('../APIError');

function checkoutCertForAttributes(pem, attrName) {
  const cert = X509.parseCert(pem);
  if (cert && cert.extensions && cert.extensions['1.2.3.4.5.6.7.8.1']) {
    const attrString = cert.extensions['1.2.3.4.5.6.7.8.1'];
    const attrObject = JSON.parse(attrString);
    const { attrs } = attrObject;
    if (attrs && attrs[attrName]) {
      logger.debug(' Found attribute %s with value of %s', attrName, attrs[attrName]);
      return attrs[attrName];
    }
  }
  return null;
}

class HlfCaClient {
  constructor(hlfconfig) {
    this.hlfConfig = hlfconfig;
  }

  init(adminCreds) {
    if (!this.hlfConfig.caClient) {
      // const cryptoSuite = this.chainService.client.getCryptoSuite();
      // be sure to change the http to https when the CA is running TLS enabled
      const cryptoSuite = this.hlfConfig.client.getCryptoSuite();

      this.hlfConfig.caClient = new CaClient(
        this.hlfConfig.options.ca.url,
        this.hlfConfig.options.tlsOptions,
        this.hlfConfig.options.ca.name,
        cryptoSuite
      );
    }
    // create admin
    return this.createAdmin(adminCreds.enrollmentID, adminCreds.enrollmentSecret, adminCreds.MspID);
  }

  async createAdmin(enrollmentID, enrollmentSecret, mspId) {
    try {
      const userFromStore = await this.getUserFromStore(this.hlfConfig.options.admin.enrollmentID);
      if (userFromStore) {
        this.hlfConfig.adminUser = userFromStore;
        return this.hlfConfig.client.setUserContext(this.hlfConfig.adminUser);
      }

      this.hlfConfig.adminUser = await this.enrollUser(enrollmentID, enrollmentSecret, mspId);

      await this.hlfConfig.client.setUserContext(this.hlfConfig.adminUser);
      logger.info(HlfInfo.ASSIGNED_ADMIN);
      return Promise.resolve(this.hlfConfig.adminUser);
    } catch (err) {
      logger.error(err.stack);
      return Promise.reject(err);
    }
  }

  async createUser(username, mspId, affiliation, attrs) {
    logger.debug('Creating user:', username, mspId, affiliation, attrs);

    try {
      if (this.hlfConfig.adminUser) {
        const secret = await this.hlfConfig.caClient.register({
          role: 'client', // since hlf 1.1
          attrs, // since hlf 1.1
          enrollmentID: username,
          affiliation}, this.hlfConfig.adminUser);

        // next we need to enroll the user with CA server
        logger.info(HlfInfo.USER_REGISTERED, username);
        return this.enrollUser(username, secret, mspId, [{ name: attrs[0].name}]); // TODO create dynamic table from attrs
      }

      // No admin user found, cannot process user creation
      return Promise.reject(HlfErrors.NO_ADMIN_USER);
    } catch (err) {
      logger.error(HlfErrors.FAILED_TO_REGISTER, username);
      logger.error(err.stack);

      if (err.toString().indexOf('Authorization') > -1) {
        logger.error(HlfErrors.AUTH_FAILURES);
      }

      return Promise.reject(err);
    }
  }

  async getUserFromStore(userId, checkPersistence = true) {
    try {
      const userFromStore = await this.hlfConfig.client.getUserContext(userId, checkPersistence);
      if (userFromStore && userFromStore.isEnrolled()) {
        return Promise.resolve(userFromStore);
      }

      // No user found on wallet, should create new one
      return Promise.resolve(null);
    } catch(err) {
      logger.error(err);
      return Promise.reject(err)
    }
  }

  async checkUserOperator(userId, operator, checkPersistence = true) {
    try {
      const userFromStore = await this.hlfConfig.client.getUserContext(userId, checkPersistence);
      if (userFromStore && userFromStore.isEnrolled()) {
        const userIdentity = userFromStore.getIdentity();
        const certificate = userIdentity._certificate
        const attrOperator = checkoutCertForAttributes(certificate, 'operator')
        if(attrOperator && attrOperator === operator)
          return Promise.resolve(true)

        return Promise.resolve(false);
      }

      // No user found on wallet, should create new one
      return Promise.reject(new APIError({ message:'User not in store', status: httpStatus.INTERNAL_SERVER_ERROR  }));

    } catch(err) {
      logger.error(err);
      return Promise.reject(err);
    }
  }

  async getUserOperator(userId, checkPersistence = true) {
    try {
      const userFromStore = await this.hlfConfig.client.getUserContext(userId, checkPersistence);
      if (userFromStore && userFromStore.isEnrolled()) {
        const userIdentity = userFromStore.getIdentity();
        const certificate = userIdentity._certificate
        return Promise.resolve(checkoutCertForAttributes(certificate, 'operator'))
      }

      // No user found on store, should create new one
      return Promise.reject(new APIError({ message:'User not in store', status: httpStatus.INTERNAL_SERVER_ERROR  }));

    } catch(err) {
      logger.error(err);
      return Promise.reject(err);
    }
  }

  enrollUser(enrollmentID, enrollmentSecret, mspId, attr_reqs=[]) {
    return this.hlfConfig.caClient.enroll({
      enrollmentID,
      enrollmentSecret,
      attr_reqs
    }).then((enrollment) => {
      logger.info(HlfInfo.USER_ENROLLED, enrollmentID);
      return this.hlfConfig.client.createUser({
        username: enrollmentID,
        mspid: mspId,
        cryptoContent: {
          privateKeyPEM: enrollment.key.toBytes(),
          signedCertPEM: enrollment.certificate
        },
        skipPersistence: false
      });
    });
  }


}

module.exports = HlfCaClient;
