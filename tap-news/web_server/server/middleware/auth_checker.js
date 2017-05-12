const jwt = require('jsonwebtoken');
const User = require('mongoose').model('User');
const yaml_config = require('node-yaml-config');
const config = yaml_config.load('../../config/config.yml');
//console.log(config);
const dbScret = config.web_server.mongodbConfig.jwtSecret;
const log4js = require('log4js');
//console log is loaded by default, so you won't normally need to do this
//log4js.loadAppender('console');
log4js.loadAppender('file');
//log4js.addAppender(log4js.appenders.console());
log4js.addAppender(log4js.appenders.file('../node.log'), 'auth_checker.js');

const logger = log4js.getLogger('auth_checker.js');
module.exports = (req, res, next) => {
  logger.info('auth_checker: req: ' + req.headers);
  //console.log('auth_checker: req: ' + req.headers);

  if (!req.headers.authorization) {
    logger.warn('Unauthorized ruquest');
    return res.status(401).end();
  }

  // get the last part from a authorization header string like "bearer token-value"
  const token = req.headers.authorization.split(' ')[1];

  logger.info('auth_checker: token: ' + token)
  //console.log('auth_checker: token: ' + token);

  // decode the token using a secret key-phrase
  return jwt.verify(token, dbScret, (err, decoded) => {
    // the 401 code is for unauthorized status
    if (err) {
      logger.warn('Unauthorized ruquest');
      return res.status(401).end(); }

    const email = decoded.sub;

    // check if a user exists
    return User.findById(email, (userErr, user) => {
      if (userErr || !user) {
        logger.warn('Unauthorized ruquest');
        return res.status(401).end();
      }

      return next();
    });
  });
};
