const mysql = require('mysql');
const User = require('../models/User');
const chalk = require('chalk');

/**
 * Connect to MySQL.
 */
const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});
connection.connect();

connection.on('error', () => {
    console.log('%s MySQL connection error. Please make sure MySQL is running.', chalk.red('✗'));
    process.exit();
});