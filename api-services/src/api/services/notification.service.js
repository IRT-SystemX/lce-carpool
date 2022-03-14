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

// this service is used to notify different operators by sending a notif entity to their specified webhook url
// notification is used to notify an INSCRIPTION, CONFIRMATION, BOOKING_CANCELLATION, LINKAGE (message) ...
const axios = require('axios');
const config = require('../../config');
const logger = require('../../config/logger');

const sendNotification = (idOffer,
  idOperator,
  idPassenger,
  passengerShortname,
  idOperatorPassenger,
  messageTxt,
  journeyStep,
  idOperatorReceiver,
  idNotification) => {

  const webhookUrl = config.webhooks[idOperatorReceiver];
  if (config.webhooks.isEnabled) {

    logger.debug(` idOffer ${idOffer}, idOperator ${idOperator}, idPassenger ${idPassenger}, 
    passengerShortname ${passengerShortname}, idOperatorPassenger ${idOperatorPassenger}, messageText ${messageTxt}, 
    JourneyStep ${journeyStep}, idNotification ${idNotification}, webhookUrl ${webhookUrl}`);

    return axios.post(webhookUrl, {
      idOffer,
      idOperator,
      idPassenger,
      passengerShortname,
      idOperatorPassenger,
      messageTxt,
      journeyStep,
      idNotification
    }, {
      headers: { 'content-type': 'application/json' },
    });
  }

  return Promise.resolve('Webhook not enabled')
};

const sendStatus = (messageTxt, idOperator, status) => {
  const webhookUrl = config.webhooks[idOperator];
  if (config.webhooks.isEnabled)
    return axios.post(webhookUrl, {messageTxt, status});

  return Promise.resolve('Webhook not enabled')
};

module.exports = {
  sendNotification,
  sendStatus,
};
