var expect = require('chai').expect;
var _ = require('lodash');

var norel = require('norel');
var name = 'Joe Doe';

describe('norel model#statics', function() {
    it('should have knex methods binded to it static', function(done) {
        expect(_.keys(norel.model('User')).toString()).to.include(norel.methods);
        done();
    });

    it('should have create capability', function(done) {
        var User = norel.model('User');

        User.create({
            id: 10,
            username: name
        }).then(function(user) {
            expect(user.id).to.exist;
            done();
        }).catch(function(error) {
            done(error);
        });
    });


    it('should have findOne capability', function(done) {

        var User = norel.model('User');

        User
            .findOne({
                id: 10
            }).then(function(user) {
                expect(user.username).to.equal(name);
                done();
            }).catch(function(error) {
                console.log(error);
            });

    });

    it('should have findOne capability with chained where', function(done) {

        var User = norel.model('User');

        User
            .findOne()
            .where({
                id: 10
            }).then(function(user) {
                expect(user.username).to.equal(name);
                done();
            }).catch(function(error) {
                console.log(error);
            });

    });

});