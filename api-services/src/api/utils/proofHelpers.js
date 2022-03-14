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

const axios = require('axios');
const moment = require('moment');
const { chain } = require('lodash');
const logger = require('../../config/logger');
const { apiUrl, rnpc } = require("../../config");

const ROLES = {
  DRIVER: 'driver',
  PASSENGER: 'passenger',
}

const getAxiosConfig = (authorization) => {
  return ({
    headers: {
      'Authorization': authorization,
      'Content-Type': 'application/json'
    }
  });
}

const getSortedProofs = (proofs) => {
  const preSortedProofs = chain(proofs)
    .groupBy("role")
    .map((value, key) => ({ role: key, users: value }))
    .value();

  const driver = preSortedProofs.find(proof => proof.role === ROLES.DRIVER).users[0];
  const passenger = preSortedProofs.find(proof => proof.role === ROLES.PASSENGER).users;

  return ({ driver, passenger });
}

/* Create Proof */

const createProofBlck = (offer, transaction, role) => {
  const idUser = (role === ROLES.DRIVER) ? offer.idDriver : transaction.idPassenger;
  const userShortname = (role === ROLES.DRIVER) ? offer.driverShortname : transaction.passengerShortname
  const idOperatorUser = (role === ROLES.DRIVER) ? offer.idOperator : transaction.idOperatorPassenger;

  return {
    idTrip: offer.idTrip,
    idUser,
    userShortname,
    idOperatorUser,
    role,
    type: transaction.type,
    created_at: moment().unix(),
    idOperator: offer.idOperator,
    idOffer: offer.idOffer,
    origin: offer.origin,
    destination: offer.destination,
    departureDate: offer.startDate,
    arrivalDate: offer.endDate,
    departureGps: offer.departureGps,
    arrivalGps: offer.arrivalGps,
  }
}

/* Upgrade Proof */

const getProofToUpgrade = async (authorization, transaction) => {
  try {
    const { idOperator, idOffer, idOperatorPassenger } = transaction;

    const urlOffer = `${apiUrl}/api/v1/offer/${idOperator}/${idOffer}`;
    const resOffer = await axios.get(
      urlOffer,
      getAxiosConfig(authorization)
    );

    const urlProof = `${apiUrl}/api/v1/proof/${resOffer.data.idTrip}`;
    const resProof = await axios.get(
      urlProof,
      getAxiosConfig(authorization)
    );

    const sortedProofs = chain(resProof.data)
      .groupBy("role")
      .map((value, key) => ({ role: key, users: value }))
      .value();

    if (idOperatorPassenger)
      return (sortedProofs.find(proof => proof.role === ROLES.PASSENGER).users.find(proof => { return proof.idUser === transaction.idPassenger }));
    return (sortedProofs.find(proof => proof.role === ROLES.DRIVER).users[0]);
  } catch (err) {
    logger.error(err.stack);
    return ([]);
  }
}

/* Send Proof */

const isValidOperator = (idOperator) => {
  return rnpc.proofAuth[idOperator];
}

const isValidPhone = (phone) => {
  return !(!phone || phone === "0000000000");


}

const isValidGps = (departureGps, arrivalGps) => {
  return !((!departureGps || !arrivalGps) || (departureGps === "undefined,undefined" || arrivalGps === "undefined,undefined"));


}

const createProofRnpcUser = (rnpcProof, proof) => {
  const {
    userShortname,
    idOperatorUser,
    role,
    origin,
    destination,
    departureDate,
    arrivalDate,
    departureGps,
    arrivalGps,
    userDepartureDate,
    userArrivalDate,
    userDepartureGps,
    userArrivalGps,
    userPhone,
  } = proof;
  let startGps = departureGps;
  let endGps = arrivalGps;
  let startDate = moment.unix(departureDate).toDate().toISOString();
  let endDate = moment.unix(arrivalDate).toDate().toISOString();
  const newProof = rnpcProof;

  if (!isValidOperator(idOperatorUser) || !isValidPhone(userPhone)) {
    return newProof;
  }

  if (isValidGps(userDepartureGps, userArrivalGps)) {
    newProof.operator_class = (newProof.operator_class === "A") ? "B" : "C";
    startGps = userDepartureGps;
    endGps = userArrivalGps;
    startDate = moment.unix(userDepartureDate).toDate().toISOString();
    endDate = moment.unix(userArrivalDate).toDate().toISOString();
  }

  newProof[role] = {
    "identity": {
      "firstname": userShortname,
      "phone": userPhone,
    },
    "start": {
      "datetime": startDate,
      "literal": origin,
      "lat": parseFloat(startGps.split(",")[0]),
      "lon": parseFloat(startGps.split(",")[1]),
      "country": "France"
    },
    "end": {
      "datetime": endDate,
      "literal": destination,
      "lat": parseFloat(endGps.split(",")[0]),
      "lon": parseFloat(endGps.split(",")[1]),
      "country": "France"
    },
    "incentives": []
  };

  if (role === ROLES.DRIVER) {
    newProof.driver.revenue = 0;
  } else {
    newProof.passenger.contribution = 0;
    newProof.passenger.seats = 1;
  }

  return newProof;
}

const createProofRnpc = (proofDriver, proofPassenger) => {
  const {
    idProof,
    idTrip,
  } = proofPassenger;

  let rnpcProof = {
    "journey_id": idProof,
    "operator_journey_id": idTrip,
    "operator_class": "A",
  };

  rnpcProof = createProofRnpcUser(rnpcProof, proofDriver);
  rnpcProof = createProofRnpcUser(rnpcProof, proofPassenger);

  return rnpcProof;
}

module.exports = {
  ROLES,
  getAxiosConfig,
  getSortedProofs,
  createProofBlck,
  getProofToUpgrade,
  createProofRnpc,
};
