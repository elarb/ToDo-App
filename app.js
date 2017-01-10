/**
 * Module dependencies.
 */
const express = require('express');
const _ = require('lodash');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const bodyParser = require('body-parser');
const logger = require('morgan');
const chalk = require('chalk');
const errorHandler = require('errorhandler');
const lusca = require('lusca');
const dotenv = require('dotenv');
const MongoStore = require('connect-mongo')(session);
const flash = require('express-flash');
const path = require('path');
const ExpressBrute = require('express-brute');
const MongooseStore = require('express-brute-mongoose');
const bruteForceSchema = require('express-brute-mongoose/dist/schema');
const mongoose = require('mongoose');
const passport = require('passport');
const expressValidator = require('express-validator');
const expressStatusMonitor = require('express-status-monitor');
const sass = require('node-sass-middleware');
const multer = require('multer');
const levenshtein = require('fast-levenshtein');
const cool = require('cool-ascii-faces');

/**
 * Load environment variables from .env file, where API keys and passwords are configured.
 */
// dotenv.load({
//     path: '.env'
// });

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

/**
 * Connect to MongoDB.
 */
mongoose.Promise = global.Promise;
mongoose.connect(process.env.MONGOLAB_URI);
mongoose.connection.on('error', () => {
    console.log('%s MongoDB connection error. Please make sure MongoDB is running.', chalk.red('✗'));
    process.exit();
});

/**
 * Brute force stores
 */
const model = mongoose.model('bruteforce', bruteForceSchema);
const store = new MongooseStore(model);
const bruteforce = new ExpressBrute(store);

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
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(session({
    resave: false,
    saveUninitialized: false,
    secret: process.env.SESSION_SECRET,
    store: new MongoStore({
        url: process.env.MONGOLAB_URI,
        autoReconnect: true
    })
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

const csrfExclude = ['/addtodo', '/deletetodo', '/updatetodo', '/gettodos', '/account/reset/picture'];
app.use((req, res, next) => {
    // CSRF protection.
    if (_.includes(csrfExclude, req.path)) {
        return next();
    }
    lusca.csrf()(req, res, next);
});

// app.use(lusca.csp({/* ... */}));
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
app.post('/login', bruteforce.prevent, userController.postLogin);
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

app.get('/countme', (req, res) => {
    const session = req.session;
    if (session.views) {
        session.views++;
        res.send('You have been here ' + session.views + ' times (last visit: ' + session.lastVisit + ')');
        session.lastVisit = new Date().toLocaleDateString();
    } else {
        session.views = 1;
        session.lastVisit = new Date().toLocaleDateString();
        res.send('This is your first visit!');
    }
});

//Easter Egg
app.get('/cool', function (request, response) {
    response.send(cool());
});

// This will handle 404 requests.
app.use(function (req, res) {
    res.status(400);
    res.render('404');
});

// This will handle 500 requests.
app.use(function (error, req, res, next) {
    res.status(500);
    res.render('503');
});

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


/**
 * Start Express server.
 */
app.listen(app.get('port'), () => {
    console.log('%s App is running at http://localhost:%d in %s mode', chalk.green('✓'), app.get('port'), app.get('env'));
    console.log('  Press CTRL-C to stop\n');
});

module.exports = app;