var express = require('express');
var router = express.Router();
var rpc_client = require('../rpc_client/rpc_client')

/* GET news listing. */
router.get('/userId/:userId/pageNum/:pageNum/key/:key', function(req, res, next) {
  //console.log('Feteching news......');
  user_id = req.params['userId'];
  page_num = req.params['pageNum'];
  search_key = req.params['key'];

  rpc_client.getSearchNewsSummariesForUser(user_id, page_num, search_key, function(response){
    res.json(response);
  })
 });

module.exports = router;
