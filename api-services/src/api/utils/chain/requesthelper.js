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

const logger = require('../../../config/logger');


class RequestHelper {
  constructor(hlfClient) {
    this.hlfClient = hlfClient;
  }

  /**
     * Pass transaction request to aws queue
     *
     * @param chaincodeId
     * @param {ChainMethod} chainMethod
     * @param {Object} params
     * @param {string} userId
     * @param invokeAlways - Workaround for message deduplication SQS
     * @param transientMap
     * @returns {Promise<InvokeResult>}
     * @memberof RequestHelper
     */
  // eslint-disable-next-line no-unused-vars
  async invokeRequest(chaincodeId, chainMethod, params, userId, invokeAlways = false, transientMap) {
    const args = [JSON.stringify(params)];

    try {
      const response = await this.hlfClient.invoke(chaincodeId, chainMethod, args, transientMap);
      logger.debug('Invoke successfully executed: ', response);
      return Promise.resolve({ txHash: response.txId, payload: response.payload });
    } catch(err) {
      logger.error(`${chainMethod}`, err);
      throw err;
    }
  }

  /**
     * Query hlf chain and return response
     *
     * @param {string} chaincodeId: the chaincode identifier string
     * @param {ChainMethod} chainMethod
     * @param {Object} params
     * @param transientMap
     * @returns {Promise<any>}
     * @memberof RequestHelper
     */
  queryRequest(chaincodeId, chainMethod, params = {}, transientMap) {
    const args = [JSON.stringify(params)];

    return this.hlfClient
      .query(chaincodeId, chainMethod, args, transientMap)
      .then((response) => {
        logger.debug('Query successfully executed!');
        return response;
      })
      .catch((error) => {
        logger.error(`${chainMethod}`, error);
        throw error;
      });
  }
}

module.exports = RequestHelper;
