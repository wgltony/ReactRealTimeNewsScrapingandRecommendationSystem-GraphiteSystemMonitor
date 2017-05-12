const mongoose = require('mongoose');
const log4js = require('log4js');
//console log is loaded by default, so you won't normally need to do this
//log4js.loadAppender('console');
log4js.loadAppender('file');
//log4js.addAppender(log4js.appenders.console());
log4js.addAppender(log4js.appenders.file('../node.log'), 'main.js');

const logger = log4js.getLogger('main.js');

module.exports.connect = (uri) => {
  mongoose.connect(uri);

  mongoose.connection.on('error', (err) => {
    logger.error(err);
    //console.error(`Mongoose connection error: ${err}`);
    process.exit(1);
  });

  // load models
  require('./user');
};
