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

const FabricClient = require('fabric-client');
const fs = require('fs');
const httpStatus = require('http-status');
const ChainService = require('./chain.service');
const { HlfInfo } = require('./logging.enum');
const config = require('../../../config');
const logger = require('../../../config/logger');
const APIError = require('../../utils/APIError');


class HlfClient extends ChainService {
  /**
   * Constructor; Assign the HlfConfig
   * @param {HlfConfig} hlfConfig
   */
  // eslint-disable-next-line no-useless-constructor
  constructor(hlfConfig) {
    super(hlfConfig);
  }

  /**
   * init the Fabric client
   * @returns {Promise<any>}
   * @memberof ChainService
   */
  init() {
    this.hlfConfig.options = config.hlf;
    this.hlfConfig.client = new FabricClient();

    const fileExists = fs.existsSync(this.hlfConfig.options.ccpPath);
    if (!fileExists) { throw new Error(`no such file or directory: ${this.hlfConfig.options.ccpPath}`); }
    const {peerTLSCACertsPath} = this.hlfConfig.options;
    const {ordererTLSCACertsPath} = this.hlfConfig.options;
    const peerTlsCertData = fs.readFileSync(peerTLSCACertsPath);
    const peerTLSCACerts = Buffer.from(peerTlsCertData).toString();
    const ordererTlsCertData = fs.readFileSync(ordererTLSCACertsPath);
    const ordererTLSCACerts = Buffer.from(ordererTlsCertData).toString();

    this.hlfConfig.client.loadFromConfig(this.hlfConfig.options.ccpPath);

    return FabricClient
      .newDefaultKeyValueStore({
        path: this.hlfConfig.options.walletPath
      })
      .then((wallet) => {
        // assign the store to the fabric client
        this.hlfConfig.client.setStateStore(wallet);
        const cryptoSuite = FabricClient.newCryptoSuite();
        // use the same location for the state store (where the users' certificate are kept)
        // and the crypto store (where the users' keys are kept)
        const cryptoStore = FabricClient.newCryptoKeyStore({
          path: this.hlfConfig.options.walletPath
        });
        cryptoSuite.setCryptoKeyStore(cryptoStore);
        this.hlfConfig.client.setCryptoSuite(cryptoSuite);

        this.hlfConfig.channel = this.hlfConfig.client.newChannel(this.hlfConfig.options.channelId);
        const peerObj = this.hlfConfig.client.newPeer(this.hlfConfig.options.peerUrl, {pem: peerTLSCACerts});

        this.hlfConfig.channel.addPeer(peerObj, this.hlfConfig.options.admin.MspID);
        const ordererObj = this.hlfConfig.client.newOrderer(this.hlfConfig.options.ordererUrl, {pem: ordererTLSCACerts});
        this.hlfConfig.channel.addOrderer(ordererObj);
        this.hlfConfig.targets.push(peerObj);

        logger.info(HlfInfo.INIT_SUCCESS);
      });
  }

  /**
   * Query hlf
   *
   * @param chaincodeId
   * @param {string} chainMethod
   * @param {string[]} params
   * @param transientMap
   * @returns {Promise<any>}
   * @memberof HlfClient
   */
  query(chaincodeId, chainMethod, params, transientMap) {
    logger.info(HlfInfo.MAKE_QUERY, chainMethod, params);
    return this.newQuery(chainMethod, params, chaincodeId, transientMap)
      .then(queryResponses => Promise.resolve(this._getQueryResponse(queryResponses)));
  }

  /**
   * invoke
   *
   * @param {string} chaincodeId
   * @param {string} chainMethod
   * @param { string[]} params
   * @param transientMap
   * @returns
   * @memberof ChainService
   */
  async invoke(chaincodeId, chainMethod, params, transientMap) {
    logger.info(chaincodeId, chainMethod, params);
    const result = await this._sendTransactionProposal(chainMethod, params, chaincodeId, transientMap);
    logger.info(HlfInfo.CHECK_TRANSACTION_PROPOSAL);

    // Proposal is not good --> return error
    if (!this._isProposalGood(result.buffer)) {
      let {message} = result.buffer[0][0];

      if (message.indexOf('transaction returned with failure: ') !== -1) {
        message = message.split('transaction returned with failure: ')[1]; // eslint-disable-line prefer-destructuring
        try {
          message = JSON.parse(message);
        } catch (e) {
          logger.error(e);
        }
      }
      return Promise.reject(message);
    }

    // Get the transaction proposal response
    const transactionProposalResponse = this._getProposalTransactionResponse(result.buffer);

    // Send transaction
    this._logSuccessfulProposalResponse(result.buffer);

    const request = {
      proposalResponses: result.buffer[0],
      proposal: result.buffer[1]
    };
    logger.info(HlfInfo.REGISTERING_TRANSACTION_EVENT);

    const sendPromise = this.hlfConfig.channel.sendTransaction(request);
    const txPromise = this._registerTxEvent(result.txHash);

    const endorsementResults = await Promise.all([sendPromise, txPromise]);

    // check results
    logger.info('Send transaction promise and event listener promise have completed');
    const errors = [];
    let transactionSucceeded = false;
    let commitSucceeded = false;

    // result[0] returned from sendPromise
    if (!endorsementResults || (endorsementResults && endorsementResults[0] && endorsementResults[0].status !== 'SUCCESS')) {
      const message = `Failed to order the transaction. Error code: ${endorsementResults[0].status}`
      logger.error(message);
      errors.push(message);
    } else {
      transactionSucceeded = true
    }

    // result[1] returned from txPromise
    if (!endorsementResults || (endorsementResults && endorsementResults[1] && endorsementResults[1].event_status !== 'VALID')) {
      const message = `Transaction failed to be committed to the ledger due to ::${endorsementResults[1].event_status}`;
      logger.error(message);
      errors.push(message)
    } else {
      commitSucceeded = true;
    }
    
    if(transactionSucceeded && commitSucceeded) {
      const txId = endorsementResults[1].tx_id;
      return Promise.resolve({txId, payload: transactionProposalResponse})
    } 

    // reject the errors
    const err = new APIError({
      message: errors.join('\n'),
      status: httpStatus.INTERNAL_SERVER_ERROR,
    });
    return Promise.reject(err)
  }
}

module.exports = HlfClient;
