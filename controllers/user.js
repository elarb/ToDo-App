const async = require('async');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const passport = require('passport');
const User = require('../models/User');
const zxcvbn = require('zxcvbn');

/**
 * Login Required middleware.
 */
exports.isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    req.flash('errors', {msg: 'Login Required to access that.'});
    res.redirect('/login');
};

/**
 * GET /login
 * Login page.
 */
exports.getLogin = (req, res) => {
    if (req.user) {
        return res.redirect('/');
    }
    res.render('account/login', {
        title: 'Login'
    });
};

/**
 * POST /login
 * Sign in using username and password.
 */
exports.postLogin = (req, res, next) => {
    // req.assert('email', 'Email is not valid').isEmail();
    req.assert('username', 'Username cannot be blank').notEmpty();
    req.assert('password', 'Password cannot be blank').notEmpty();
    // req.sanitize('email').normalizeEmail({remove_dots: false});

    const errors = req.validationErrors();

    if (errors) {
        req.flash('errors', errors);
        return res.redirect('/login');
    }

    passport.authenticate('local', (err, user, info) => {
        if (err) {
            return next(err);
        }
        if (!user) {
            req.flash('errors', info);
            return res.redirect('/login');
        }
        req.logIn(user, (err) => {
            if (err) {
                return next(err);
            }
            req.flash('success', {msg: 'Welcome back!'});
            res.redirect('/dashboard');
        });
    })(req, res, next);
};

/**
 * GET /logout
 * Log out.
 */
exports.logout = (req, res) => {
    req.logout();
    res.redirect('/');
};

/**
 * GET /signup
 * Signup page.
 */
exports.getSignup = (req, res) => {
    if (req.user) {
        return res.redirect('/');
    }
    res.render('account/signup', {
        title: 'Create Account'
    });
};

/**
 * POST /signup
 * Create a new local account.
 */
exports.postSignup = (req, res, next) => {
    req.assert('email', 'Email is not valid').isEmail();
    req.assert('username', 'Username is not valid').notEmpty();
    req.assert('username', 'Username must be at least 4 characters and at most 10 characters long').len(4, 10);
    req.assert('confirmPassword', 'Passwords do not match').equals(req.body.password);
    req.sanitize('email').normalizeEmail({remove_dots: false});

    const errors = req.validationErrors();

    const validatePass = zxcvbn(req.body.password);

    if (validatePass.score === 0 || validatePass.score === 1) {
        const warningMsg = validatePass.feedback.warning;
        const suggestionMsg = validatePass.feedback.suggestions;
        if (warningMsg !== '') {
            req.flash('errors', {msg: 'Password not accepted: ' + warningMsg});
        } else {
            req.flash('errors', {msg: 'Password not accepted. Please provide a stronger password'});
        }
        if (suggestionMsg !== '') {
            req.flash('info', {msg: 'Suggestion: ' + suggestionMsg});
        }
        return res.render('account/signup', {email: req.body.email, username: req.body.username});
    }

    if (errors) {
        req.flash('errors', errors);
        return res.redirect('/signup');
    }

    new User({
        username: req.body.username,
        email: req.body.email,
        password: req.body.password
    }).save()
        .then(function (user) {
            req.logIn(user, function (err) {
                res.redirect('/');
            });
        })
        .catch(function (err) {
            console.log(err);
            if (err.code === 'ER_DUP_ENTRY' || err.code === '23505') {
                req.flash('error', {msg: 'The email address you have entered is already associated with another account.'});
                return res.redirect('/signup');
            }
        });
};

/**
 * GET /account
 * Profile page.
 */
exports.getAccount = (req, res) => {
    res.render('account/profile', {
        title: 'My Account'
    });
};

/**
 * POST /account/profile
 * Update profile information.
 */
exports.postUpdateProfile = (req, res, next) => {
    req.assert('email', 'Please enter a valid email address.').isEmail();
    req.sanitize('email').normalizeEmail({remove_dots: false});

    const errors = req.validationErrors();

    if (errors) {
        req.flash('errors', errors);
        return res.redirect('/account');
    }

    const user = new User({id: req.user.id});

    user.save({
        email: req.body.email,
        name: req.body.name,
        gender: req.body.gender,
        country: req.body.country,
        city: req.body.city
    }, {patch: true});

    user.fetch().then(function (user) {
        req.flash('success', {msg: 'Your profile information has been updated.'});
        res.redirect('/account');
    });

};

/**
 * POST /account/password
 * Update current password.
 */
exports.postUpdatePassword = (req, res, next) => {
    req.assert('password', 'Password must be at least 4 characters long').len(4);
    req.assert('confirmPassword', 'Passwords do not match').equals(req.body.password);

    const errors = req.validationErrors();
    const validatePass = zxcvbn(req.body.password);

    if (validatePass.score === 0 || validatePass.score === 1) {
        const warningMsg = validatePass.feedback.warning;
        const suggestionMsg = validatePass.feedback.suggestions;
        if (warningMsg !== '') {
            req.flash('errors', {msg: 'Password not accepted: ' + warningMsg});
        } else {
            req.flash('errors', {msg: 'Password not accepted. Please provide a stronger password'});
        }
        if (suggestionMsg !== '') {
            req.flash('info', {msg: 'Suggestion: ' + suggestionMsg});
        }
        return res.redirect('/account');
    }

    if (errors) {
        req.flash('errors', errors);
        return res.redirect('/account');
    }

    const user = new User({id: req.user.id});

    user.save({password: req.body.password}, {patch: true});

    user.fetch().then(function (user) {
        req.flash('success', {msg: 'Your password has been changed.'});

        res.redirect('/account');
    });
};

/**
 * POST /account/delete
 * Delete user account.
 */
exports.postDeleteAccount = (req, res, next) => {
    new User({id: req.user.id}).destroy().then(function (user) {
        req.logout();
        req.flash('info', {msg: 'Your account has been permanently deleted.'});
        res.redirect('/');
    });
};


/**
 * GET /account/unlink/:provider
 * Unlink OAuth provider.
 */
exports.getOauthUnlink = (req, res, next) => {
    new User({id: req.user.id})
        .fetch()
        .then(function (user) {
            switch (req.params.provider) {
                case 'facebook':
                    user.set('facebook', null);
                    break;
                case 'google':
                    user.set('google', null);
                    break;
                case 'twitter':
                    user.set('twitter', null);
                    break;
                default:
                    req.flash('error', {msg: 'Invalid OAuth Provider'});
                    return res.redirect('/account');
            }
            user.save(user.changed, {patch: true}).then(function () {
                req.flash('success', {msg: 'Your account has been unlinked.'});
                res.redirect('/account');
            });
        });
};

/**
 * GET /reset/:token
 * Reset Password page.
 */
exports.getReset = (req, res) => {
    if (req.isAuthenticated()) {
        return res.redirect('/');
    }
    new User({passwordResetToken: req.params.token})
        .where('passwordResetExpires', '>', new Date())
        .fetch()
        .then(function (user) {
            if (!user) {
                req.flash('error', {msg: 'Password reset token is invalid or has expired.'});
                return res.redirect('/forgot');
            }
            res.render('account/reset', {
                title: 'Password Reset'
            });
        });
};

/**
 * POST /reset/:token
 * Process the reset password request.
 */
exports.postReset = (req, res, next) => {
    req.assert('password', 'Password must be at least 4 characters long.').len(4);
    req.assert('confirm', 'Passwords must match.').equals(req.body.password);

    const errors = req.validationErrors();
    const validatePass = zxcvbn(req.body.password);

    if (validatePass.score === 0 || validatePass.score === 1) {
        const warningMsg = validatePass.feedback.warning;
        const suggestionMsg = validatePass.feedback.suggestions;
        if (warningMsg !== '') {
            req.flash('errors', {msg: 'Password not accepted: ' + warningMsg});
        } else {
            req.flash('errors', {msg: 'Password is not accepted. Please provide a stronger password'});
        }
        if (suggestionMsg !== '') {
            req.flash('info', {msg: 'Suggestion: ' + suggestionMsg});
        }
        return res.redirect('back');
    }

    if (errors) {
        req.flash('errors', errors);
        return res.redirect('back');
    }

    async.waterfall([
        function (done) {
            new User({passwordResetToken: req.params.token})
                .where('passwordResetExpires', '>', new Date())
                .fetch()
                .then(function (user) {
                    if (!user) {
                        req.flash('error', {msg: 'Password reset token is invalid or has expired.'});
                        return res.redirect('back');
                    }
                    user.set('password', req.body.password);
                    user.set('passwordResetToken', null);
                    user.set('passwordResetExpires', null);
                    user.save(user.changed, {patch: true}).then(function () {
                        req.logIn(user, function (err) {
                            done(err, user.toJSON());
                        });
                    });
                });
        },
        function (user, done) {
            const transporter = nodemailer.createTransport({
                service: 'SendGrid',
                auth: {
                    user: process.env.SENDGRID_USER,
                    pass: process.env.SENDGRID_PASSWORD
                }
            });
            const mailOptions = {
                to: user.email,
                from: 'e.aitlarbi@student.tudelft.nl',
                subject: 'Your To Do password has been changed',
                text: `Hello,\n\nThis is a confirmation that the password for your account ${user.username} has just been changed.\n`
            };
            transporter.sendMail(mailOptions, (err) => {
                req.flash('success', {msg: 'Success! Your password has been changed.'});
                done(err);
            });
        }
    ], (err) => {
        if (err) {
            return next(err);
        }
        res.redirect('/');
    });
};

/**
 * GET /forgot
 * Forgot Password page.
 */
exports.getForgot = (req, res) => {
    if (req.isAuthenticated()) {
        return res.redirect('/');
    }
    res.render('account/forgot', {
        title: 'Forgot Password'
    });
};

/**
 * POST /forgot
 * Create a random token, then send the user an email with a reset link.
 */
exports.postForgot = (req, res, next) => {
    req.assert('username', 'Please enter a valid username.').notEmpty();
    const errors = req.validationErrors();

    if (errors) {
        req.flash('errors', errors);
        return res.redirect('/forgot');
    }

    async.waterfall([
        function (done) {
            crypto.randomBytes(16, (err, buf) => {
                const token = buf.toString('hex');
                done(err, token);
            });
        },
        function (token, done) {
            new User({email: req.body.username})
                .fetch()
                .then(function (user) {
                    if (user.email !== req.body.email) {
                        req.flash('errors', {msg: "Account doesn't match the provided email."});
                        return res.redirect('/forgot');
                    }
                    if (!user) {
                        req.flash('error', {msg: 'Account with that username does not exist.'});
                        return res.redirect('/forgot');
                    }
                    user.set('passwordResetToken', token);
                    user.set('passwordResetExpires', new Date(Date.now() + 3600000)); // expire in 1 hour
                    user.save(user.changed, {patch: true}).then(function () {
                        done(null, token, user.toJSON());
                    });
                });
        },
        function sendForgotPasswordEmail(token, user, done) {
            const transporter = nodemailer.createTransport({
                service: 'SendGrid',
                auth: {
                    user: process.env.SENDGRID_USER,
                    pass: process.env.SENDGRID_PASSWORD
                }
            });
            const mailOptions = {
                to: user.email,
                from: 'e.aitlarbi@student.tudelft.nl',
                subject: '✔ Reset your password on To Do',
                text: `You are receiving this email because a reset of the password for your account: ${req.user.username} has been requested.\n\n
          Please click on the following link, or paste this into your browser to complete the process:\n\n
          http://${req.headers.host}/reset/${token}\n\n
          If you did not request this, please ignore this email and your password will remain unchanged.\n`
            };
            transporter.sendMail(mailOptions, (err) => {
                req.flash('info', {msg: `An e-mail has been sent to you with further instructions.`});
                done(err);
            });
        }
    ], (err) => {
        if (err) {
            return next(err);
        }
        res.redirect('/forgot');
    });
};
