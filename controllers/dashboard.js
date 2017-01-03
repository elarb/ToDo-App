const mysql = require('mysql');
const User = require('../models/User');
const chalk = require('chalk');


/**
 * Connect to MySQL.
 */
let mysqlClient = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});
handleDisconnect(mysqlClient);

function handleDisconnect(client) {
    client.on('error', function (error) {
        if (!error.fatal) return;
        if (error.code !== 'PROTOCOL_CONNECTION_LOST') throw err;

        console.error('%s Re-connecting lost MySQL connection: ', chalk.red('✗') + error.stack);

        // NOTE: This assignment is to a variable from an outer scope; this is extremely important
        // If this said `client =` it wouldn't do what you want. The assignment here is implicitly changed
        // to `global.mysqlClient =` in node.
        mysqlClient = mysql.createConnection(client.config);
        handleDisconnect(mysqlClient);
        mysqlClient.connect();
    });
};

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
    todo.DueDate = date.toISOString().slice(0, 19).replace('T', ' ');
    let query = mysqlClient.query('UPDATE todoitems SET Title = ?, DueDate = ?, Completed = ?, Priority = ? WHERE Id = ?',
        [todo.Title, todo.DueDate, todo.Completed, todo.Priority, todo.Id]);
    res.end();
};

/**
 *  POST /
 *  Delete a to-do from the database.
 */
exports.delete = (req, res) => {
    let todo = req.body.data;
    mysqlClient.query("DELETE FROM todoitems WHERE id = ?", todo.Id);
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

    const query = mysqlClient.query('INSERT INTO todoitems SET Title = ?, DueDate = ?, Completed = ?, Priority = ?, UserId = ?',
        [todo.Title, todo.DueDate, todo.Completed, todo.Priority, req.user.id], (err, result) => {
            if (err) {
                console.error(err);
            }
            res.status(200).send(result.insertId.toString());
        });
};

//TODO: Add custom theme functionality with the use of cookies