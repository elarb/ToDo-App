/**
 * Module dependencies.
 */
const express = require('express');
const _ = require('lodash');
const compression = require('compression');
const methodOverride = require('method-override');
const session = require('express-session');
const bodyParser = require('body-parser');
const logger = require('morgan');
const chalk = require('chalk');
const errorHandler = require('errorhandler');
const lusca = require('lusca');
const dotenv = require('dotenv');
const flash = require('express-flash');
const path = require('path');
const passport = require('passport');
const expressValidator = require('express-validator');
const expressStatusMonitor = require('express-status-monitor');
const sass = require('node-sass-middleware');
const multer = require('multer');
const levenshtein = require('fast-levenshtein');


/**
 * Load environment variables from .env file, where API keys and passwords are configured.
 */
dotenv.load({
    path: '.env'
});

/**
 * Controllers (route handlers).
 */
const homeController = require('./controllers/home');
const userController = require('./controllers/user');
const feedbackController = require('./controllers/feedback');
const dashboardController = require('./controllers/dashboard');

/**
 * API keys and Passport configuration.
 */
const passportConfig = require('./config/passport');

/**
 * Create Express server.
 */
const app = express();

const server = require('http').Server(app);
const io = require('socket.io').listen(server);

/**
 * Express configuration.
 */
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.use(expressStatusMonitor());
app.use(compression());
app.use(sass({
    src: path.join(__dirname, 'public'),
    dest: path.join(__dirname, 'public')
}));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(expressValidator());
app.use(methodOverride('_method'));
app.use(session({
    resave: true,
    saveUninitialized: true,
    secret: process.env.SESSION_SECRET
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// const csrfExclude = ['/addtodo', '/deletetodo', '/updatetodo', '/gettodos'];
// app.use((req, res, next) => {
//     // CSRF protection.
//     if (_.includes(csrfExclude, req.path)) {
//         return next();
//     }
//     lusca.csrf()(req, res, next);
// });
//
// // app.use(lusca.csp({/* ... */}));
app.use(lusca.xframe('SAMEORIGIN'));
app.use(lusca.p3p('ABCDEF'));
app.use(lusca.hsts({maxAge: 31536000}));
app.use(lusca.xssProtection(true));


app.use((req, res, next) => {
    res.locals.user = req.user ? req.user.toJSON() : null;
    next();
});

app.use((req, res, next) => {
    // After successful login, redirect back to the intended page
    if (!req.user &&
        req.path !== '/login' &&
        req.path !== '/signup' && !req.path.match(/^\/auth/) && !req.path.match(/\./)) {
        req.session.returnTo = req.path;
    } else if (req.user &&
        req.path == '/account') {
        req.session.returnTo = req.path;
    }
    next();
});
app.use(express.static(path.join(__dirname, 'public'), {
    maxAge: 31557600000
}));

/**
 * Primary app routes.
 */
app.get('/', homeController.index);
app.get('/login', userController.getLogin);
app.get('^(\/login|\/logn)([a-zA-Z])+', userController.getLogin);
app.post('/login', userController.postLogin);
app.get('/logout', userController.logout);
app.get('/forgot', userController.getForgot);
app.post('/forgot', userController.postForgot);
app.get('/reset/:token', userController.getReset);
app.post('/reset/:token', userController.postReset);
app.get('/signup', userController.getSignup);
app.post('/signup', userController.postSignup);
app.get('/feedback', feedbackController.getFeedback);
app.post('/feedback', feedbackController.postFeedback);
app.get('/account', passportConfig.isAuthenticated, userController.getAccount);
app.post('/account/profile', passportConfig.isAuthenticated, userController.postUpdateProfile);
app.post('/account/reset/picture', passportConfig.isAuthenticated, userController.postResetPicture);
app.post('/account/password', passportConfig.isAuthenticated, userController.postUpdatePassword);
app.post('/account/delete', passportConfig.isAuthenticated, userController.postDeleteAccount);
app.get('/account/unlink/:provider', passportConfig.isAuthenticated, userController.getOauthUnlink);

/**
 * OAuth authentication routes. (Sign in)
 */
app.get('/auth/facebook', passport.authenticate('facebook', {scope: ['email', 'user_location']}));
app.get('/auth/facebook/callback', passport.authenticate('facebook', {failureRedirect: '/login'}), (req, res) => {
    res.redirect(req.session.returnTo || '/');
});
app.get('/auth/google', passport.authenticate('google', {scope: 'profile email'}));
app.get('/auth/google/callback', passport.authenticate('google', {failureRedirect: '/login'}), (req, res) => {
    res.redirect(req.session.returnTo || '/');
});
app.get('/auth/twitter', passport.authenticate('twitter'));
app.get('/auth/twitter/callback', passport.authenticate('twitter', {failureRedirect: '/login'}), (req, res) => {
    res.redirect(req.session.returnTo || '/');
});


/**
 * Dashboard routes
 */
app.get('/dashboard', passportConfig.isAuthenticated, dashboardController.index);
app.get('/gettodos', passportConfig.isAuthenticated, dashboardController.getTodos);
app.post('/updatetodo', passportConfig.isAuthenticated, dashboardController.update);
app.post('/deletetodo', passportConfig.isAuthenticated, dashboardController.delete);
app.post('/addtodo', passportConfig.isAuthenticated, dashboardController.addTodo);

/**
 * Dashboard routes levenshtein
 */
//TODO: Add levenshtein's algorithm to redirect almost valid links.


/**
 * Error Handler.
 */
app.use(errorHandler());

// Production error handler
if (app.get('env') === 'production') {
    app.use((err, req, res, next) => {
        console.error(err.stack);
        res.sendStatus(err.status || 500);
    });
}

// This will handle 404 requests.
// TODO: Needs to send a custom 404 page.
app.use("*", function (req, res) {
    res.status(404).send("404");
});

io.on('connection', function (socket) {
    socket.emit('news', {hello: 'world'});
    socket.on('my other event', function (data) {
        console.log('io connection: %s', data);
    });
});

/**
 * Start Express server.
 */
app.listen(app.get('port'), () => {
    console.log('%s App is running at http://localhost:%d in %s mode', chalk.green('✓'), app.get('port'), app.get('env'));
    console.log('  Press CTRL-C to stop\n');
});

module.exports = app;