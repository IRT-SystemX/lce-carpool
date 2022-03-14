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

// route to manage keys
const express = require('express');
const validate = require('express-validation');
const validation = require('../../validation');
const { kmsCtrl } = require('../../controllers');
const { isAuthorized } = require('../../middlewares/jwt.auth');

const router = express.Router(); // eslint-disable-line new-cap

router.post('/', isAuthorized, validate(validation.kms.postKeys), kmsCtrl.createKeys);
router.post('/rekey', isAuthorized, validate(validation.kms.postRekey), kmsCtrl.createRekey);
router.get('/:idOperator', isAuthorized, validate(validation.kms.getById), kmsCtrl.getKeysById);

module.exports = router;
