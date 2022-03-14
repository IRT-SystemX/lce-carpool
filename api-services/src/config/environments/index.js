const production = require('./production');
const development = require('./development');
const test = require('./test');
const local = require('./local');

module.exports = {
  production,
  development,
  test,
  local,
};
