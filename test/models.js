const mongoose = require('mongoose');
const {expect} = require('chai');
const sinon = require('sinon');
require('sinon-mongoose');

const User = require('../models/User');

describe('User Model', () => {
    it('should create a new user', (done) => {
        const UserMock = sinon.mock(new User({username: 'test', password: 'root'}));
        const user = UserMock.object;

        UserMock
            .expects('save')
            .yields(null);

        user.save(function (err, result) {
            UserMock.verify();
            UserMock.restore();
            expect(err).to.be.null;
            done();
        });
    });

    it('should return error if user is not created', (done) => {
        const UserMock = sinon.mock(new User({username: 'test', password: 'root'}));
        const user = UserMock.object;
        const expectedError = {
            name: 'ValidationError'
        };

        UserMock
            .expects('save')
            .yields(expectedError);

        user.save((err, result) => {
            UserMock.verify();
            UserMock.restore();
            expect(err.name).to.equal('ValidationError');
            expect(result).to.be.undefined;
            done();
        });
    });

    it('should not create a user with an already used username', (done) => {
        const UserMock = sinon.mock(User({username: 'test', password: 'root'}));
        const user = UserMock.object;
        const expectedError = {
            name: 'MongoError',
            code: 11000
        };

        UserMock
            .expects('save')
            .yields(expectedError);

        user.save((err, result) => {
            UserMock.verify();
            UserMock.restore();
            expect(err.name).to.equal('MongoError');
            expect(err.code).to.equal(11000);
            expect(result).to.be.undefined;
            done();
        });
    });

    it('should find user by username', (done) => {
        const userMock = sinon.mock(User);
        const expectedUser = {
            _id: '5700a128bd97c1341d8fb365',
            username: 'test'
        };

        userMock
            .expects('findOne')
            .withArgs({username: 'test'})
            .yields(null, expectedUser);

        User.findOne({username: 'test'}, (err, result) => {
            userMock.verify();
            userMock.restore();
            expect(result.username).to.equal('test');
            done();
        })
    });

    it('should remove user by username', (done) => {
        const userMock = sinon.mock(User);
        const expectedResult = {
            nRemoved: 1
        };

        userMock
            .expects('remove')
            .withArgs({username: 'test'})
            .yields(null, expectedResult);

        User.remove({username: 'test'}, (err, result) => {
            userMock.verify();
            userMock.restore();
            expect(err).to.be.null;
            expect(result.nRemoved).to.equal(1);
            done();
        })
    });
});
