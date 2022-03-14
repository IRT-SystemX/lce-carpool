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

const httpStatus = require('http-status');
const { requestHelper } = require('../../config/hlf');
const { hlf } = require('../../config');
const ChainMethod = require('../utils/chainMethod.enum');
const logger = require('../../config/logger');
const Proxy = require('../utils/proxy');

/**
 * Create the keys using request body data
 */
const createKeys = async (req, res, next) => {
  try {
    const { username } = req.user;
    const { idOperator } = req.body;

    /* Generate keys */
    const kp = Proxy.generate_key_pair();

    const sk = kp.get_private_key();
    const pk = kp.get_public_key();

    const skB64 = Buffer.from(sk.to_bytes()).toString('base64');
    const pkB64 = Buffer.from(pk.to_bytes()).toString('base64');

    /* Send keys in base64 to the blockchain */
    const kms = { idOperator, publicKey: pkB64 };
    const kmsPrivate = { "privateKey": Buffer.from(skB64) };

    const kmsReq = await requestHelper.invokeRequest(
      hlf.chaincodeId.kms,
      ChainMethod.createKeys,
      kms,
      username,
      false,
      kmsPrivate);

    return res.status(httpStatus.CREATED).send({ message: kmsReq });
  } catch (err) {
    logger.error(err.stack);
    return next(err);
  }
};

/**
 * Create the rekey using request body data
 */
const createRekey = async (req, res, next) => {
  try {
    const { username } = req.user;
    const { idOperatorDelegator, idOperatorDelegatee } = req.body;

    const kmsReqDelegator = await requestHelper.queryRequest(
      hlf.chaincodeId.kms,
      ChainMethod.getKeysById,
      { idOperator: idOperatorDelegator });

    const kmsReqDelgatee = await requestHelper.queryRequest(
      hlf.chaincodeId.kms,
      ChainMethod.getKeysById,
      { idOperator: idOperatorDelegatee });

    if (!kmsReqDelegator.kmsPrivate || !kmsReqDelgatee.kms) {
      return res.status(httpStatus.NOT_FOUND).send({ message: 'Keys is missing' });
    }

    /* Generate re-encryption key */
    let sk = new Uint8Array(Buffer.from(kmsReqDelegator.kmsPrivate.privateKey.toString(), 'base64'));
    let pk = new Uint8Array(Buffer.from(kmsReqDelgatee.kms.publicKey.toString(), 'base64'));

    sk = Proxy.private_key_from_bytes(sk);
    pk = Proxy.public_key_from_bytes(pk);

    const rk = Proxy.generate_re_encryption_key(sk, pk);

    const rkB64 = Buffer.from(rk.to_bytes()).toString('base64');
    
    /* Send re-encryption key in base64 to the blockchain */
    const kms = { idOperatorDelegator, idOperatorDelegatee, reKey: rkB64 };

    const kmsReq = await requestHelper.invokeRequest(
      hlf.chaincodeId.kms,
      ChainMethod.createRekey,
      kms,
      username,
      false);

    return res.status(httpStatus.CREATED).send({ message: kmsReq });
  } catch (err) {
    logger.error(err.stack);
    return next(err);
  }
};

const getKeysById = async (req, res, next) => {
  try {
    const { idOperator } = req.params;

    const kmsReq = await requestHelper.queryRequest(
      hlf.chaincodeId.kms,
      ChainMethod.getKeysById,
      { idOperator });

    return res.status(httpStatus.CREATED).send({ message: kmsReq });
  } catch (err) {
    logger.error(err.stack);
    return next(err);
  }
};

module.exports = {
  createKeys,
  createRekey,
  getKeysById,
};
