let rpc_client = require('../rpc_client/rpc_client')

module.exports = (req, res, next) => {

    //console.log('send RequestPreSecond monitor data...');

    rpc_client.logDataForGraphite('System_RequestPreSecond');
    res.status(200);

    return next();

};
