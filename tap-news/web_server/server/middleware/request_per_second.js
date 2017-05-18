let rpc_client = require('../rpc_client/rpc_client')

module.exports = (req, res, next) => {
    //let ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    //console.log('==========================request ip address: ' + ip);

    rpc_client.logDataForGraphite('System_RequestPreSecond');
    res.status(200);

    return next();

};
