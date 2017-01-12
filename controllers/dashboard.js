const mysql = require('mysql');
const User = require('../models/User');
const chalk = require('chalk');
const knex = require('knex')({
    client: 'mysql',
    connection: {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    },
    pool: {min: 0, max: 7}
});


/**
 * GET /
 * Dashboard.
 */
exports.index = (req, res) => {
    const cookie = req.cookies.bgcolor;
    if (cookie === undefined) {
        res.cookie('bgcolor', '#49b3ff', {
            maxAge: 30 * 24 * 60 * 60 * 1000,
            Domain: 'localhost:3000',
            Path: '/dashboard'
        });
    }
    res.render('dashboard', {
        title: 'Dashboard'
    });
};

/**
 *  GET /
 *  Get Todos from the database
 */
exports.getTodos = (req, res) => {
    knex.select().from('todoitems').where('userid', req.user.id).then(function (rows) {
        let data = [];
        for (let i = 0; i < rows.length; i++) {
            data.push(rows[i]);
        }
        res.send(data);
    }).catch(function (err) {
        console.error(err);
    });

};

/**
 *  POST /
 *  Update the to-do
 */
exports.update = (req, res) => {
    let todo = req.body.data;
    let date = new Date(todo.DueDate);
    knex('todoitems').where('id', todo.id).update({
        Title: todo.Title,
        DueDate: date,
        Completed: todo.Completed,
        Priority: todo.Priority
    }).then(function () {
        res.end();
    }).catch(function (err) {
        console.log(err);
    });


};

/**
 *  POST /
 *  Delete a to-do from the database.
 */
exports.delete = (req, res) => {
    let todo = req.body.data;
    knex('todoitems')
        .where('id', todo.id)
        .del().then(function () {
        res.end();
    }).catch(function (err) {
        console.log(err);
    });
};

/**
 *  POST /
 *  Add a to-do to the database.
 */
exports.addTodo = (req, res) => {
    let todo = req.body.data;
    let date = new Date(todo.DueDate);
    todo.DueDate = date.toISOString().slice(0, 19).replace('T', ' ');

    knex.insert({
        Title: todo.Title,
        DueDate: todo.DueDate,
        Completed: todo.Completed,
        Priority: todo.Priority,
        UserId: req.user.id
    })
        .returning('id')
        .into('todoitems')
        .then(function (id) {
            res.status(200).send(id.toString());
        }).catch(function (error) {
        console.log(error);
    });
};
