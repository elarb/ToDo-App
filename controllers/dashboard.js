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
    connection.query('SELECT * FROM todoitems WHERE userid = ?', req.user.id, (err, rows) => {
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
    let query = connection.query('UPDATE todoitems SET Title = ?, DueDate = ?, Completed = ?, Priority = ? WHERE Id = ?',
        [todo.Title, todo.DueDate, todo.Completed, todo.Priority, todo.Id]);
    res.end();
};

/**
 *  POST /
 *  Delete a to-do from the database.
 */
exports.delete = (req, res) => {
    let todo = req.body.data;
    connection.query("DELETE FROM todoitems WHERE id = ?", todo.Id);
    res.end();
};

/**
 *  POST /
 *  Add a to-do to the database.
 */
//TODO: Major issue: todo id is incrementing here but resets in client memory
exports.addTodo = (req, res) => {
    let todo = req.body.data;
    let date = new Date(todo.DueDate);
    todo.DueDate = date.toISOString().slice(0, 19).replace('T', ' ');

    const query = connection.query('INSERT INTO todoitems SET Title = ?, DueDate = ?, Completed = ?, Priority = ?, UserId = ?',
        [todo.Title, todo.DueDate, todo.Completed, todo.Priority, req.user.id], (err, result) => {
            if (err) {
                console.error(err);
            }
        });
    res.end();
};

//TODO: Add custom theme functionality with the use of cookies