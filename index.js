var express = require('express');
var http = require('http');
var path = require('path');
var bodyParser = require('body-parser');
var busboy = require('connect-busboy');
var session = require('express-session');
var passport = require('passport');
var glob = require('glob-all');
var logger = require('winston');
var parse = require('csv-parse/lib/sync');
var mysql = require('mysql');
var _ = require('lodash');
var moment = require('moment');

var app = express();
var server = http.createServer(app);
var connection;

/**
 * Express configuration
 */

app.set('view engine', 'ejs'); // HTML templating, see views directory
app.locals.moment = moment; // make moment date library available in HTML templates

app.use(express.static(path.join(__dirname, 'assets'))); // serve files in the assets directory

// Request parsing
app.use(bodyParser.json()); // parse JSON request data
app.use(bodyParser.urlencoded({ extended: true })); // parse URL encoded request data
app.use(busboy()); // parse multipart/form data (file uploads)

const sessionMiddleware = session({
  secret: 'thisisasecret',
  key: 'sessionId',
  cookie: { httpOnly: true, maxAge: 9999999 },
  resave: false,
  maxAge: 9999999,
  rolling: true,
  saveUninitialized: false
});

app.use(sessionMiddleware); // use cookies to set up a client-server session (for login/logout)

// Disable X-Powered-By header
app.disable('x-powered-by');

/*
 * Authentication and authorisation
 */

app.use(passport.initialize()); // initialise 'passport' library
app.use(passport.session()); // tell passport we are using cookies

/**
 * Route configuration
 */

app.use('/', require('./auth')); // auth.js sets up passport, and exports the 'login' and 'logout' routes

// add the 'user' property of the request to 'res.locals'
// this makes is accessible in all templates
app.use(function (req, res, next) {
  res.locals.user = req.user;
  next();
});

app.get('/login', function (req, res) {
  res.render('login');
});

app.get('/', function (req, res) {
  res.render('home');
});

// require authentication for other pages
//
// this registers a handler that gets called on every request
// it checks if the user is logged in, and if they're not, redirects the user to the login page
// if they are logged-in, it calls next() to run the code in the next handler, which are all defined below.
app.use(function (req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
});

// query the database and render 'views/report.ejs' with data included
app.get('/report', function (req, res) {
  // default query: return everything
  var sql = 'SELECT * from data';
  
  // if we have a 'name' query parameter, add a filter to the query that searches in first_name and last_name
  if (req.query.name) {
    sql = sql + ' WHERE first_name LIKE ? OR last_name LIKE ?';
    var nameQueryParam = '%' + req.query.name + '%';
    // replace the '?'s in the query string with the value of nameQueryParam, e.g. '%John%'
    sql = mysql.format(sql, [ nameQueryParam, nameQueryParam ]);
  }
  logger.info('querying database:', sql);
  connection.query(sql, function (err, rows) {
    if (!err) {
      res.render('report', { rows: rows });
    }
    else {
      throw err;
    }
  });
});

app.get('/import', function (req, res) {
  res.render('import', { success: false });
});

app.post('/import', function (req, res) {
  req.busboy.on('file', function (fieldname, file, filename) {
    var csvData = [];
    file.on('data', function (data) {
      csvData = csvData.concat(data);
    });
    file.on('end', function () {
      csvData = String(csvData).trim();
      var parsedData = parse(csvData);
      parsedData = parsedData.slice(1);

      var sql = "INSERT INTO data (groupid, first_name, last_name, date_of_birth, postcode, mobile_phone, " +
        "twitter_handle, facebook_link, candidate) VALUES ?";

      sql = mysql.format(sql, [ parsedData ]);

      connection.query(sql, function (err) {
        if (err) throw err;
        res.render('import', { success: true });
      });
    });
  });
  req.pipe(req.busboy);
});

function connectToDb () {

  connection = mysql.createConnection({
    host: '54.194.89.201',
    user: 'momentum',
    password: 'momentum',
    database: 'momentum'
  });

  connection.connect();
}

connectToDb();
server.listen(3000, '127.0.0.1');
logger.info('listening on port 3000');