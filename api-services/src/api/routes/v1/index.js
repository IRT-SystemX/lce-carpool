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

const router = express.Router();

// import all defined routes path
const authRoutes = require('./auth.route');
const offerRoutes = require('./offer.route');
const transactionRoutes = require('./transaction.route');
const messageRoutes = require('./message.route');
const proofRoutes = require('./proof.route');
const kmsRoutes = require('./kms.route');

/* GET home page. */
router.get('/health-check', (req, res) => {
  res.send('OK');
});

router.use('/auth', authRoutes);
router.use('/offer', offerRoutes);
router.use('/transaction', transactionRoutes);
router.use('/message', messageRoutes);
router.use('/proof', proofRoutes);
router.use('/kms', kmsRoutes);

module.exports = router;
