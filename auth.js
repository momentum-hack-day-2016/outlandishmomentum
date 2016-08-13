"use strict";

var passport = require('passport');
var router = require('express').Router();
var _ = require('lodash');
var logger = require('winston');

var LocalStrategy = require('passport-local').Strategy;

var users = [
    {
        id: '1',
        username: 'outlandish',
        password: '1234'
    }
];

// Store just user ID in the session
passport.serializeUser(function (user, done) {
    logger.debug('serializing user', user);
    done(null, String(user.id));
});

// Convert user ID back into user object
passport.deserializeUser(function (userId, done) {
    logger.debug('deserializing user', userId);
    var user = _.find(users, { id: userId });
    if (user) {
        done(null, user);
    } else {
        done(new Error('User not found'));
    }
});

// Handle username and password authentication
passport.use(new LocalStrategy({
    usernameField: 'username',
    passwordField: 'password'
}, function (username, password, done) {
    var user = _.find(users, { username: username, password: password });
    done(null, user);
}));

router.post('/login', function (req, res, next) {

    var middleware = passport.authenticate('local', {
        successRedirect: '/',
        failureRedirect: 'login'
    });

    middleware(req, res, next);
});

router.get('/logout', function (req, res) {
    req.logout();
    res.sendStatus(200);
});


module.exports = router;
