const HlfConfig = require('../api/utils/chain/hlfconfig');
const HlfClient = require('../api/utils/chain/hlfclient');
const HlfCaClient = require('../api/utils/chain/hlfcaclient');
const ChainAuthentication = require('../api/utils/chain/chain.authentication');
const RequestHelper = require('../api/utils/chain/requesthelper');
const logger = require('./logger');
const config = require('./index');

// initialize the HLF client and the HLF CA client
const hlfConfig = new HlfConfig();
const hlfClient = new HlfClient(hlfConfig);
const hlfCaClient = new HlfCaClient(hlfConfig);
const chainAuthentication = new ChainAuthentication(hlfCaClient);
const requestHelper = new RequestHelper(hlfClient);

const init = async () => {
  try {
    await hlfClient.init();
    await hlfCaClient.init(config.hlf.admin);
    return Promise.resolve();
  } catch (err) {
    logger.error(err);
    return Promise.reject(err);
  }
};

module.exports = {
  hlfClient,
  hlfCaClient,
  chainAuthentication,
  hlfInit: init,
  requestHelper,
};
