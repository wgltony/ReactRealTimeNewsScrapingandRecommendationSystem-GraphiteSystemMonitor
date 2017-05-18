const User = require('mongoose').model('User');
const PassportLocalStrategy = require('passport-local').Strategy;
const log4js = require('log4js');
//console log is loaded by default, so you won't normally need to do this
//log4js.loadAppender('console');
log4js.loadAppender('file');
//log4js.addAppender(log4js.appenders.console());
log4js.addAppender(log4js.appenders.file('../node.log'), 'signup_passport');

const logger = log4js.getLogger('signup_passport');

module.exports = new PassportLocalStrategy({
  usernameField: 'email',
  passwordField: 'password',
  session: false,
  passReqToCallback: true
}, (req, email, password, done) => {
  const userData = {
    email: email.trim(),
    password: password.trim(),
  };

  const newUser = new User(userData);
  logger.info('Save new user!');
  logger.info(userData);
  newUser.save((err) => {
    if (err) {
      logger.error(err);
      return done(err);
    }
    return done(null);
  });
});
