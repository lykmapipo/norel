'use strict';
var path = require('path');
var _ = require('lodash');
var Promise = require('bluebird');
var inflection = require('inflection');

var rootPath = path.resolve(__dirname);
var libPath = path.join(rootPath, 'lib');
var pkg = require(path.join(rootPath, 'package'));

var Model = require(path.join(libPath, 'model'));

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
 *                              database : 'your_database_name'
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
Norel.prototype.connect = function connect(options) {
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
Norel.prototype.raw = function raw() {
    return this._knex.raw.apply(this._knex, arguments);
};


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
 * @param  {Object} modelDefinition model definition
 * @param  {Object} modelInstancePropeties model instance propeties
 * @param  {Object} modelStaticProperties model static properties
 * @return {Object}                 a model that is already registered or created one
 *
 * @public
 */
Norel.prototype.model = function model(modelName, options) {

    //is model name exist and is a string
    if (!modelName && !_.isString(modelName)) {
        throw new Error('Unknown model name definition');
    }

    //return existing model if no model definition
    if (modelName && !options) {
        var model = this._models[modelName];
        if (!model) {
            throw new Error('Model does not exist');
        } else {
            return model;
        }
    }

    //is options exist and is plain object
    if (!options && !_.isPlainObject(options)) {
        throw new Error('No model definition provided');
    }

    var tableName =
        options.tableName || inflection.tableize(inflection.pluralize(modelName));

    //build a model
    var model = Model

    model._name = modelName;

    //define model attributes
    var modelAttributes = options.attributes || {};
    var autoPrimaryKey = options.autoPrimaryKey || true;

    //build model attributes
    _.extend(model.prototype.attributes, modelAttributes);

    //extend model with autoPrimaryKey options
    _.extend(model.prototype, {
        autoPrimaryKey: autoPrimaryKey
    });

    //bind table name as class variable
    _.extend(model, {
        _tableName: tableName
    });

    //register model
    this._models[model._name] = model;

    return model;

};


//export new instance of Norel
var Norel = module.exports = exports = new Norel();