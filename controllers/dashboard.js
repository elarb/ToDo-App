const mysql = require('mysql');
const User = require('../models/User');
const chalk = require('chalk');

/**
 * Connect to MySQL.
 */
const db_config = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    dateStrings: 'DATE'
};

let connection;

/**
 * Handle disconnect errors
 */
function handleDisconnect() {
    connection = mysql.createConnection(db_config); // Recreate the connection, since
                                                    // the old one cannot be reused.

    connection.connect(function (err) {              // The server is either down
        if (err) {                                     // or restarting (takes a while sometimes).
            console.log('error when connecting to db:', err);
            setTimeout(handleDisconnect, 2000); // We introduce a delay before attempting to reconnect,
        }                                     // to avoid a hot loop, and to allow our node script to
    });                                     // process asynchronous requests in the meantime.
                                            // If you're also serving http, display a 503 error.
    connection.on('error', function (err) {
        console.log('db error', err);
        if (err.code === 'PROTOCOL_CONNECTION_LOST') { // Connection to the MySQL server is usually
            handleDisconnect();                         // lost due to either server restart, or a
        } else {                                      // connnection idle timeout (the wait_timeout
            throw err;                                  // server variable configures this)
        }
    });
}

handleDisconnect();

/**
 * GET /
 * Dashboard.
 */
exports.index = (req, res) => {
    res.render('dashboard', {
        title: 'Dashboard'
    });
};

/**
 *  GET /
 *  Get Todos from the database
 */
exports.getTodos = (req, res) => {
    mysqlClient.query('SELECT * FROM todoitems WHERE userid = ?', req.user.id, (err, rows) => {
        if (err) {
            console.error(err);
            return;
        }
        let data = [];
        for (let i = 0; i < rows.length; i++) {
            data.push(rows[i]);
        }
        res.send(data);
    });
};

/**
 *  POST /
 *  Update the to-do
 */
exports.update = (req, res) => {
    let todo = req.body.data;
    let date = new Date(todo.DueDate);
    // console.log(date.toISOString().slice(0, 19).replace('T', ' '));
    // todo.DueDate = date.toISOString().slice(0, 19).replace('T', ' ');
    mysqlClient.query('UPDATE todoitems SET Title = ?, DueDate = ?, Completed = ?, Priority = ? WHERE Id = ?',
        [todo.Title, date, todo.Completed, todo.Priority, todo.id]);
    res.end();
};

/**
 *  POST /
 *  Delete a to-do from the database.
 */
exports.delete = (req, res) => {
    let todo = req.body.data;
    mysqlClient.query("DELETE FROM todoitems WHERE id = ?", todo.id);
    res.end();
};

/**
 *  POST /
 *  Add a to-do to the database.
 */
exports.addTodo = (req, res) => {
    let todo = req.body.data;
    let date = new Date(todo.DueDate);
    todo.DueDate = date.toISOString().slice(0, 19).replace('T', ' ');

    mysqlClient.query('INSERT INTO todoitems SET Title = ?, DueDate = ?, Completed = ?, Priority = ?, UserId = ?',
        [todo.Title, todo.DueDate, todo.Completed, todo.Priority, req.user.id], (err, result) => {
            if (err) {
                console.error(err);
            }
            res.status(200).send(result.insertId.toString());
        });
};

//TODO: Add custom theme functionality with the use of cookies