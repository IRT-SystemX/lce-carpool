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

const Joi = require('./extension.validation');
const { validIdOperator } = require('../../config');

module.exports.getById = {
  params: {
    idProof: Joi.string().required()
  }
};

module.exports.getByTrip = {
  params: {
    idOffer: Joi.string().required(),
    idOperator: Joi.string().required()
  }
};

module.exports.post = {
  body: {
    idOffer: Joi.string().required(),
    idOperator: Joi.string().valid(validIdOperator).required(),
    gps: Joi.string().required(),
    phone: Joi.string().allow(null).required(),
    type: Joi.string().valid('TRIP_STARTED', 'TRIP_ENDED').required(),
    idPassenger: Joi.string().allow(null).optional(),
    passengerShortname: Joi.string().allow(null).optional(),
    idOperatorPassenger: Joi.string().valid(validIdOperator).allow(null).optional(),
  }
};
