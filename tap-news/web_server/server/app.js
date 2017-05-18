var bodyParser = require('body-parser');
var cors = require('cors');
var express = require('express');
var mongoose = require('mongoose');
var passport = require('passport');
var path = require('path');

var index = require('./routes/index');
var news = require('./routes/news');
var search = require('./routes/search');
var auth = require('./routes/auth');
var preference = require('./routes/preference');
var monitor = require('./routes/monitor');
var fs = require('fs')
var morgan = require('morgan')
var rfs = require('rotating-file-stream')

var app = express();

var yaml_config = require('node-yaml-config');
var config = yaml_config.load('../../config/config.yml');
//console.log(config);
var dbConfig = config.web_server.mongodbConfig.mongoDbUri;
require('./models/main.js').connect(dbConfig);

// view engine setup
app.set('views', path.join(__dirname, '../client/build/'));
app.set('view engine', 'jade');
app.use('/static', express.static(path.join(__dirname, '../client/build/static/')));


// TODO: remove this after development is done
app.use(cors());
app.use(bodyParser.json());

// load passport strategies
app.use(passport.initialize());
var localSignupStrategy = require('./passport/signup_passport');
var localLoginStrategy = require('./passport/login_passport');
passport.use('local-signup', localSignupStrategy);
passport.use('local-login', localLoginStrategy);

// pass the authenticaion checker middleware
const authCheckMiddleware = require('./middleware/auth_checker');
const requestPerSecondMiddleware = require('./middleware/request_per_second');

var logDirectory = path.join(__dirname, 'log')

// ensure log directory exists
fs.existsSync(logDirectory) || fs.mkdirSync(logDirectory)

// create a rotating write stream
var accessLogStream = rfs('access.log', {
  interval: '1d', // rotate daily
  path: logDirectory
})

app.use(morgan('combined', {stream: accessLogStream}))
//Handle request before url address
app.use('*', requestPerSecondMiddleware);
app.use('/news', authCheckMiddleware);
app.use('/news', news);
app.use('/search', search);
app.use('/auth', auth);
app.use('/preference', preference);
app.use('/monitor', monitor);
app.use('/signup', index);
app.use('/login', index);
app.use('/profile', index);
app.use('/', index);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  res.send('404 Not Found');
});

module.exports = app;
