const mysql = require('mysql');
const User = require('../models/User');

// Connection to the database.
const connection = mysql.createConnection({
    host: 'localhost',
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PW,
    database: 'todo'
});

connection.connect();

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
    connection.query('SELECT * FROM todoitem', (err, rows) => {
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
    }
};

/**
 *  POST /
 *  Update the to-do
 */
exports.update = (req, res) => {
    let todo = req.body.data;
    let date = new Date(todo.DueDate);
    todo.DueDate = date.toISOString().slice(0, 19).replace('T', ' ');
    let query = connection.query('UPDATE todoitem SET Title = ?, DueDate = ?, Completed = ?, Priority = ? WHERE Id = ?',
        [todo.Title, todo.DueDate, todo.Completed, todo.Priority, todo.Id]);
};

/**
 *  POST /
 *  Delete a to-do from the database.
 */
exports.delete = (req, res) => {
    let todo = req.body.data;
    connection.query("DELETE FROM todoitem WHERE id = ?", todo.Id);
};

/**
 *  POST /
 *  Add a to-do to the database.
 */
exports.addTodo = (req) => {
    let todo = req.body.data;
    let date = new Date(todo.DueDate);
    todo.DueDate = date.toISOString().slice(0, 19).replace('T', ' ');
    let now = new Date(Date.now());
    todo.CreationDate = now.toISOString().slice(0, 19).replace('T', ' ');

    const query = connection.query('INSERT INTO todoitem SET Title = ?, DueDate = ?, Completed = ?, Priority = ?, CreationDate = ?',
        [todo.Title, todo.DueDate, todo.Completed, todo.Priority, todo.CreationDate], (err, result) => {
            if (err) {
                console.error(err);
                return;
            }
        });
};

//TODO: Add custom theme functionality with the use of cookies