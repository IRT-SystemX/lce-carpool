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

/* eslint-disable class-methods-use-this */
const Client = require('fabric-client');
const logger = require('../../../config/logger');
const {HlfInfo, HlfErrors} = require('./logging.enum');
const { hlf } = require('../../../config');

class ChainService {
  constructor(hlfconfig) {
    this.hlfConfig = hlfconfig;
  }

  /**
     * Wrapper around the newDefaultKeyValueStore function
     *
     * @param {string} path
     * @returns {Promise<IKeyValueStore>}
     */
  _newDefaultKeyValueStore(path) {
    logger.info(HlfInfo.CREATING_CLIENT);
    return Client.newDefaultKeyValueStore({path});
  }


  /**
     * Wrapper around the setStateStore function
     *
     * @param {IKeyValueStore} wallet
     */
  _setStateStore(wallet) {
    logger.info(HlfInfo.SET_WALLET_PATH, this.hlfConfig.options.userId);
    logger.debug(HlfInfo.WALLET, JSON.stringify(wallet));
    this.hlfConfig.client.setStateStore(wallet);
  }

  /**
     * Wrapper around the getUserContext function
     *
     * @param {string} userId
     * @returns {Promise<User> | Client.User}
     */
  _getUserContext(userId) {
    this.hlfConfig.client.getUserContext(userId, true);
  }

  /**
     * Check if a user is enrolled
     *
     * @param user
     * @returns {boolean}
     */
  _isUserEnrolled(user) {
    logger.info(HlfInfo.CHECK_USER_ENROLLED);
    if (user === undefined || user == null || user.isEnrolled() === false) {
      logger.error(HlfErrors.NO_ENROLLED_USER);
      return false;
    }
    logger.info(HlfInfo.USER_ENROLLED, user);
    return true;
  }

  static _handleError(err) {
    logger.error(err);
    throw err;
  }

  /**
     * Create new query transaction
     *
     * @param {string} requestFunction
     * @param {string[]} requestArguments
     * @param {string} chaincodeId
     * @param transientMap
     * @returns {Promise<Buffer[]>}
     */
  newQuery(requestFunction, requestArguments, chaincodeId, transientMap) {
    const txId = this.hlfConfig.client.newTransactionID();
    logger.debug(HlfInfo.ASSIGNING_TRANSACTION_ID, txId.getTransactionID());
    const request = {
      chaincodeId,
      fcn: requestFunction,
      args: requestArguments,
      transientMap
    };

    return this.hlfConfig.channel.queryByChaincode(request);
  }

  /**
     * Get actual response from response buffers
     *
     * @param {Buffer[]} queryResponses
     * @returns {object}
     */
  _getQueryResponse(queryResponses) {
    if (!queryResponses.length) {
      logger.debug(HlfInfo.NO_PAYLOADS_RETURNED);
    } else if (queryResponses[0] instanceof Error) {
      return ChainService._handleError(queryResponses[0].toString());
    }
    logger.debug(HlfInfo.RESPONSE_IS, queryResponses[0].toString());

    if (!queryResponses[0].toString().length) {
      return null;
    }

    return JSON.parse(queryResponses[0].toString());
  }

  /**
     * Create and send new invoke transaction proposal
     *
     * @param {string} requestFunction
     * @param {string[]} requestArguments
     * @param {string} chaincodeId
     * @param transientMap
     * @returns {Promise<{txHash, buffer}>}
     */
  _sendTransactionProposal(requestFunction, requestArguments, chaincodeId, transientMap) {
    const txId = this.hlfConfig.client.newTransactionID();

    logger.info(HlfInfo.ASSIGNING_TRANSACTION_ID, txId._transaction_id);

    const request = {
      targets: this.hlfConfig.targets,
      chaincodeId,
      fcn: requestFunction,
      args: requestArguments,
      transientMap,
      txId
    };

    return this.hlfConfig.channel.sendTransactionProposal(request)
      .then(proposalResponse => ({txHash: txId._transaction_id, buffer: proposalResponse}))
      .catch((err) => {
        logger.error(err.stack);
      });
  }

  /**
     * Check if the proposal response is good
     *
     * @param {ProposalResponseObject} results
     * @returns {boolean}
     */
  // TODO should refactor as the one here https://github.com/Kunstmaan/hyperledger-fabric-client-utils/blob/master/src/lib/invoke.js
  _isProposalGood(results) {
    const proposalResponses = results[0];
    let isProposalGood = false;
    if (proposalResponses && proposalResponses[0].response
            && proposalResponses[0].response.status === 200) {
      isProposalGood = true;
      logger.debug(HlfInfo.GOOD_TRANSACTION_PROPOSAL);
    } else {
      logger.error(HlfErrors.BAD_TRANSACTION_PROPOSAL);
    }
    return isProposalGood;
  }

  _getProposalTransactionResponse(results) {
    let transactionProposalResponse = null;
    const proposalResponses = results[0];

    proposalResponses.forEach((proposalResponse) => {
      if (proposalResponses && proposalResponse.response) {
        const payload = proposalResponse.response.payload.toString();

        try {
          transactionProposalResponse = JSON.parse(payload);
        } catch (e) {
          // Not a json object
          transactionProposalResponse = payload;
        }
      }
    });

    return transactionProposalResponse
  }

  _logSuccessfulProposalResponse(results) {
    const proposalResponses = results[0];
    logger.debug(HlfInfo.SUCCESFULLY_SENT_PROPOSAL, proposalResponses[0].response.status, proposalResponses[0].response.message);
  }

  /**
     * Listen and wait for transaction committing on peer
     *
     * @param transactionID
     * @returns {Promise<any>}
     */
  _registerTxEvent(transactionID) {
    const peer = this.hlfConfig.targets[0];

    if (!peer) {
      throw new Error('No peers attached');
    }

    const eh = this.hlfConfig.channel.newChannelEventHub(peer);

    return new Promise((resolve, reject) => {
      const handle = setTimeout(() => {
        eh.unregisterTxEvent(transactionID);
        eh.disconnect();
        logger.error(HlfErrors.TRANSACTION_TIMED_OUT, transactionID);
        reject(new Error(`Transaction did not complete within ${hlf.transactionTimeout} milliseconds`));
      }, hlf.transactionTimeout);

      eh.registerTxEvent(transactionID, (tx, code) => {
        // this is the callback for transaction event status
        // first some clean up of event listener
        clearTimeout(handle);

        // now let the application know what happened
        const status = {event_status: code, tx_id: transactionID};

        if (code !== 'VALID') {
          logger.error(HlfErrors.INVALID_TRANSACTION, code);
          resolve(status); // we could use reject(new Error('Problem with the transaction, event status ::'+code));
        } else {
          logger.debug(HlfInfo.COMMITTED_ON_PEER, eh.getPeerAddr());
          resolve(status);
        }
      }, (err) => {
        // this is the callback if something goes wrong with the event registration or processing
        reject(new Error(`There was a problem with the eventhub ::${err}`));
      },
      {disconnect: true} // disconnect when complete
      );

      logger.info(HlfInfo.CONNECTING_EVENTHUB);

      eh.connect();
    });
  }
}

module.exports = ChainService;
