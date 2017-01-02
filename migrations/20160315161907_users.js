exports.up = function (knex, Promise) {
    return Promise.all([
        knex.schema.createTable('users', function (table) {
                table.increments();
                table.string('username').unique();
                table.string('email');
                table.string('name');
                table.string('password');
                table.string('passwordResetToken');
                table.dateTime('passwordResetExpires');
                table.string('gender');
                table.string('country');
                table.string('city');
                table.string('picture');
                table.string('facebook');
                table.string('twitter');
                table.string('google');
                table.timestamps();
            }
        ),
        knex.schema.createTable('todolist', function (table) {

            }
        ),
        knex.schema.createTable('todoitem', function (table) {

            }
        )
    ]);
};

exports.down = function (knex, Promise) {
    return Promise.all([
        knex.schema.dropTable('users')
    ])
};
