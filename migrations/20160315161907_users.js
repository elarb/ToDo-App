exports.up = function (knex, Promise) {
    return Promise.all([
        knex.schema.createTableIfNotExists ('Users', function (table) {
                table.increments();
                table.string('Email').unique();
                table.string('Name');
                table.string('Password');
                table.string('PasswordResetToken');
                table.dateTime('PasswordResetExpires');
                table.string('Gender');
                table.string('Country');
                table.string('Region');
                table.string('Picture');
                table.string('Facebook');
                table.string('Twitter');
                table.string('Google');
                table.timestamps();
            }
        ),
        // knex.schema.createTable('todolist', function (table) {
        //
        //     }
        // ),
        knex.schema.createTableIfNotExists ('TodoItems', function (table) {
                table.increments();
                table.string('Title');
                table.string('Description');
                table.date('DueDate');
                table.integer('Priority');
                table.boolean('Completed');
                table.date('CompletionDate');
                table.timestamps();
                table.integer('UserID').unsigned().index().references('id').inTable('Users').onDelete('CASCADE');
            }
        )
    ]);
};

exports.down = function (knex, Promise) {
    return Promise.all([
        knex.schema.dropTable('users')
    ])
};
