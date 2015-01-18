var expect = require('chai').expect;
var _ = require('lodash');
var path = require('path');
var faker = require('faker');
var norel = require('norel');


var methods = require(path.join(process.cwd(), 'lib', 'methods'));

describe('Model#static', function() {

    it('should have knex methods binded as class methods', function(done) {
        var User = norel.model('User');

        expect(_.keys(User).toString()).to.include(methods);
        done();
    });

    it('should be able to insert data', function(done) {
        var User = norel.model('User');

        var username = faker.name.firstName();
        var updated_at = faker.date.past();

        User
            .insert({
                username: username,
                updated_at: updated_at
            })
            .then(function(results) {
                console.log(results);
                done();
            }).catch(function(error) {
                done(error);
            });

    });

    it('should be able to select data', function(done) {
        var User = norel.model('User');

        User
            .select()
            .where({
                name: faker.name.firstName()
            })
            .then(function(results) {
                console.log(results);
                done();
            }).catch(function(error) {
                done(error);
            });

    });

});