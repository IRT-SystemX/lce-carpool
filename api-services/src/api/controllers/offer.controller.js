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

const geohash = require('ngeohash');
const proximityhash = require('proximityhash');
const httpStatus = require('http-status');
const flatten = require('flat');
const {unflatten} = require('flat');
const camelcaseKeys = require('camelcase-keys');
const moment = require('moment');
const _ = require('lodash');
const Json = require('../utils/json');
const { requestHelper } = require('../../config/hlf');
const ChainMethod = require('../utils/chainMethod.enum');
const { geohashLevel,hlf } = require('../../config');
const logger = require('../../config/logger');
const { OfferMsg } = require('../../config/logging.enums');



/**
 * Compute the geohash string value for both the origin and the destination
 * @param originStr {string} origin GPS coordinates 'lng, lat'
 * @param destinationStr  {string} destination GPS coordinates 'lng, lat'
 * @param precision {number} geoHash precision level (default 6)
 * @returns {{originGeoHash: String, destinationGeoHash: String}}
 */
const computeGeohash = (originStr, destinationStr, precision = geohashLevel) => {
  const origin = originStr.split(',');
  const destination = destinationStr.split(',');

  return {
    originGeoHash: geohash.encode(origin[0], origin[1], precision),
    destinationGeoHash: geohash.encode(destination[0], destination[1], precision)
  };
};

const computeGeohashesWithRadius = (originStr, destinationStr, radius, precision = geohashLevel) => {
  const origin = originStr.split(',');
  const destination = destinationStr.split(',');

  const originOptions = {
    latitude : parseFloat(origin[0]), // required
    longitude : parseFloat(origin[1]),// required
    "radius" : radius,// in mts, required
    "precision": precision,// geohash precision level , required
    georaptorFlag : true,  // set true to compress hashes using georaptor
    minlevel : 1, // minimum geohash level, default value: 1
    maxlevel : 12, // maximum geohash level, default value: 12
    approxHashCount : true // set to true to round off if the hashes count is greater than 27
  };

  const destinationOptions = {
    latitude : parseFloat(destination[0]), // required
    longitude : parseFloat(destination[1]),// required
    "radius" : radius,// in mts, required
    "precision": precision,// geohash precision level , required
    georaptorFlag : true,  // set true to compress hashes using georaptor
    minlevel : 1, // minimum geohash level, default value: 1
    maxlevel : 12, // maximum geohash level, default value: 12
    approxHashCount : true // set to true to round off if the hashes count is greater than 27
  };

  const originGeoHashs = proximityhash.createGeohashes(originOptions);
  const destinationGeoHashs = proximityhash.createGeohashes(destinationOptions);

  return {
    originGeoHashs,
    destinationGeoHashs
  };
};

/**
 * Create the offer using request body data
 */
const createOffer = async (req, res, next) => {
  try {
    const { username, idOperator } = req.user;

    const { offers } = req.body;
    const offersBlck = offers.filter(item => item.idOperator === idOperator);
    const nonConformOffers = offers.filter(item => item.idOperator !== idOperator);

    for(let i= 0; i < offersBlck.length; i++) { // eslint-disable-line no-plusplus
      const offer = offersBlck[i];

      const {
        departureGPS,
        arrivalGPS,
      } = offer;

      const {originGeoHash, destinationGeoHash} = computeGeohash(departureGPS, arrivalGPS);
      if (Object.keys(offer).includes("trip")){
        offer.trip.departure = Json.serializeJson(offer.trip.departure);
        offer.trip.arrival = Json.serializeJson(offer.trip.arrival);
      }
      if (Object.keys(offer).includes("driver")) {
        offer.driver.lang = offer.driver.lang.join();
      }
      let offerBlck = camelcaseKeys(flatten(offer));
      offerBlck = Object.assign(offerBlck, {
        'geohashLevel': geohashLevel,
        'geohashArrival': destinationGeoHash,
        'geohashDeparture': originGeoHash
      });
      // convert iso date to unix timestamp
      let day ;
      if (Object.keys(offerBlck).includes("date")) {
        day = offerBlck.date;
        offerBlck.startDate = moment(offerBlck.date).unix();
        offerBlck.date = moment(offerBlck.date).unix();
      }
      else {
        day = offerBlck.startDate;
        offerBlck.date = moment(offerBlck.startDate).unix();
        offerBlck.startDate = moment(offerBlck.startDate).unix();
      }

      if (!Object.keys(offerBlck).includes("endDate")) {
        offerBlck.endDate = moment(day).endOf('day').unix();
      }
      else {
        offerBlck.endDate = moment(offerBlck.endDate).unix();
      }
      offersBlck[i] = offerBlck;
    }

    if (offersBlck.length > 0)
      await requestHelper.invokeRequest(hlf.chaincodeId.offer, ChainMethod.createOffers, offersBlck, username, false);

    // return the message
    let message = OfferMsg.OFFER_POST_SUCCESSFULLY;
    if (nonConformOffers.length > 0) {
      message = OfferMsg.OFFER_POST_SUCCESSFULLY_WITH_MISSING + nonConformOffers.map(item => item.idOperator).join(',');
    }

    return res.status(httpStatus.CREATED).send({message});
  } catch (err) {
    logger.error(err.stack);
    return next(err);
  }
};

/**
 * Get the offer by Id
 */
const getOfferById = async (req, res, next) => {
  try {
    const { idOperator , idOffer } = req.params;

    const offers = await requestHelper.queryRequest(hlf.chaincodeId.offer, ChainMethod.queryOfferById, { idOffer , idOperator });

    if (!offers || offers.length === 0) {
      return res.status(httpStatus.NOT_FOUND).send({ message: OfferMsg.OFFER_GET_ID_NOT_EXIST});
    }


    const result = _.map(offers, o => {

      o.startDate = moment.unix(o.startDate).toDate().toISOString();// eslint-disable-line no-param-reassign
      o.endDate = moment.unix(o.endDate).toDate().toISOString();// eslint-disable-line no-param-reassign
      o.date = moment.unix(o.date).toDate().toISOString();// eslint-disable-line no-param-reassign

      let offerString = JSON.stringify(o);

      
      offerString = offerString.replace(/trip/gi,"trip.");
      offerString = offerString.replace(/driver/gi,"driver.");
      offerString = offerString.replace(/vehicle/gi,"vehicle.");
      offerString = offerString.replace("iddriver.","idDriver");
      offerString = offerString.replace("idtrip.","idTrip");
      offerString = offerString.replace("driver.Shortname","driverShortname");
      
      const offerJson = unflatten(Json.deserializeJson(offerString));
      if (Object.keys(offerJson).includes("trip")) {
        offerJson.trip.Departure = Json.deserializeJson(offerJson.trip.Departure);
        offerJson.trip.Arrival = Json.deserializeJson(offerJson.trip.Arrival);
      }
      if (Object.keys(offerJson).includes("driver")) {
        offerJson.driver.Lang = offerJson.driver.Lang.split(',');
      }

      // remove unused keys
      return _.omit(offerJson, ['docType', 'geohashLevel', 'geohashDeparture', 'geohashArrival']);
    });

    // send response to the user
    return res.status(httpStatus.OK).send(result[0]);
  } catch (err) {
    logger.error(err.stack);
    return next(err);
  }
};

/**
 * Get the offer by Geohash tags
 */
const getOfferByGeoHash = async (req, res, next) => {
  try {

    const { idOperator : operator } = req.user;
    const { origin ,destination, date, radius} = req.query;

    // Calculate GeoHashs
    const { originGeoHashs, destinationGeoHashs } = computeGeohashesWithRadius(origin, destination, radius);
    const geohashArrival = destinationGeoHashs;
    const geohashDeparture = originGeoHashs;

    // Calculate date as unix timestamp
    const start_date = moment(date).unix(); // eslint-disable-line camelcase
    const end_date = moment(date).endOf('day').unix(); // eslint-disable-line camelcase

    const offers = await requestHelper.queryRequest(hlf.chaincodeId.offer,ChainMethod.queryOffersByGeohashList  , { geohashDeparture, geohashArrival, start_date, end_date });

    if (!offers || offers.length === 0) {
      return res.status(httpStatus.NO_CONTENT).send({ message: OfferMsg.OFFER_GET_NO_OFFER_FOUND });
    }

    // filter offers - return other operators' offers
    _.remove(offers, {idOperator : operator});


    // remove unused keys
    const result = _.map(offers, o => {
      o.startDate = moment.unix(o.startDate).toDate().toISOString();// eslint-disable-line no-param-reassign
      o.endDate = moment.unix(o.endDate).toDate().toISOString();// eslint-disable-line no-param-reassign
      o.date = moment.unix(o.date).toDate().toISOString();// eslint-disable-line no-param-reassign
      return _.omit(o, ['docType', 'geohashLevel', 'geohashDeparture', 'geohashArrival']);
    });

    // send response to the user
    return res.status(httpStatus.OK).send(result);
  } catch (err) {
    logger.error(err.stack);
    return next(err);
  }
};

/**
 * Update offer availableSeats fields
 */
const updateAvailableSeats = async (req, res, next) => {
  try {

    const {availableSeats} = req.body;

    const { idOperator , idOffer } = req.params;
    const { idOperator: userIdOperator , username } = req.user;

    if (idOperator !== userIdOperator) {
      return res.status(httpStatus.UNAUTHORIZED).send({ message: OfferMsg.OFFER_PATCH_WRONG_OPERATOR });
    }

    await requestHelper.invokeRequest(hlf.chaincodeId.offer, ChainMethod.updateOfferSeatAvailable ,
      { idOperator, idOffer, availableSeats },
      username,
      false);

    return res.status(httpStatus.OK).send({ message: OfferMsg.OFFER_PATCH_SUCCESSFULLY });
  } catch (err) {
    logger.error(err.stack);
    return next(err);
  }
};

module.exports = {
  createOffer,
  getOfferById,
  getOfferByGeoHash,
  updateAvailableSeats
};
