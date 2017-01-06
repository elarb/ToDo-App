const _ = require('lodash');
const passport = require('passport');
const request = require('request');
const LocalStrategy = require('passport-local').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const TwitterStrategy = require('passport-twitter').Strategy;
const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
const User = require('../models/User');

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser((id, done) => {
    new User({id: id}).fetch().then(function (user) {
        done(null, user);
    });
});

/**
 * Sign in using Email and Password.
 */
passport.use(new LocalStrategy({usernameField: 'email'}, (email, password, done) => {
    new User({Email: email})
        .fetch()
        .then(function (user) {
            if (!user) {
                return done(null, false, {
                    msg: 'The user ' + email + ' is not associated with any account. ' +
                    'Double-check your email and try again.'
                });
            }
            user.comparePassword(password, function (err, isMatch) {
                if (!isMatch) {
                    return done(null, false, {msg: 'Invalid email or password'});
                }
                return done(null, user);
            });
        });
}));

/**
 * OAuth Strategy Overview
 *
 * - User is already logged in.
 *   - Check if there is an existing account with a provider id.
 *     - If there is, return an error message. (Account merging not supported)
 *     - Else link new OAuth account with currently logged-in user.
 * - User is not logged in.
 *   - Check if it's a returning user.
 *     - If returning user, sign in and we are done.
 *     - Else check if there is an existing account with user's email.
 *       - If there is, return an error message.
 *       - Else create a new account.
 */

/**
 * Sign in with Facebook.
 */
passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_ID,
    clientSecret: process.env.FACEBOOK_SECRET,
    callbackURL: '/auth/facebook/callback',
    profileFields: ['name', 'email', 'gender', 'location'],
    passReqToCallback: true
}, function (req, accessToken, refreshToken, profile, done) {
    if (req.user) {
        new User({facebook: profile.id})
            .fetch()
            .then(function (user) {
                if (user) {
                    req.flash('errors', {msg: 'There is already an existing account linked with Facebook that belongs to you.'});
                    return done(null);
                }
                new User({id: req.user.id})
                    .fetch()
                    .then(function (user) {
                        user.set('Name', user.get('Name') || profile.name.givenName + ' ' + profile.name.familyName);
                        user.set('Gender', user.get('Gender') || profile._json.gender);
                        user.set('Picture', user.get('Picture') || 'https://graph.facebook.com/' + profile.id + '/picture?type=large');
                        user.set('Facebook', profile.id);
                        user.save(user.changed, {patch: true}).then(function () {
                            req.flash('success', {msg: 'Your Facebook account has been linked.'});
                            done(null, user);
                        });
                    });
            });
    } else {
        new User({Facebook: profile.id})
            .fetch()
            .then(function (user) {
                if (user) {
                    return done(null, user);
                }
                new User({Email: profile._json.email})
                    .fetch()
                    .then(function (user) {
                        if (user) {
                            req.flash('errors', {msg: user.get('Email') + ' is already associated with another account.'});
                            return done();
                        }
                        user = new User();
                        user.set('Name', profile.name.givenName + ' ' + profile.name.familyName);
                        user.set('Email', profile._json.email);
                        user.set('Gender', profile._json.gender);
                        //TODO: Add country and region
                        user.set('Picture', 'https://graph.facebook.com/' + profile.id + '/picture?type=large');
                        user.set('Facebook', profile.id);
                        user.save().then(function (user) {
                            done(null, user);
                        });
                    });
            });
    }
}));

// Sign in with Twitter.
passport.use(new TwitterStrategy({
    consumerKey: process.env.TWITTER_KEY,
    consumerSecret: process.env.TWITTER_SECRET,
    callbackURL: '/auth/twitter/callback',
    passReqToCallback: true
}, function (req, accessToken, tokenSecret, profile, done) {
    if (req.user) {
        new User({Twitter: profile.id})
            .fetch()
            .then(function (user) {
                if (user) {
                    req.flash('errors', {msg: 'There is already an existing account linked with your Twitter account.'});
                    return done(null);
                }
                new User({id: req.user.id})
                    .fetch()
                    .then(function (user) {
                        user.set('Name', user.get('Name') || profile.displayName);
                        //TODO: Add Country and Region
                        user.set('Picture', user.get('Picture') || profile._json.profile_image_url_https);
                        user.set('Twitter', profile.id);
                        user.save(user.changed, {patch: true}).then(function () {
                            req.flash('success', {msg: 'Your Twitter account has been linked.'});
                            done(null, user);
                        });
                    });
            });
    } else {
        new User({Twitter: profile.id})
            .fetch()
            .then(function (user) {
                if (user) {
                    return done(null, user);
                }
                // Twitter does not provide an email address, but email is a required field in our User schema.
                // We can "fake" a Twitter email address as follows: username@twitter.com.
                // Ideally, it should be changed by a user to their real email address afterwards.
                // For example, after login, check if email contains @twitter.com, then redirect to My Account page,
                // and restrict user's page navigation until they update their email address.
                user = new User();
                user.set('Name', profile.displayName);
                user.set('Email', profile.username + '@twitter.com');
                //TODO: Add Country and Region
                user.set('Picture', profile._json.profile_image_url_https);
                user.set('Twitter', profile.id);
                user.save().then(function (user) {
                    done(null, user);
                });
            });
    }
}));

/**
 * Sign in with Google.
 */
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_ID,
    clientSecret: process.env.GOOGLE_SECRET,
    callbackURL: '/auth/google/callback',
    passReqToCallback: true
}, function (req, accessToken, refreshToken, profile, done) {
    if (req.user) {
        new User({Google: profile.id})
            .fetch()
            .then(function (user) {
                if (user) {
                    req.flash('errors', {msg: 'There is already an existing account linked with Google that belongs to you.'});
                    return done(null);
                }
                new User({id: req.user.id})
                    .fetch()
                    .then(function (user) {
                        user.set('Name', user.get('Name') || profile.displayName);
                        user.set('Gender', user.get('Gender') || profile._json.gender);
                        user.set('Picture', user.get('Picture') || profile._json.image.url);
                        user.set('Google', profile.id);
                        user.save(user.changed, {patch: true}).then(function () {
                            req.flash('success', {msg: 'Your Google account has been linked.'});
                            done(null, user);
                        });
                    });
            });
    } else {
        new User({Google: profile.id})
            .fetch()
            .then(function (user) {
                if (user) {
                    return done(null, user);
                }
                new User({Email: profile.emails[0].value})
                    .fetch()
                    .then(function (user) {
                        if (user) {
                            req.flash('errors', {msg: user.get('Email') + ' is already associated with another account.'});
                            return done();
                        }
                        user = new User();
                        user.set('Name', profile.displayName);
                        user.set('Email', profile.emails[0].value);
                        user.set('Gender', profile._json.gender);
                        //TODO: Add Country and Region from google response
                        user.set('Picture', profile._json.image.url);
                        user.set('Google', profile.id);
                        user.save().then(function (user) {
                            done(null, user);
                        });
                    });
            });
    }
}));

/**
 * Login Required middleware.
 */
exports.isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    req.flash('errors', {msg: 'Please log in first.'});
    res.redirect('/login');
};

/**
 * Authorization Required middleware.
 */
exports.isAuthorized = (req, res, next) => {
    const provider = req.path.split('/').slice(-1)[0];

    if (_.find(req.user.tokens, {kind: provider})) {
        next();
    } else {
        res.redirect(`/auth/${provider}`);
    }
};
