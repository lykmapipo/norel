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
var inflection = require('inflection');

var rootPath = path.resolve(__dirname);
var libPath = path.join(rootPath, 'lib');
var pkg = require(path.join(rootPath, 'package'));

var methods = require(path.join(libPath, 'methods'));
var Relation = require(path.join(libPath, 'relation'));
var Base = require(path.join(libPath, 'base'));
var Builder = require(path.join(libPath, 'builder'));


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

//expose methods in norel level
Norel.prototype.methods = methods;


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

    //set base knex
    Base._knex = this._knex;
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
Norel.prototype.raw = function raw(rawQuery) {
    return this._knex.raw(rawQuery);
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
Norel.prototype.model = function model(modelName, modelDefinition, modelInstanceProperties, modelStaticProperties) {
    //is model name exist and is a string
    if (!modelName && !_.isString(modelName)) {
        throw new Error('Unknown model name definition');
    }

    //return existing model if no model definition
    if (modelName && !modelDefinition) {
        var model = this._models[modelName];
        if (!model) {
            throw new Error('Model does not exist');
        } else {
            return model;
        }
    }

    //is modelDefinition exist and is plain object
    if (!modelDefinition && !_.isPlainObject(modelDefinition)) {
        throw new Error('No model definition provided');
    }

    var tableName = inflection.tableize(inflection.pluralize(modelName));

    //check for custome table name in model definition
    if (modelDefinition.tableName) {
        tableName = modelDefinition.tableName;
    }

    //build a model
    var model = function(params) {
        //TODO do we need params?
        Base.call(this, params);
    };

    model._name = modelName;

    /** save Model reference */
    model.prototype.class = model;

    /** save super class prototype reference */
    model.prototype.super = Base.prototype;

    //build model prototype
    _.extend(model.prototype, Base.prototype, modelInstanceProperties);

    //build model static
    _.extend(model, Base, modelStaticProperties, {
        _tableName: tableName
    });

    //build event handler
    buildEventHandler(model);

    buildRelation(model, modelDefinition);

    buildKnexMethod(model);

    //register model
    this._models[model._name] = model;

    return model;

};

function buildKnexMethod(model) {
    methods
        .concat(_.keys(Builder.prototype))
        .forEach(function(method) {
            //attach static mmethod to model
            model[method] = function() {
                //TODO move it out call it once and utilize it on iterations
                var builder = new Builder(model);
                return builder[method].apply(builder, arguments);
            };
        });
    model.getKnex = function() {
        return new Builder(model);
    };
};

function buildRelation(model, definition) {
    var proto = model.prototype;

    if (definition.hasMany) {
        buildRelation('hasMany', definition.hasMany);
    }

    if (definition.belongsTo) {
        buildRelation('belongsTo', definition.belongsTo);
    }

    if (definition.hasOne) {
        buildRelation('hasOne', definition.hasOne);
    }

    function buildRelation(type, options) {
        options = _.isArray(options) ? options : [options];
        _.each(options, function(item) {
            var name = item.name || item.model;
            proto.__defineGetter__(name, function() {
                var target = utils.getModel(item.model);
                return new Relation(this, type, target, item); //TODO Relation.call(...) is enougn
            });
        });
    }
};

function buildEventHandler(model) {
    var events = model._eventQueue = {
        beforeCreate: [],
        afterCreate: [],
        beforeUpdate: [],
        afterUpdate: []
    };

    model.register = function(name, callback) {
        var queue = events[name];
        if (!queue) {
            throw new Error('not support event name' + name);
        }
        queue.push(callback);
    };
};

//export new instance of Norel
var Norel = module.exports = exports = new Norel();