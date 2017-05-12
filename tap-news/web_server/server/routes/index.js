var express = require('express');
var router = express.Router();
var path = require('path');

/* load page. */
router.get('/', function(req, res, next) {
  res.sendFile("index.html", { root: path.join(__dirname, '../../client/build/') });
});

router.get('/login', function(req, res, next) {
  res.sendFile("index.html", { root: path.join(__dirname, '../../client/build/') });
});

router.get('/signup', function(req, res, next) {
  res.sendFile("index.html", { root: path.join(__dirname, '../../client/build/') });
});

router.get('/profile', function(req, res, next) {
  res.sendFile("index.html", { root: path.join(__dirname, '../../client/build/') });
});

module.exports = router;
