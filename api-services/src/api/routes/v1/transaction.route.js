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
const { transactionCtrl } = require('../../controllers');
const { isAuthorized } = require('../../middlewares/jwt.auth');

const router = express.Router();

/**
 * @swagger
 *  definitions:
*     Transaction:
*        required:
*          - idOffer
*          - idOperator
*          - idPassenger
*          - passengerShortname
*          - idOperatorPassenger
*          - type
 *          - timestamp

*        properties:
 *           idTransaction:
 *             type: string
*           idOffer:
*             type: string
*           idOperator:
*             type: string
*             enum: [op1,op2]
*           idPassenger:
*             type: string
*           passengerShortname:
*             type: string
*           idOperatorPassenger:
*             type: string
*             enum: [op1,op2]
*           type:
*             type: string
*             enum: [INSCRIPTION,CONFIRMATION,REJECTION,PAYEMENT]
 *           timestamp:
 *             type: number
*/

/** @swagger
 * /transaction/{idOperator}/{idOffer}:
 *   get:
 *     description: Get the last status of all the inscriptions of a specific offer
 *     operationId: getTransactions
 *     parameters:
 *        - name: idOffer
 *          in: path
 *          description: The id of the offer
 *          required: true
 *          type: string
 *        - name: idOperator
 *          in: path
 *          description: The id of the operator
 *          required: true
 *          type: string
 *          enum: [op1,op2]
 *     responses:
 *       "200":
 *           description: OK
 *           schema:
 *             type: array
 *             items:
 *               $ref: "#/definitions/Transaction"
 *       default:
 *           description: Error
 *           schema:
 *             $ref: "#/definitions/ErrorResponse"
 */
/* GET transactions related to a specific offer */
router.get('/:idOperator/:idOffer', validate(validation.transaction.getAllPassengers), transactionCtrl.getTransactionByOffer);

/** @swagger
 * /transaction/{idTransaction}:
 *   get:
 *       description: Get the last transaction of a passenger of a specific offer
 *       # used as the method name of the controller
 *       operationId: getTransactionPassenger
 *       parameters:
 *          - name: idTransaction
 *            in: path
 *            description: The id of the transaction
 *            required: true
 *            type: string
 *       responses:
 *          "200":
 *             description: OK
 *             schema:
 *                $ref: "#/definitions/Transaction"
 *          default:
 *             description: Error
 *             schema:
 *                $ref: "#/definitions/ErrorResponse"
 */
// Get last transaction of a specific passenger related to an offer
router.get('/:idTransaction', validate(validation.transaction.get), transactionCtrl.getTransactionById);

/** @swagger
 * /transaction:
*     post:
*         description: Push a transaction
*         # used as the method name of the controller
*         operationId: pushTransaction
*         consumes:
*         - application/json
*         parameters:
*             - in: body
*               name: transaction
*               required: true
*               description: A JSON object containing transaction
*               schema:
*                 $ref: "#/definitions/Transaction"
*         responses:
*             "201":
*                 description: Created
*                 schema:
*                     # a pointer to a definition
*                     $ref: "#/definitions/Transaction"
*                     # responses may fall through to errors
*             default:
*                 description: Error
*                 schema:
*                     $ref: "#/definitions/ErrorResponse"
 */
router.post('/', isAuthorized, validate(validation.transaction.post), transactionCtrl.createTransaction);

module.exports = router;
