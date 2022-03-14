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

// make bluebird default Promise
global.Promise = require('bluebird'); // eslint-disable-line no-global-assign

const config = require('./config');
const logger = require('./config/logger');
const app = require('./config/express');
const moognose = require('./config/mongoose');
const { hlfInit } = require('./config/hlf');
const Json = require('./api/utils/json');

logger.info(Json.serializeJson(config));

const startApp = async () => {
  try {
    if (config.mongo.enabled)
      await moognose.connect();

    if (config.hlf.isEnabled)
      await hlfInit();

    if (!module.parent) {
      await app.listen(config.apiPort);
      logger.info(`server started on port ${config.apiPort} (${config.env})`)
    }

    app.emit('appStarted');
  } catch (err) {
    logger.error(err.stack);
    logger.error('application will shutdown now');
    process.exit(-1)
  }
};

startApp(app);

// src: https://github.com/mochajs/mocha/issues/1912
// if (!module.parent) {
//   start_app(app);
// }

module.exports = app;
