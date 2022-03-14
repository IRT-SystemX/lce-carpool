const passport = require('passport');
const JWTStrategy = require('passport-jwt').Strategy;
const ExtractJWT = require('passport-jwt').ExtractJwt;
const { jwtSecret } = require('./index');

const opts = {
  jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
  secretOrKey: jwtSecret,
};

passport.use(
  'jwt',
  new JWTStrategy(opts, (jwtPayload, done) => {
    done(null, { username: jwtPayload.username, idOperator: jwtPayload.idOperator })
  })
);