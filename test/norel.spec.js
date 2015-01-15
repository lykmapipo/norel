var expect = require('chai').expect;

var norel = require('norel');

describe('norel', function() {

    it('should be an object', function(done) {
        expect(norel).to.be.an('object');
        done();
    });

    it('should have a version', function(done) {
        expect(norel.version).to.equal('0.0.1');
        done();
    });

    it('should do have connect capability', function(done) {
        expect(norel.connect).to.be.a("function");
        done();
    });

    it('should establish database connection', function(done) {
        norel
            .connect({
                debug: true,
                client: 'sqlite3',
                connection: {
                    filename: "./test.sqlite"
                }
            });

        expect(norel._knex).to.not.be.null;
        done();
    });

    it('should not connect if connection is already established', function(done) {
        norel
            .connect({
                debug: true,
                client: 'sqlite3',
                connection: {
                    filename: "./test.sqlite"
                }
            });

        expect(norel._knex).to.not.be.null;
        done();
    });

    it('should return itself when required multiple time', function(done) {
        var norel2 = require('norel');
        expect(norel2).to.eql(norel);
        done();
    });


    it('should be able to use it connection to run raw queries', function(done) {
        norel
            .raw('SELECT 1=1')
            .then(function(result) {
                expect(result).to.not.be.null;
                done();
            })
            .catch(function(error) {
                expect(error).to.not.be.null;
                done(error);
            });

    });

    it('should expose model definition', function(done) {
        expect(norel.model).to.be.a('function');
        done();
    });

    it('should do be able to register a model', function(done) {
        var model = {};
        norel
            .model('User', model);
        expect(norel.model('User')).to.equal(model);
        done();
    });

    it('should do have transacting capability', function(done) {
        expect(norel.transacting).to.be.a("function");
        done();
    });

    it('should throw Missing queries definitions if no query given for transaction', function(done) {
        norel
            .transacting()
            .catch(function(error) {
                expect(error.message).to.equal('Missing queries definitions');
                done();
            });

    });

    it('should be able to run query under transaction', function(done) {
        norel
            .transacting(norel.raw('SELECT 1=1'))
            .then(function(result) {
                expect(result).to.not.be.null;
                done();
            })
            .catch(function(error) {
                expect(error).to.not.be.null;
                done(error);
            });

    });

    it('should be able to run multiple queries under single transaction', function(done) {
        norel
            .transacting(function(transaction) {
                return norel
                    .raw('SELECT 1=1')
                    .transacting(transaction)
                    .then(function(result) {
                        return norel
                            .raw('SELECT 2=2')
                            .transacting(transaction);
                    });
            })
            .then(function(result) {
                expect(result).to.not.be.null;
                done();
            })
            .catch(function(error) {
                done(error);
            });
    });

});