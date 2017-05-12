var express = require('express');
var router = express.Router();
var rpc_client = require('../rpc_client/rpc_client')

/* GET user preference. */
router.get('/userId/:userId', function(req, res, next) {
  //console.log('Get user preference......');
  user_id = req.params['userId'];

  rpc_client.getPreferenceForUser(user_id, function(response){
    res.json(response);
  })
 });



module.exports = router;
