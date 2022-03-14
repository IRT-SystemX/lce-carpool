const _ = require('lodash');
const path = require('path');
const environments = require('./environments');
const env = require('./env');

const config = {

  // server
  env: env.NODE_ENV,

  apiPort: env.API_PORT,
  apiUrl: env.API_URL,
  APP_NAME: env.APP_NAME,
  appName: env.APP_NAME,

  geohashLevel: env.GEOHASH_LEVEL,

  webhooks: {
    isEnabled: env.WEBHOOK_ENABLE,
    op1: env.OP1_WEBHOOKS,
    op2: env.OP2_WEBHOOKS
  },

  hlf: {
    ccpPath: `${env.CCP_PATH}`,
    peerTLSCACertsPath: `${env.PEER_TLS_CA_CERTS_PATH}`,
    ordererTLSCACertsPath: `${env.ORDERER_TLS_CA_CERTS_PATH}`,
    isEnabled: env.ENABLE_HLF,
    transactionTimeout: env.TRANSACTION_TIMEOUT || 5000,
    walletPath: path.resolve(__dirname, 'creds'),
    userId: `${env.USER_ID}`,
    userAffiliation: env.USER_AFFILIATION,
    channelId: env.CHANNEL_ID,
    chaincodeId: {
      offer : env.CHAINCODE_ID[0],
      transaction: env.CHAINCODE_ID[1],
      proof: env.CHAINCODE_ID[2],
      kms: env.CHAINCODE_ID[3]},
    peerUrl: `grpcs://${env.PEER_HOST}:${env.PEER_PORT}`,
    peerName: `${env.PEER_HOST}`,
    ordererUrl: `grpcs://${env.ORDERER_HOST}:${env.ORDERER_PORT}`,
    ordererName: `${env.ORDERER_HOST}`,
    ca: {
      url: `https://${env.CA_HOST}:${env.CA_PORT}`, // put https in case TLS is enabled
      name: `${env.CA_NAME}`
    },
    admin: {
      enrollmentID: 'admin',
      enrollmentSecret: 'adminpw',
      MspID: `${env.MSPID}`
    },
    tlsOptions: {
      trustedRoot: [],
      verify: false
    }
  },

  mongo: {
    enabled: env.MONGO_ENABLE || false,
    mode: env.MONGO_MODE,
    name: env.MONGO_NAME,
    host: env.MONGO_HOST,
    port: env.MONGO_PORT,
    uri: env.MONGO_URI
  },

  rnpc: {
    enabled: env.RNPC_ENABLE || false,
    urlStaging: env.RNPC_URL_STAGING,
    urlProd: env.RNPC_URL_PROD,
    tokenStaging: env.RNPC_TOKEN_STAGING,
    tokenProd: env.RNPC_TOKEN_PROD,
    urlXp: env.RNPC_URL_XP,
    tokenXp: env.RNPC_TOKEN_XP,
    /* OPERATOR_ID and RNPC_OPERATOR_MINCLASS are merged with OPERATOR_ID key */
    proofAuth: env.OPERATOR_ID.reduce((obj, val, i) => { return Object.assign({}, obj, { [val]: env.RNPC_OPERATOR_AUTH[i] }) }, {}),
  },

  jwtSecret: env.JWT_SECRET,
  jwtExpirationDays: env.JWT_EXPIRATION_DAYS,

  validIdOperator: env.OPERATOR_ID,
  validTransactionType: ['INSCRIPTION', 'CONFIRMATION', 'REJECTION', 'PAYMENT', 'TRIP_STARTED', 'TRIP_ENDED', 'BOOKING_CANCELLATION'],
  validMessageStatus: ['none','created','sent','seen','deleted'],
  validNotificationJourneyStep: ['LINKAGE', 'INSCRIPTION', 'CONFIRMATION', 'PAYMENT', 'BOOKING_CANCELLATION']
};

// merge environment configurations
if (_.isObject(environments[env.NODE_ENV])) _.merge(config, environments[env.NODE_ENV]);

module.exports = config;
