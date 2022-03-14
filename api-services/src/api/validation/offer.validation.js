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

const offerValidation = Joi.object().keys({
  idOffer: Joi.string().required(),
  idOperator: Joi.string().valid(validIdOperator).required(),
  idDriver: Joi.string().required(),
  driverShortname: Joi.string().required(),
  origin: Joi.string().required(),
  destination: Joi.string().required(),
  departureGPS: Joi.string().required(),
  arrivalGPS: Joi.string().required(),
  date: Joi.date().iso().min(Date.now()),
  startDate: Joi.date().iso().min(Date.now()),
  endDate: Joi.date().iso().min(Date.now()).optional(),
  price: Joi.number().required(),
  availableSeats: Joi.number().integer().max(4).min(1).default(3),
  driver: Joi.object({
    photo: Joi.string().allow('', null).empty(['', null]).uri().optional(),
    age: Joi.number().optional(),
    note: Joi.number().optional(),
    identityVerified: Joi.boolean().default(false),
    phoneVerified: Joi.boolean().default(false),
    emailVerified: Joi.boolean().default(false),
    lang: Joi.array().items(Joi.string()).default(['French'])
  }).optional(),
  trip: Joi.object({
    distance: Joi.number().optional(),
    duration: Joi.string().optional(),
    hasHighways: Joi.boolean().optional(false),
    departure: Joi.object().optional().geojson().default({}),
    arrival:  Joi.object().optional().geojson().default({}),
    path: Joi.string().optional()
  }).optional(),
  vehicle: Joi.object({
    photo: Joi.string().allow('', null).empty(['', null]).uri().optional(),
    brand: Joi.string().optional(),
    model: Joi.string().optional(),
    color: Joi.string().optional(),
    availableSeats: Joi.number().integer().max(4).min(1).default(3)
  }).optional()
}).options({ stripUnknown: true })
  .or('date', 'startDate');

module.exports.get = {
  params: {
    idOffer: Joi.string().required(),
    idOperator: Joi.string().valid(validIdOperator).required()
  }
};

module.exports.post = {
  body: {
    offers: Joi.array().items(offerValidation).required()
  }
};

module.exports.patch = {
  params: {
    idOffer: Joi.string().required(),
    idOperator: Joi.string().valid(validIdOperator).required()
  },
  body: {
    availableSeats: Joi.number().integer().min(0).max(4)
      .required()
  }
};

module.exports.offerValidation = offerValidation;
