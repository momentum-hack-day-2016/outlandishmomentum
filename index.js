var express = require('express');
var http = require('http');
var path = require('path');
var bodyParser = require('body-parser');
var busboy = require('connect-busboy');
var expressWinston = require('express-winston');
var session = require('express-session');
var passport = require('passport');
var glob = require('glob-all');
var logger = require('winston');
var parse = require('csv-parse/lib/sync');

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
app.use(busboy());

const sessionMiddleware = session({
  secret: 'thisisasecret',
  key: 'sessionId',
  cookie: {httpOnly: true, maxAge: 10000},
  resave: false,
  rolling: true,
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
  console.log('is authed?', req.isAuthenticated());
  if (req.isAuthenticated()) {
    return next()
  }
  res.redirect('/login');
});

app.get('/import', function (req, res) {
  res.render('import');
});

app.post('/import', function(req, res) {
  console.log('received csv', req.body);

  req.busboy.on('file', function (fieldname, file, filename) {
    console.log("Uploading: " + filename);

    var csvData = [];
    file.on('data', function(data) {
      csvData = csvData.concat(data);
    });
    file.on('end', function() {
      csvData = String(csvData).trim();
      var parsedData = parse(csvData);
      parsedData = parsedData.slice(1);

      var sql = "INSERT INTO data (groupid, first_name, last_name, date_of_birth, postcode, mobile_phone" +
        "twitter_handle, facebook_link, candidate) VALUES ?";

      connection.query(sql, [parsedData], function(err) {
        if (err) throw err;
        res.render('import', {success: true});
      });
    });


  });
  req.pipe(req.busboy);
});

logger.info('listening on port 3000');
server.listen(3000, '127.0.0.1');
