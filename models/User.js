const crypto = require('crypto');
const bcrypt = require('bcrypt-nodejs');
const bookshelf = require('../config/bookshelf');

let User = bookshelf.Model.extend({
    tableName: 'Users',
    hasTimestamps: true,

    initialize: function () {
        this.on('saving', this.hashPassword, this);
    },

    hashPassword: function (model, attrs, options) {
        let password = options.patch ? attrs.Password : model.get('Password');
        if (!password) {
            return;
        }
        return new Promise(function (resolve, reject) {
            bcrypt.genSalt(10, function (err, salt) {
                bcrypt.hash(password, salt, null, function (err, hash) {
                    if (options.patch) {
                        attrs.Password = hash;
                    }
                    model.set('Password', hash);
                    resolve();
                });
            });
        });
    },

    comparePassword: function (password, done) {
        const model = this;
        bcrypt.compare(password, model.get('Password'), function (err, isMatch) {
            done(err, isMatch);
        });
    },

    hidden: ['Password', 'PasswordResetToken', 'PasswordResetExpires'],

    virtuals: {
        gravatar: function () {
            if (!this.get('Email')) {
                return 'https://gravatar.com/avatar/?s=200&d=retro';
            }
            const md5 = crypto.createHash('md5').update(this.get('Email')).digest('hex');
            return 'https://gravatar.com/avatar/' + md5 + '?s=200&d=retro';
        }
    }
});

module.exports = User;
