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

const mongoose = require('mongoose');
const httpStatus = require('http-status');
const { omitBy, isNil } = require('lodash');
const APIError = require('../utils/APIError');
const config = require('../../config');

/**
 * message status
 */

const messageSchema = new mongoose.Schema({
  digest: {
    type: String,
    required: true,
    minlength: 6,
    maxlength: 128,
  },
  state: {
    type: String,
    enum: config.validMessageStatus,
    default: 'none',
  },
  idOffer: {
    type: String,
    required: true
  },
  idOperator: {
    type: String,
    enum: config.validIdOperator,
    required: true
  },
  idPassenger: {
    type: String,
    required: true
  },
  idOperatorPassenger: {
    type: String,
    enum: config.validIdOperator,
    required: true
  }

}, {
  timestamps: true,
});

messageSchema.method({
});

messageSchema.statics = {
  status: config.validMessageStatus,

  /**
     * Get message
     *
     * @param {ObjectId} id - The objectId of message.
     * @returns {Promise<Message, APIError>}
     */
  async get(id) {
    try {
      let message;

      if (mongoose.Types.ObjectId.isValid(id)) {
        message = await this.findById(id).lean().exec();
      }

      if (message) {
        return message;
      }

      throw new APIError({
        message: 'Message does not exist',
        status: httpStatus.NOT_FOUND,
      });
    } catch (error) {
      throw error;
    }
  },

  /**
     * List messages in descending order of 'createdAt' timestamp.
     *
     * @param {number} skip - Number of messages to be skipped.
     * @returns {Promise<User[]>}
     */
  list({ page = 1, perPage = 30, digest, state, }) {
    const options = omitBy({ digest, state }, isNil);

    return this.find(options)
      .sort({ createdAt: -1 })
      .skip(perPage * (page - 1))
      .limit(perPage)
      .exec();
  },
};

module.exports = mongoose.model('Message', messageSchema);
