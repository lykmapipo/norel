var expect = require('chai').expect;
var _ = require('lodash');
var path = require('path');
var faker = require('faker');
var norel = require('norel');

describe('Model#instance', function() {

    it('should have knex insert,update,delete binded as instance methods', function(done) {
        var User = norel.model('User');
        expect(_.keys(User.prototype).toString()).to.include(['insert', 'update', 'delete', 'del']);
        done();
    });

    it('should have magic getter and setter', function(done) {
        var User = norel.model('User');

        var username = faker.name.firstName();
        var updated_at = faker.date.past();

        var user = new User();

        expect(user.username).to.be.null;

        user.username = username;

        expect(user.username).to.equal(username);

        done();

    });

    it('should be able to insert data', function(done) {
        var User = norel.model('User');

        var username = faker.name.firstName();
        var updated_at = faker.date.past();

        new User({
                username: username,
                updated_at: updated_at
            })
            .insert()
            .then(function(results) {
                console.log(results);
                done();
            }).catch(function(error) {
                done(error);
            });

    });


    it('should be able to insert data under transaction', function(done) {
        var User = norel.model('User');

        var username = faker.name.firstName();
        var updated_at = faker.date.past();

        norel
            .transacting(
                new User({
                    username: username,
                    updated_at: updated_at
                })
                .insert()
            ).then(function(results) {
                console.log(results);
                done();
            }).catch(function(error) {
                done(error);
            });

    });

});