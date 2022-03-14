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

class ChainAuthentication {
  /**
     * Create an instance of Chain authentication helpers module
     * @param {HlfCaClient} hlfCaClient
     */
  constructor(hlfCaClient) {
    this.hlfCaClient = hlfCaClient;
  }

  /**
     * check if user exists in store,
     * return user from creds
     * @param {string} userId
     */
  getUserFromStore(userId) {
    return this.hlfCaClient.getUserFromStore(userId);
  }

  /**
     * Create new user credential file in store
     * @param {string} userId
     * @param {string} operator: the Operator ID
     * @returns {Promise<User>}
     */
  createUserCreds(userId , operator) {
    return this.hlfCaClient.createUser(
      userId,
      this.hlfCaClient.hlfConfig.options.admin.MspID,
      this.hlfCaClient.hlfConfig.options.userAffiliation,
      [ {name: 'operator', value: operator, ecert: true} ]
    );
  }

  checkUserCredsOperator(userId, operator) {
    return this.hlfCaClient.checkUserOperator(userId, operator);
  }

  getUserCredsOperator(userId) {
    return this.hlfCaClient.getUserOperator(userId);
  }
}

module.exports = ChainAuthentication;
