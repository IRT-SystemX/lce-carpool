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

const express = require('express');
const validate = require('express-validation');
const validation = require('../../validation');
const { messageCtrl } = require('../../controllers');
const { isAuthorized } = require('../../middlewares/jwt.auth');

const router = express.Router();

/**
 * @swagger
 * definitions:
 *    Message:
 *        required:
 *            - idOffer
 *            - idDriver
 *            - shortnameDriver
 *            - idOperator
 *            - idPassenger
 *            - shortnamePassenger
 *            - idOperatorPassenger
 *            - messageTxt
 *            - timestamp
 *        properties:
 *          idOffer:
 *            type: string
 *          idOperator:
 *            type: string
 *            enum: [OP1,OP2]
 *          idDriver:
 *            type: string
 *          shortnameDriver:
 *            type: string
 *          idPassenger:
 *            type: string
 *          shortnamePassenger:
 *            type: string
 *          idOperatorPassenger:
 *            type: string
 *            enum: [OP1,OP2]
 *          messageTxt:
 *            type: string
 *          timestamp:
 *            type: number
 */

/** @swagger
 *   /message:
 *       post:
 *         description: Send a message
 *         operationId: sendMessage
 *         consumes:
 *            - application/json
 *         parameters:
 *            - in: body
 *              name: message
 *              required: true
 *              description: A JSON object containing a message
 *              schema:
 *                 $ref: "#/definitions/Message"
 *         responses:
 *           "200":
 *                description: OK
 *           default:
 *                  description: Error
 *                  schema:
 *                    $ref: "#/definitions/ErrorResponse"
 */
router.post('/', isAuthorized,
  validate(validation.message.post),
  messageCtrl.create);

/** @swagger
 *   /message:
 *       patch:
 *         description: Update message status
 *         operationId: updateMessageStatus
 *         consumes:
 *            - application/json
 *         parameters:
 *            - name: idOffer
 *              in: path
 *              description: The id of the offer
 *              required: true
 *              type: string
 *            - name: idOperator
 *              in: path
 *              description: The operator of the offer
 *              required: true
 *              type: string
 *            - name: idPassenger
 *              in: path
 *              description: The id of the passenger
 *              required: true
 *              type: string
 *            - name: idOperatorPassenger
 *              in: path
 *              description: The operator of the passenger
 *              required: true
 *              type: string
 *            - name: status
 *              in: body
 *              required: true
 *              description: The message status
 *              type: string
 *         responses:
 *           "200":
 *                description: OK
 *           default:
 *                  description: Error
 *                  schema:
 *                    $ref: "#/definitions/ErrorResponse"
 */
router.patch('/:idMessage', isAuthorized,
  validate(validation.message.patch),
  messageCtrl.update);

module.exports = router;
