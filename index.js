'use strict';
/**
 * @module Norel
 * @author Lally Elias
 *
 * @description A nodejs object relation manager
 *
 * @requires {@link https://www.npmjs.org/package/lodash|lodash}
 * @requires {@link https://www.npmjs.org/package/knex|knex}
 * @requires {@link https://www.npmjs.org/package/bluebird|bluebird}
 *
 * @type {Object}
 */
var path = require('path');
var _ = require('lodash');
var Promise = require('bluebird');

var rootPath = path.resolve(__dirname);
var libPath = path.join(rootPath, 'lib');
var pkg = require(path.join(rootPath, 'package'));


/**
 * @constructor
 * @author Lally Elias
 * @since 0.0.1
 *
 * @description  A nodejs object relation manager
 *
 * @public
 */
function Norel() {
    this.version = pkg.version;
    this.description = pkg.description;

    //knex connection
    this._knex = null;

    //models registry
    this._models = {}
};


/**
 * @function
 * @author Lally Elias
 * @since 0.0.1
 *
 * @description establish database connection
 *
 * @example
 *          var Norel = require('norel');
 *          Norel.connect({
 *                        client: 'mysql',
 *                            connection: {
 *                              host     : '127.0.0.1',
 *                              user     : 'your_database_user',
 *                              password : 'your_database_password',
 *                              database : 'myapp_test'
 *                            },
 *                            pool: {
 *                              min: 0,
 *                              max: 7
 *                            }
 *                      });
 *
 * @param  {Object} connection options to be passed to knex
 * @public
 */
Norel.prototype.connect = function(options) {
    //if there is a connection exist return
    if (this._knex) {
        return;
    }

    //check for missing connection options
    if (!_.isPlainObject(options)) {
        throw new Error('Missing connection options');
    }

    //check for client option
    if (!_.has(options, 'client')) {
        throw new Error('Missing connection client option')
    }

    //check for connection properties options
    if (!_.has(options, 'connection')) {
        throw new Error('Missing connection properties option');
    }

    //extend option with default connection pool if none specified
    if (!_.has(options, 'pool')) {
        _.extend(options, {
            pool: {
                min: 2,
                max: 10
            }
        });
    }

    //establish knex connection
    this._knex = require('knex')(options);
};


/**
 * @function
 * @since 0.0.1
 * @author Lally Elias
 *
 * @description execute a give query under transaction
 *
 * @param {Object|Function} query a query to execute under transaction
 * @return {Promise} a promise that will eventually resolved
 *                     with the result of query under transaction
 *
 * @public
 */
Norel.prototype.transacting = Promise.method(function() {
    //get query from arguments
    var query = _.first(_.toArray(arguments));

    //is there any queries specified
    if (_.isUndefined(query)) {
        throw new Error('Missing queries definitions');
    }

    //see [knex transaction](http://knexjs.org/#Transactions)
    return this
        ._knex
        .transaction(function(transaction) {
            //if its just a single query
            if (_.isObject(query) && !_.isFunction(query)) {
                return query.transacting(transaction);
            } else {
                //is functional query with chained queries in it
                return query.call(transaction);
            }
        });

});


/**
 * @function
 * @since 0.0.1
 * @author Lally Elias
 *
 * @description execute raw SQL queries
 *
 * @param  {String} rawQuery a raw SQL query to execute
 * @return {Promise}         a promise that will eventually resolve
 *                             with the value of the executed raw SQL query
 *
 * @public
 */
Norel.prototype.raw = function(rawQuery) {
    return this._knex.raw(rawQuery);
}


/**
 * @function
 * @since 0.0.1
 * @author Lally Elias
 *
 * @description  register a model into registry
 *               or return model from registry
 *
 * @example Model definition
 *      var User = Norel.model('User',modelDefinition);
 *
 * @example Model retrieval from registry
 *      var User = Norel.model('User');
 *
 *
 * @param  {String} modelName       model name to be used for registration
 * @param  {Object} modelDefinition backbone sequel model definition
 * @return {Object}                 a model that is already registered or created one
 *
 * @public
 */
Norel.prototype.model = function(modelName, modelDefinition) {
    //TODO clean this check up
    if (!modelName && !modelDefinition) {
        throw new Error('No model or model definition provided');
    }

    //TODO controll model re-registration

    //return existing model if no model definition
    if (modelName && !modelDefinition) {
        var model = this._models[modelName];
        if (!model) {
            throw new Error('Model does not exist');
        } else {
            return model;
        }
    }

    //register a model instance into a registry
    this._models[modelName] = modelDefinition;

    //return a model instance after registration
    return this._models[modelName];

};

//export new instance of Norel
var Norel = module.exports = exports = new Norel();