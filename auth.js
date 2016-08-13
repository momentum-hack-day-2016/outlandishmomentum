"use strict";

var passport = require('passport');
var router = require('express').Router();
var logger = require('winston');

var LocalStrategy = require('passport-local').Strategy;

// Store just user ID in the session
passport.serializeUser(function (user, done) {
    done(null, String(user._id));
});

// Convert user ID back into user object
passport.deserializeUser(function (userId, done) {
    done(null, {
        _id: userId
    });
    // User.findById(userId, function (err, user) {
    //     if (err || !user) {
    //         done({status: 404, msg: 'User not found'}, null);
    //     } else {
    //         done(null, user);
    //     }
    // });
});

// Handle username and password authentication
passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
}, function (email, password, done) {
    done(null, { _id: 123 });
    // User.findByLogin(email)
    //     .then(function (user) {
    //         if (
    //             user &&
    //             config.get('overridePassword') &&
    //             password === config.get('overridePassword')
    //         ) {
    //             done(null, user);
    //             return;
    //         }
    //
    //         if (!user || user.disabled) {
    //             done(null, false, {message: 'Wrong username or password'});
    //             return;
    //         }
    //
    //         user
    //             .checkPassword(password)
    //             .then(matched => matched ? done(null, user) : done(null, false, {message: 'Wrong username or password'}));
    //     })
    //     .catch(done);

}));

router.post('/auth/signin', function (req, res, next) {

    const username = req.body.email;
    logger.info("User " + username + " attempting login");

    // Create authentication middleware
    var middleware = passport.authenticate('local', function (err, user, args) {

        if (err) {
            logger.info("Login failed for user " + username);
            next(err);
            return;
        }

        if (!user) {
            logger.info("Unsuccessful login: " + username);
            res.status(401).send(args.message);
            return;
        }

        logger.info('User ' + username + ' successfully logged in');
        // log the user in
        req.login(user, function (err) {

            if (err) {
                res.sendStatus(500);
                return;
            }

            res.sendStatus(200);
        });
    });

    // Explicitly invoke middleware to give access to res from callback
    middleware(req, res);
});

router.post('/auth/logout', function (req, res) {
    req.logout();
    res.sendStatus(200);
});


module.exports = router;
