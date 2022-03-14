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

const Joi = require('joi');
const GJV = require("geojson-validation");
const moment = require('moment');

module.exports = Joi.extend((joi) => ({
  base: joi.object(),
  name: 'object',
  language: {
    geojson: 'needs to be a valid geojson scheme',
  },
  rules: [
    {
      name: 'geojson',
      validate(params, value, state, options) {
        if(GJV.valid(value)) {
          return value;
        }

        return this.createError('object.geojson', {v: value}, state, options);
      }
    },
  ]
}), (joi) => ({
  base: joi.string(),
  name: 'string',
  language: {
    durationISO: 'needs to be a valid ISO duration scheme',
  },
  rules: [
    {
      name: 'durationISO',
      validate(params, value, state, options) {
        if(moment.duration(value).toISOString() !== 'P0D'){
          return value;
        }

        return this.createError('string.durationISO', {v: value}, state, options);
      }
    },
  ]
}));
