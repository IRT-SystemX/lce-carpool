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
const { offerCtrl } = require('../../controllers');
const { isAuthorized } = require('../../middlewares/jwt.auth');

const router = express.Router(); // eslint-disable-line new-cap

/**
 * @swagger
*  definitions:
*    Offer:
*        required:
*            - idOffer
*            - idDriver
 *            - shortnameDriver
*            - origin
*            - destination
 *            - departureGPS
 *            - arrivalGPS
*            - date
*            - idOperator
*            - price
*            - availableSeats
*        properties:
*          idOffer:
*            type: string
*          idDriver:
 *            type: string
*          driverShortname:
*            type: string
*          origin:
*            type: string
*          destination:
*            type: string
 *          departureGPS:
 *            type: string
 *          arrivalGPS:
 *            type: string
*          date:
*            type: string
*            format: date-time
*          idOperator:
*            type: string
*            enum: [OP1,OP2]
*          price:
*            type: number
*          availableSeats:
*            type: number
 *
 *    OfferDetailed:
 *       required:
 *            - offer
 *            - driver
 *            - trip
 *            - vehicle
 *       properties:
 *       allOf:
 *       - $ref: "#/definitions/Offer"
 *       - $ref: "#/definitions/Driver"
 *       - $ref: "#/definitions/Trip"
 *       - $ref: "#/definitions/Vehicle"
 *
 *    Driver:
 *       required:
 *           - idDriver
 *           - shortName
 *       properties:
 *          idDriver:
 *              type: string
 *          shortName:
 *              type: string
 *          Photo:
 *              type: string
 *          Age:
 *              type: number
 *          Note:
 *               type: number
 *          IdentityVerified:
 *               type: boolean
 *          PhoneVerified:
 *              type: boolean
 *          EmailVerified:
 *               type: boolean
 *          Lang:
 *              type: string

 *    Trip:
 *       required:
 *           - distance
 *           - duration
 *       properties:
 *           distance:
 *              type: string
 *           duration:
 *              type: string
 *           hasHighways:
 *              type: boolean
 *           departure:
 *               type: string
 *           arrival:
 *               type: string
 *           polyline:
 *              type: string
 *    Vehicle:
 *       required:
 *           - availableSeats
 *       properties:
 *           photo:
 *              type: string
 *           brand:
 *              type: string
 *           model:
 *               type: string
 *           color:
 *              type: string
 *           availableSeats:
 *               type: number
 *
 *    ErrorResponse:
 *        required:
 *            - status
 *        properties:
 *            message:
 *               type: string
 *            status:
 *               type: integer
 */
/** @swagger
 * /offer:
 *      get:
*       description: Search an offer, returns list of offers
*       operationId: getOffer
*       parameters:
*          - name: origin
*            in: query
*            description: The origin of the offer
*            required: true
*            type: string
*          - name: destination
*            in: query
*            description: The destination of the offer
*            required: true
*            type: string
*          - name: date
*            in: query
*            description: The date of the offer
*            required: true
*            type: string
*            format: date-time
*       responses:
*          "200":
*            description: OK
*            schema:
*                type: array
*                items:
*                   $ref: "#/definitions/Offer"
*          default:
*            description: Error
*            schema:
*              $ref: "#/definitions/ErrorResponse"
*/

/* GET offers, search offer */
router.get('/', isAuthorized, validate(validation.search), offerCtrl.getOfferByGeoHash);

/** @swagger
*   /offer/{idOperator}/{idOffer}:
*       get:
*           description: Get offer details
*           operationId: getOfferDetails
*           parameters:
*               - name: idOffer
*                 in: path
*                 description: The id of the offer
*                 required: true
*                 type: string
 *               - name: idOperator
 *                 in: path
 *                 description: The operator of the offer
 *                 required: true
 *                 type: string
*           responses:
*                   "200":
*                       description: OK
*                       schema:
*                           $ref: "#/definitions/OfferDetailed"
*                   default:
*                       description: Error
*                       schema:
*                            $ref: "#/definitions/ErrorResponse"
*/
// Get offer details
router.get('/:idOperator/:idOffer', isAuthorized, validate(validation.offer.get), offerCtrl.getOfferById);

/** @swagger
*   /offer:
*       post:
*         description: Create a new offer
*         operationId: createOffer
*         consumes:
*            - application/json
*         parameters:
*            - in: body
*              name: offer
*              required: true
*              description: A JSON object containing offers
*              schema:
 *                 type: array
 *                 items:
*                    $ref: "#/definitions/OfferDetailed"
*         responses:
*           "201":
*                description: Created
*                schema:
 *                  type: array
*                  items:
 *                    $ref: "#/definitions/OfferDetailed"
*           default:
*                  description: Error
*                  schema:
*                    $ref: "#/definitions/ErrorResponse"
*/
// router.post('/', validate(validation.offer.post), createOffers);
router.post('/', isAuthorized, validate(validation.offer.post), offerCtrl.createOffer);
// router.post('/single/:userId', validate(validation.offer.post), offerCtrl.createOffer);

/** @swagger
 *   /offer:
 *       patch:
 *         description: Update the available seats of an offer
 *         operationId: updateOffer
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
 *            - name: availableSeats
 *              in: body
 *              required: true
 *              description: The number of available seats
 *              type: number
 *         responses:
 *           "200":
 *                description: OK
 *                schema:
 *                  $ref: "#/definitions/Offer"
 *           default:
 *                  description: Error
 *                  schema:
 *                    $ref: "#/definitions/ErrorResponse"
 */
router.patch('/:idOperator/:idOffer', isAuthorized, validate(validation.offer.patch), offerCtrl.updateAvailableSeats);

module.exports = router;
