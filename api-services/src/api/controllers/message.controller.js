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
const crypto = require('crypto');
const Message = require('../models/message.model');
const { sendNotification, sendStatus } = require('../services/notification.service');
const { MessageMsg } = require('../../config/logging.enums');
const {validNotificationJourneyStep,validMessageStatus} = require('../../config');


const _computeHash = (text) => {
  return crypto
    .createHash('sha1')
    .update(text)
    .digest('base64');
};

const get = async (req, res, next) => {
  try {
    const message = await Message.get(req.params.id);
    res.status(httpStatus.OK).json(message);
  } catch (error) {
    next(error);
  }
};

// Create message
const create = async (req, res, next) => {
  try {
    // compute the hash digest
    const { idOffer,
      idOperator,
      idPassenger,
      passengerShortname,
      idOperatorPassenger,
      messageTxt } = req.body;

    const { idOperator: receiver } = req.user;

    let idOperatorReceiver = idOperator;

    if (idOperator === receiver){
      idOperatorReceiver = idOperatorPassenger;
    }

    const digest = await _computeHash(messageTxt);

    // Save the message entity
    const state = validMessageStatus[1];
    const message = new Message({ digest,state, idOffer, idOperator, idPassenger, idOperatorPassenger });
    await message.save();

    // forward the message
    await sendNotification(idOffer, idOperator, idPassenger, passengerShortname, idOperatorPassenger, messageTxt, validNotificationJourneyStep[0], idOperatorReceiver, message.id);

    res.status(httpStatus.OK).json({
      result: { id: message.id },
      message: MessageMsg.MESSAGE_POST_SUCCESSFULLY
    });

    await Message.updateOne({ id: message.id }, { state: validMessageStatus[2] }).exec();

  } catch (error) {
    next(error);
  }
};

// update the select message by hash
const update = async (req, res, next) => {
  try {
    const {state} = req.body;
    const {idMessage} = req.params;

    try {
      await Message.updateOne({ id: idMessage }, { state });
    } catch(err) {
      return res.status(httpStatus.BAD_REQUEST).json({ message: MessageMsg.MESSAGE_UPDATED_NO_CONTENT });
    }

    // trigger notification updates
    const {idOperator} = await  Message.get(idMessage);
    await sendStatus(idMessage, idOperator, state);

    // return the results
    return res.status(httpStatus.OK).json({ message: MessageMsg.MESSAGE_UPDATED_SUCCESSFULLY });
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  get,
  create,
  update,
  _computeHash
};
