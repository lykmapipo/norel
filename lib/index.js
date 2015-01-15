'use strict';
var _ = require('lodash');
var pjson = require('../package.json');
var momery = require('./momery');
var utils = require('./utils');
var Builder = require('./builder');
var methods = require('./methods');


//TODO module registry
//lazy association model valuation
//more instance methods
//state manager
//segregate instance and class method
module.exports = function(knex) {
    var Relation = require('./relation');
    var Base = require('./base');
    Base._knex = knex;

    var KenxModel = {
        VERSION: pjson.version,
        define: define,
        BaseModel: Base
    };

    return KenxModel;

    function define(name, definition, prototype, classProps) {
        if (typeof name !== 'string') {
            definition = name;
            name = '_NoName_';
        }

        var tableName = definition.tableName;//TODO use inflection if no tablename provided
        var model = function(params) {
            //this is current model
            Base.call(this, params);
        };

        model._name = name;

        /** save Model reference */
        model.prototype.class = model;

        /** save super class prototype reference */
        model.prototype.super = Base.prototype;

        _.extend(model.prototype, Base.prototype, prototype);
        _.extend(model, Base, classProps, {
            _tableName: tableName
        });

        /** build event handler */
        buildEventHandler(model);

        buildRelation(model, definition);

        buildKnexMethod(model);

        /** save model to momery */
        momery.set(model._name, model);

        return model;
    }

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
    }

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
    }

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
    }
};