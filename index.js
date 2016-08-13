var express = require('express');
var http = require('http');
var path = require('path');
var bodyParser = require('body-parser');
var expressWinston = require('express-winston');
var session = require('express-session');
var passport = require('passport');
var glob = require('glob-all');
var logger = require('winston');

var app = express();
var server = http.createServer(app);

/**
 * Express configuration
 */

app.set('view engine', 'pug');

app.use(express.static(path.join(__dirname, 'assets')));

// Only log requests after static files have been dealt with
app.use(expressWinston.logger({
  winstonInstance: logger,
  expressFormat: true
}));

// Request parsing
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.raw({type: 'text/csv'}));

const sessionMiddleware = session({
  secret: 'thisisasecret',
  key: 'sessionId',
  resave: false,
  saveUninitialized: false
});

app.use(sessionMiddleware);

// Disable X-Powered-By header
app.disable('x-powered-by');

/*
 * Authentication and authorisation
 */

app.use(passport.initialize());
app.use(passport.session());

// Switch authentication strategies based on request
app.use(function (req, res, next) {
  // Use session cookie (if any)
  var middleware = passport.session();

  middleware(req, res, next);
});

/**
 * Route configuration
 */

app.use('/', require('./auth'));

app.get('/login', function (req, res) {
  res.render('login');
});

app.get('/', function (req, res) {
  res.render('home');
});



// remaining pages are protected
app.use(function (req, res, next) {
  if (req.isAuthenticated()) {
    return next()
  }
  res.redirect('/login');
});

app.get('/protected', function (req, res) {
  res.render('page2');
});



logger.info('listening on port 3000');
server.listen(3000, '127.0.0.1');
