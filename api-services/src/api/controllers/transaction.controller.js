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

const httpStatus = require('http-status');
const _ = require('lodash');
const moment = require('moment');
// const Json = require('../utils/json');
const { sendNotification } = require('../services/notification.service');
const { requestHelper } = require('../../config/hlf');
const ChainMethod = require('../utils/chainMethod.enum');
const logger = require('../../config/logger');
const { validTransactionType, hlf } = require('../../config');
const { TransactionMsg } = require('../../config/logging.enums');

const { createProof } = require('./proof.controller');

/**
 * Get transaction by idTransaction field
 */
const getTransactionById = async (req, res, next) => {
  try {
    const {idTransaction} = req.params;
    const transactions = await requestHelper.queryRequest(
      hlf.chaincodeId.transaction,
      ChainMethod.queryTransactionById,
      {idTransaction});

    if (!transactions || transactions.length === 0) {
      return res.status(httpStatus.NOT_FOUND).send({ message: TransactionMsg.TRANSACTION_GET_ID_NOT_EXIST });
    }

    // remove unused keys
    const result = _.map(transactions, o => {
      return _.omit(o, ['docType']);
    });

    return res.status(httpStatus.OK).send(result);
  } catch (err) {
    logger.error(err.stack);
    return next(err);
  }
};

/**
 * Get offer by {idOperator, idOffer}
 */
const getTransactionByOffer = async (req, res, next) => {
  try {
    const { idOperator , idOffer } = req.params;

    const transactions = await requestHelper.queryRequest(
      hlf.chaincodeId.transaction,
      ChainMethod.queryTransactionByOffer,
      { idOffer , idOperator });

    if (!transactions || transactions.length === 0) {
      return res.status(httpStatus.NOT_FOUND).send({ message: TransactionMsg.TRANSACTION_GET_ID_NOT_EXIST });
    }

    // remove unused keys
    const result = _.map(transactions, o => {
      return _.omit(o, ['docType']);
    });

    return res.status(httpStatus.OK).send(result);
  } catch (err) {
    logger.error(err.stack);
    return next(err);
  }

};

/**
 * Create the offer using request body data
 */
const createTransaction = async (req, res, next) => {
  try {
    const { username } = req.user;

    const transaction = req.body;
    transaction.createdAt = moment().unix();

    // check if offer exist
    const offers = await requestHelper.queryRequest(
      hlf.chaincodeId.offer,
      ChainMethod.queryOfferById,
      { idOffer: transaction.idOffer , idOperator: transaction.idOperator });

    if (!offers || offers.length === 0) {
      return res.status(httpStatus.BAD_REQUEST).send({ message: TransactionMsg.TRANSACTION_OFFER_NOT_EXIST });
    }

    // Create the transaction data to submit
    const  { payload } = await requestHelper.invokeRequest(
      hlf.chaincodeId.transaction ,
      ChainMethod.createTransaction,
      transaction,
      username,
      false);

    let idOperatorReceiver = transaction.idOperator;

    if (transaction.type === "CONFIRMATION" || transaction.type === "REJECTION" ) {
      idOperatorReceiver = transaction.idOperatorPassenger;
    }
    
    if (transaction.type === "CONFIRMATION") {
      // await is mandatory for tests
      transaction.id = payload.id;
      await createProof(username, offers[0], transaction);
    }

    // if BOOKING_CANCELLATION
    if (transaction.type === validTransactionType[6]){
      const { idOperator: receiver } = req.user;

      if (transaction.idOperator === receiver){
        idOperatorReceiver = transaction.idOperatorPassenger;
      }
    }

    // notify only if operators are different
    if (transaction.idOperator !== transaction.idOperatorPassenger) {
      await sendNotification(transaction.idOffer, transaction.idOperator, transaction.idPassenger, transaction.passengerShortname, transaction.idOperatorPassenger, null, transaction.type, idOperatorReceiver, payload.id);
    }

    return res.status(httpStatus.CREATED).send({ result: payload, message: TransactionMsg.OFFER_POST_SUCCESSFULLY });
  } catch (err) {
    logger.error(err.stack);
    return next(err);
  }
};

module.exports = {
  createTransaction,
  getTransactionById,
  getTransactionByOffer
};
