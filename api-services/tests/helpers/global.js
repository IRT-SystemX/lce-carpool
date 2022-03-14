const { rmDir } = require('./helpers');
const app = require('../../src');

before((done) => {
  app.on("appStarted", done)
});

after((done) => {
  rmDir(`${__dirname}/../../src/config/creds`, false);
  done()
})