var express = require('express');
var router = express.Router();
var rpc_client = require('../rpc_client/rpc_client')

/* GET user preference. */
router.post('/process/:process', function(req, res, next) {
  //console.log('Get process monitor request......');
  process_name = req.params['process'];

  rpc_client.logDataForGraphite(process_name);
  res.status(200).end();
 });


module.exports = router;
