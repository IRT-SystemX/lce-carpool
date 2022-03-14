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

const express = require("express");
const validate = require("express-validation");
const validation = require('../../validation');
const { proofCtrl } = require("../../controllers");
const { isAuthorized } = require('../../middlewares/jwt.auth');

const router = express.Router();

/**
* @swagger
*  definitions:
*     Proof:
*        required:
*          - idProof
*          - idTrip
*          - driverShortname
*          - idOperatorDriver
*          - passengerShortname
*          - idOperatorPassenger
*          - origin
*          - destination
*          - date
*
*        properties:
*          idProof:
*            type: string
*          idTrip:
*            type: string
*          driverShortname:
*            type: string
*          idOperatorDriver:
*            type: string
*            enum: [op1,op2]
*          passengerShortname:
*            type: string
*          idOperatorPassenger:
*            type: string
*            enum: [op1,op2]
*          origin:
*            type: string
*          destination:
*            type: string
*          date:
*            type: string
*            format: date-time
*          created_at:
*            type: number
*/

/**
* @swagger
*  /proof:
*    post:
*      description: Upgrade a proof class.
*      operationId: upgradeProof
*      consumes:
*        - application/json
*      security:
*        - Bearer: []
*      parameters:
*        - in: body
*          name: body
*          required: true
*          description: A JSON object containing transaction and gps
*          schema:
*            $ref: "#/definitions/PostProofBody"
*      responses:
*        "200":
*          description: OK
*/

/* POST proof, upgrade a proof */
router.post('/', isAuthorized, validate(validation.proof.post), proofCtrl.upgradeProof);

/**
* @swagger
*  /proof/{idTrip}/:
*     get:
*      description: Get the proofs of a specific trip.
*      operationId: getProofByTrip
*      consumes:
*        - application/json
*      security:
*        - Bearer: []
*      parameters:
*        - name: idTrip
*          in: path
*          description: The id of the trip
*          required: true
*          type: string
*      responses:
*        "200":
*          description: OK
*          schema:
*            $ref: "#/definitions/Proof"
*/

/* GET proofs, search proofs for a specific trip */
router.get('/:idProof', isAuthorized, validate(validation.proof.getById), proofCtrl.getProofByTrip);

module.exports = router;
