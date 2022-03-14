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

const httpStatus = require("http-status");
const axios = require('axios');
const _ = require('lodash');
const moment = require('moment');
const schedule = require('node-schedule');
const { requestHelper } = require("../../config/hlf");
const ChainMethod = require("../utils/chainMethod.enum");
const proofHelpers = require("../utils/proofHelpers");
const { hlf, rnpc } = require("../../config");
const logger = require('../../config/logger');
const { ProofMsg } = require('../../config/logging.enums');

/**
 * Send the proof
 */

const sendProof = async (idTrip) => {
  try {
    const proofs = await requestHelper.queryRequest(
      hlf.chaincodeId.proof,
      ChainMethod.queryProofByTrip,
      { idTrip });

    if (!proofs || proofs.length === 0) return;

    const sortedProofs = proofHelpers.getSortedProofs(proofs);

    Object.keys(sortedProofs.passenger).forEach(async (item, i) => {
      const proofRnpc = proofHelpers.createProofRnpc(sortedProofs.driver, sortedProofs.passenger[i]);

      if (!("driver" in proofRnpc) && !("passenger" in proofRnpc)) {
        logger.info("At least one user should be in proof. Proof not send.");
      } else {
        /* eslint-disable no-await-in-loop */
        await axios.post(
          rnpc.urlXp,
          JSON.stringify(proofRnpc),
          proofHelpers.getAxiosConfig(rnpc.tokenXp)
        );

        logger.info(`Proof (id: ${proofRnpc.journey_id}) has been sent to RNPC.`);
      }
    });
  } catch (err) {
    logger.error(err.stack);
  }
};

/**
 * Upgrade the proof
 */

const upgradeProof = async (req, res, next) => {
  try {
    const { idOperator, username } = req.user;
    const { authorization } = req.headers;
    const { type, gps, phone } = req.body;
    const transaction = req.body;

    /* Delete gps and phone from transaction object */
    delete transaction.gps;
    delete transaction.phone;

    /* Check operator */
    if (idOperator !== transaction.idOperator && idOperator !== transaction.idOperatorPassenger) {
      return res.status(httpStatus.BAD_REQUEST).send(ProofMsg.PROOF_PATCH_WRONG_OPERATOR);
    }

    const proof = await proofHelpers.getProofToUpgrade(authorization, transaction);
    if (!proof || proof.length === 0) {
      return res.status(httpStatus.NOT_FOUND).send({ message: ProofMsg.PROOF_GET_NO_PROOF_FOUND });
    }

    await requestHelper.invokeRequest(
      hlf.chaincodeId.proof,
      ChainMethod.upgradeProof,
      {
        idTrip: proof.idTrip,
        idUser: proof.idUser,
        idOperatorUser: proof.idOperatorUser,
        gps,
        date: moment().unix(),
        type,
        phone: phone || "0000000000"
      },
      username,
      false);

    return res.status(httpStatus.OK).send();
  } catch (err) {
    logger.error(err.stack);
    return next(err);
  }
};

/**
 * Create the proof
 */
const createProof = async (username, offer, transaction) => {
  try {
    const sendDate = moment.unix(offer.endDate).toISOString();
    
    const proofs = await requestHelper.queryRequest(
      hlf.chaincodeId.proof,
      ChainMethod.queryProofByTrip,
      { idOffer: offer.idOffer, idOperator: offer.idOperator });

    if (!proofs || proofs.length === 0) {
      const proof = proofHelpers.createProofBlck(offer, transaction, proofHelpers.ROLES.DRIVER);
      await requestHelper.invokeRequest(
        hlf.chaincodeId.proof,
        ChainMethod.createProof,
        proof,
        username,
        false);

      if (rnpc.enabled === true) schedule.scheduleJob(sendDate, () => sendProof(proof.idTrip));
    }

    const proof = proofHelpers.createProofBlck(offer, transaction, proofHelpers.ROLES.PASSENGER);
    await requestHelper.invokeRequest(
      hlf.chaincodeId.proof,
      ChainMethod.createProof,
      proof,
      username,
      false);

  } catch (err) {
    logger.error(err.stack);
  }
};

/**
 * Get proof by idProof
 */
const getProofById = async (req, res, next) => {
  try {
    const { idProof } = req.params;

    const proofs = await requestHelper.queryRequest(
      hlf.chaincodeId.proof,
      ChainMethod.queryProofById,
      { idProof });

    if (!proofs || proofs.length === 0) {
      return res.status(httpStatus.NOT_FOUND).send({ message: ProofMsg.PROOF_GET_NO_PROOF_FOUND });
    }

    const result = _.map(proofs, o => {
      return _.omit(o, ['docType']);
    });

    return res.status(httpStatus.OK).send(result);
  } catch (err) {
    logger.error(err.stack);
    return next(err);
  }
};

/**
 * Get proof by idTrip
 */
const getProofByTrip = async (req, res, next) => {
  try {
    const { idTrip } = req.params;

    const proofs = await requestHelper.queryRequest(
      hlf.chaincodeId.proof,
      ChainMethod.queryProofByTrip,
      { idTrip });

    if (!proofs || proofs.length === 0) {
      return res.status(httpStatus.NOT_FOUND).send({ message: ProofMsg.PROOF_GET_NO_PROOF_FOUND });
    }

    const result = _.map(proofs, o => {
      return _.omit(o, ['docType']);
    });

    return res.status(httpStatus.OK).send(result);
  } catch (err) {
    logger.error(err.stack);
    return next(err);
  }
};

module.exports = {
  upgradeProof,
  createProof,
  getProofById,
  getProofByTrip,
};
