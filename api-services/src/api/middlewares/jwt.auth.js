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

const passport = require('passport');
const httpStatus = require('http-status');
const APIError = require('../utils/APIError');
const {generateUserToken} = require('../utils/authHelpers');
const {chainAuthentication} = require('../../config/hlf');
const logger = require('../../config/logger');
const { JwtInfo } = require('../../config/logging.enums');
const { HlfErrors } = require('../../api/utils/chain/logging.enum')

const createUserOnChain = async (username, idOperator) => {
  try {
    const userFromStore = await chainAuthentication.getUserFromStore(username);

    if (!userFromStore) {
      logger.debug(`Creating new user: ${username} of the operator: ${idOperator}`);
      await chainAuthentication.createUserCreds(username, idOperator);
      return Promise.resolve();
    }

    // check if existing user got the same operator
    const check = await chainAuthentication.checkUserCredsOperator(username, idOperator)
    if(!check) {
      const userOperator = await chainAuthentication.getUserCredsOperator(username)
      logger.error(HlfErrors.FAILED_TO_REGISTER_DIFFERENT_OPERATOR, username, userOperator)
      return Promise.reject(new APIError({ message: JwtInfo.ERROR_USER_DIFF_OPERATOR, status: httpStatus.UNAUTHORIZED}))
    }

    logger.debug(`User from store ${userFromStore.getName()}`);
    return Promise.resolve()
  } catch (err) {
    logger.error(err.stack);
    return Promise.reject(err);
  }
};

const generateToken = async (req, res, next) => {
  try {
    const {username, idOperator} = req.body;

    // check if the user exist in blockchain
    await createUserOnChain(username, idOperator);

    // generate the related user JWT token
    const token = generateUserToken({username, idOperator});

    // return response to caller
    return res.status(httpStatus.OK).json({username, idOperator, token});
  } catch (e) {
    return next(e);
  }
};

const isAuthorized = (req, res, next) => {
  passport.authenticate(
    'jwt',
    {session: false},
    (error, user) => {
      if (error || !user)
        return next(new APIError({
          message: JwtInfo.REQUEST_TOKEN_NOT_FOUND,
          status: httpStatus.UNAUTHORIZED
        }));

      req.user = user;
      return next();
    })(req, res, next);
};

module.exports = {
  isAuthorized,
  generateToken,
};
