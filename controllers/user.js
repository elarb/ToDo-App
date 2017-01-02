const async = require('async');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const passport = require('passport');
const User = require('../models/User');
const zxcvbn = require('zxcvbn');

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

    const user = new User({
        username: req.body.username,
        email: req.body.email,
        password: req.body.password
    });

    User.findOne({username: req.body.username}, (err, existingUser) => {
        if (err) {
            return next(err);
        }
        if (existingUser) {
            req.flash('errors', {msg: 'Username is not available'});
            return res.redirect('/signup');
        }

        user.save((err) => {
            if (err) {
                return next(err);
            }
            req.logIn(user, (err) => {
                if (err) {
                    return next(err);
                }
                res.redirect('/');
            });
        });
    });
};

/**
 * GET /account
 * Profile page.
 */
exports.getAccount = (req, res) => {
    res.render('account/profile', {
        title: 'Account Management'
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

    User.findById(req.user.id, (err, user) => {
        if (err) {
            return next(err);
        }
        user.email = req.body.email || '';
        user.profile.name = req.body.name || '';
        user.profile.gender = req.body.gender || '';
        user.profile.country = req.body.country || '';
        user.profile.city = req.body.city || '';
        user.save((err) => {
            if (err) {
                return next(err);
            }
            req.flash('success', {msg: 'Profile information has been updated.'});
            res.redirect('/account');
        });
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

    User.findById(req.user.id, (err, user) => {
        if (err) {
            return next(err);
        }
        user.password = req.body.password;
        user.save((err) => {
            if (err) {
                return next(err);
            }
            req.flash('success', {msg: 'Password has been changed.'});
            res.redirect('/account');
        });
    });
};

/**
 * POST /account/delete
 * Delete user account.
 */
exports.postDeleteAccount = (req, res, next) => {
    User.remove({_id: req.user.id}, (err) => {
        if (err) {
            return next(err);
        }
        req.logout();
        req.flash('info', {msg: 'Your account has been deleted.'});
        res.redirect('/');
    });
};


/**
 * GET /account/unlink/:provider
 * Unlink OAuth provider.
 */
exports.getOauthUnlink = (req, res, next) => {
    const provider = req.params.provider;
    User.findById(req.user.id, (err, user) => {
        if (err) { return next(err); }
        user[provider] = undefined;
        user.tokens = user.tokens.filter(token => token.kind !== provider);
        user.save((err) => {
            if (err) { return next(err); }
            req.flash('info', { msg: `${provider} account has been unlinked.` });
            res.redirect('/account');
        });
    });
};

/**
 * GET /reset/:token
 * Reset Password page.
 */
exports.getReset = (req, res, next) => {
    if (req.isAuthenticated()) {
        return res.redirect('/');
    }
    User
        .findOne({passwordResetToken: req.params.token})
        .where('passwordResetExpires').gt(Date.now())
        .exec((err, user) => {
            if (err) {
                return next(err);
            }
            if (!user) {
                req.flash('errors', {msg: 'Password reset token is invalid or has expired.'});
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
            req.flash('errors', {msg: 'Password not accepted. Please provide a stronger password'});
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
        function resetPassword(done) {
            User
                .findOne({passwordResetToken: req.params.token})
                .where('passwordResetExpires').gt(Date.now())
                .exec((err, user) => {
                    if (err) {
                        return next(err);
                    }
                    if (!user) {
                        req.flash('errors', {msg: 'Password reset token is invalid or has expired.'});
                        return res.redirect('back');
                    }
                    user.password = req.body.password;
                    user.passwordResetToken = undefined;
                    user.passwordResetExpires = undefined;
                    user.save((err) => {
                        if (err) {
                            return next(err);
                        }
                        req.logIn(user, (err) => {
                            done(err, user);
                        });
                    });
                });
        },
        function sendResetPasswordEmail(user, done) {
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
 * Create a random token, then the send user an email with a reset link.
 */
exports.postForgot = (req, res, next) => {
    req.assert('username', 'Please enter a valid username.').notEmpty();
    const errors = req.validationErrors();

    if (errors) {
        req.flash('errors', errors);
        return res.redirect('/forgot');
    }

    async.waterfall([
        function createRandomToken(done) {
            crypto.randomBytes(16, (err, buf) => {
                const token = buf.toString('hex');
                done(err, token);
            });
        },
        function setRandomToken(token, done) {
            User.findOne({username: req.body.username}, (err, user) => {
                if (err) {
                    return done(err);
                }
                if (user.email !== req.body.email) {
                    req.flash('errors', {msg: "Account doesn't match the provided email."});
                    return res.redirect('/forgot');
                }
                if (!user) {
                    req.flash('errors', {msg: 'Account with that username does not exist.'});
                    return res.redirect('/forgot');
                }
                user.passwordResetToken = token;
                user.passwordResetExpires = Date.now() + 3600000; // 1 hour
                user.save((err) => {
                    done(err, token, user);
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
                subject: 'Reset your password on To Do',
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
