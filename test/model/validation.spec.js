var expect = require('chai').expect;
var faker = require('faker');
var moment = require('moment');
var path = require('path');
var norel = require('norel');

//The validation api is a provided by validate.js
//check out for more validation at http://validatejs.org

describe('Model#Validation', function() {

    it('should be able to validate presence of an attribute', function(done) {
        var User = norel.model('User');

        new User()
            .validate()
            .catch(function(error) {
                expect(error).to.eql({
                    username: ["Username can't be blank"]
                });

                done();
            });

    });

    it('should be able to validate minimum length of a string attribute', function(done) {
        var User = norel.model('User');

        new User({
                username: 'Jiml',
            })
            .validate()
            .catch(function(error) {
                expect(error).to.eql({
                    username: ['Username must be at least 6 characters']
                });

                done();
            });
    });

    it('should be able to validate maximum length of a string attribute', function(done) {
        var User = norel.model('User');

        new User({
                username: faker.name.findName(),
                surname: 'Jimlilalt'
            })
            .validate()
            .catch(function(error) {
                expect(error).to.eql({
                    surname: ['Surname must be at most 6 characters']
                });

                done();
            });
    });

    it('should be able to validate its numeric attribute', function(done) {
        var User = norel.model('User');

        new User({
                username: faker.name.findName(),
                friends: 445
            })
            .validate()
            .catch(function(error) {
                expect(error).to.eql({
                    friends: ['Friends must be less than or equal to 30']
                });

                done();
            });
    });

    it('should be able to validate its date attribute', function(done) {
        var User = norel.model('User');

        new User({
                username: faker.name.findName(),
                updated_at: 'foobar'
            })
            .validate()
            .catch(function(error) {
                expect(error).to.eql({
                    updated_at: ["Updated at must be a valid date"]
                });

                done();
            });
    });

    it('should be able to check if it attribute follow a given format/pattern', function(done) {
        var User = norel.model('User');

        new User({
                username: faker.name.findName(),
                surname: '_!Jro$'
            })
            .validate()
            .catch(function(error) {
                expect(error).to.eql({
                    surname: ["Surname can only contain a-z and 0-9"]
                });

                done();
            });
    });

    it('should be able to check if an attribute is a valid email', function(done) {
        var User = norel.model('User');

        new User({
                username: faker.name.findName(),
                email: faker.name.lastName()
            })
            .validate()
            .catch(function(error) {
                expect(error).to.eql({
                    email: ["Email doesn't look like a valid email"]
                });

                done();
            });
    });

    it('should be able to check if an attribute is within a given excluding list', function(done) {
        var User = norel.model('User');

        new User({
                username: faker.name.findName(),
                country: 'jp'
            })
            .validate()
            .catch(function(error) {
                expect(error).to.eql({
                    country: ["We don't support jp right now, sorry"]
                });

                done();
            });
    });

});