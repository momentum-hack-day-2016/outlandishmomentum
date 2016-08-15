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
var _ = require('lodash');
var parse = require('csv-parse/lib/sync');
var mysql = require('mysql');

var app = express();
var server = http.createServer(app);
var connection;

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
  cookie: {httpOnly: true, maxAge: 9999999},
  resave: false,
  maxAge: 9999999,
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

app.use(function (req, res, next) {
  // Use session cookie (if any)
  passport.session()(req, res, next);
});

function pugArgs(req, extra) {
  return _.merge({
    user: req.user
  }, extra);
}

/**
 * Route configuration
 */

app.use('/', require('./auth'));

app.get('/login', function (req, res) {
  res.render('login', pugArgs(req));
});

app.get('/', function (req, res) {
  res.render('home', pugArgs(req));
});

// remaining pages are protected
app.use(function (req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
});

app.get('/report', function (req, res) {
  connection.query('SELECT * from data', function(err, rows) {
    if (!err) {
      res.render('report', pugArgs(req, { voters: rows }));
    }
    else {
      throw err;
    }
  });
});

app.get('/import', function (req, res) {
  res.render('import', pugArgs(req));
});

app.post('/import', function(req, res) {
  req.busboy.on('file', function (fieldname, file, filename) {
    var csvData = [];
    file.on('data', function(data) {
      csvData = csvData.concat(data);
    });
    file.on('end', function() {
      csvData = String(csvData).trim();
      var parsedData = parse(csvData);
      parsedData = parsedData.slice(1);

      var sql = "INSERT INTO data (groupid, first_name, last_name, date_of_birth, postcode, mobile_phone, " +
        "twitter_handle, facebook_link, candidate) VALUES ?";

      sql = mysql.format(sql, [parsedData]);

      connection.query(sql, function(err) {
        if (err) throw err;
        res.render('import', pugArgs(req, {success: true}));
      });
    });


  });
  req.pipe(req.busboy);
});

function connectToDb() {

  connection = mysql.createConnection({
    host     : '54.194.89.201',
    user     : 'momentum',
    password : 'momentum',
    database : 'momentum'
  });

  connection.connect();
}

logger.info('listening on port 3000');
server.listen(3000, '127.0.0.1');
connectToDb();
