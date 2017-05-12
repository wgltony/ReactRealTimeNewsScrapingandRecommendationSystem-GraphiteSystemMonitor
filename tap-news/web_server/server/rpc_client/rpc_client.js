var jayson = require('jayson');

var yaml_config = require('node-yaml-config');
var config = yaml_config.load('../../config/config.yml');
//console.log(config);
var rpcConfig = config.web_server.RpcServerConfig;

//console.log(rpcConfig);

var client = jayson.client.http(rpcConfig);

const log4js = require('log4js');
//console log is loaded by default, so you won't normally need to do this
//log4js.loadAppender('console');
log4js.loadAppender('file');
//log4js.addAppender(log4js.appenders.console());
log4js.addAppender(log4js.appenders.file('../node.log'), 'rpc_client');

const logger = log4js.getLogger('rpc_client');

//test RPC method
function add(a, b, callback){
  client.request('add', [a, b], function(err, error, response){
    if(err) logger.error(err);
    logger.info(response);
    callback(response);
  });
}

function getNewsSummariesForUser(user_id, page_num, callback){
  client.request('getNewsSummariesForUser', [user_id, page_num], function(err, error, response){
    logger.info('rpc:getNewsSummariesForUser'+' id: '+user_id+' page: '+page_num);
    if(err) logger.error(err);
    //console.log(response);
    callback(response);
  });
}

function getSearchNewsSummariesForUser(user_id, page_num, search_key, callback){
  client.request('getSearchNewsSummariesForUser', [user_id, page_num, search_key], function(err, error, response){
    logger.info('rpc:getSearchNewsSummariesForUser'+' id: '+user_id+' page: '+page_num+' search_key:'+search_key);
    if(err) logger.error(err);
    //console.log(response);
    callback(response);
  });
}

//Log news click event for a user
function logNewsClickForUser(user_id, news_id){
  client.request('logNewsClickForUser', [user_id, news_id], function(err, error, response){
    if(err) logger.error(err);
    logger.info(response);
  })
}

function getPreferenceForUser(user_id, callback){
  client.request('getPreferenceForUser', [user_id], function(err, error, response){
    if(err) logger.error(err);
    logger.info(response);
    callback(response);
  })
}

function logDataForGraphite(operation_name){
  client.request('logDataForGraphite', [operation_name], function(err, error, response){
    if(err) logger.error(err);
    logger.info(response);
  })
}

module.exports = {
  add : add,
  getNewsSummariesForUser : getNewsSummariesForUser,
  logNewsClickForUser : logNewsClickForUser,
  getPreferenceForUser: getPreferenceForUser,
  logDataForGraphite: logDataForGraphite,
  getSearchNewsSummariesForUser: getSearchNewsSummariesForUser
}
