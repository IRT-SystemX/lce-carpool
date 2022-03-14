const mongoose = require('mongoose');
const logger = require('./../config/logger');
const config = require('./../config');

// set mongoose Promise to Bluebird
mongoose.Promise = Promise;

// Exit application on error
mongoose.connection.on('error', (err) => {
  logger.error(`MongoDB connection error: ${err}`);
  process.exit(-1);
});

// Show message on database connection
mongoose.connection.on('connected', () => {
  logger.info('database connected');
});

// print mongoose logs in dev env
if (config.env === 'development' || config.env === 'test') {
  mongoose.set('debug', true);
}

/**
 * Connect to mongo db
 */
exports.connect = async () => {
  if (config.mongo.mode === 'local') {
    const { MongoMemoryServer }= require('mongodb-memory-server'); // eslint-disable-line global-require
    const mongoServer = new MongoMemoryServer({
      instance: {
        port: config.mongo.port,
        ip: config.mongo.host,
        dbName: config.mongo.name,
        debug: false,
      },
      debug: false
    });
    const mongoUri = await mongoServer.getConnectionString();
    const mongooseOpts = { // options for mongoose 4.11.3 and above
      autoReconnect: true,
      reconnectTries: Number.MAX_VALUE,
      reconnectInterval: 1000,
      // useMongoClient: true, // remove this line if you use mongoose 5 and above
    };

    await mongoose.connect(mongoUri, mongooseOpts);
    return Promise.resolve(mongoose.connection)
  } else { // eslint-disable-line no-else-return
    await mongoose.connect(config.mongo.uri, {
      keepAlive: 1,
      useNewUrlParser: true,
    });
    return Promise.resolve(mongoose.connection);
  }
};
