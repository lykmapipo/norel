'use strict';
var _ = require('lodash');
var norel = require('norel');

module.exports = Relation;

//TODO use lazy evaluation to model that are not already defined
function Relation(model, type, target, option) {
    this.model = model;
    this.type = type;
    this.target = target;
    this.keyField = option.key;
    this.where = option.where;
    this.through = option.through;
}

Relation.prototype.find = function(params) {
    var knex = this.target.getKnex();
    var query = getQuery.call(this);
    query = _.extend({}, params, query);

    if (this.type === 'belongsTo' || this.type === 'hasOne') {
        return knex.findOne(query);
    }

    if (this.through) {
        knex = buildThrough.call(this, knex);
        delete query[this.keyField];
    }

    return knex.find(query);
};

Relation.prototype.findOne = function(params) {
    var knex = this.target.getKnex();
    var query = getQuery.call(this);
    query = _.extend({}, params, query);

    if (this.type === 'hasMany' && this.through) {
        knex = buildThrough.call(this, knex);
        delete query[this.keyField];
    }

    return knex.findOne(query);
};

Relation.prototype.create = function(params) {

    if (this.type === 'belongsTo') {
        throw new Error('belongsTo can not create model');
    }

    var source = this.model;
    var foreign = this.target;

    params[this.keyField] = source.id;

    return foreign.create(params);
};

Relation.prototype.update = function(params) {
    if (this.type !== 'hasOne') {
        throw new Error('not support update on `' + this.type + '` relation');
    }

    var source = this.model;
    var foreign = this.target;

    return foreign.where(this.keyField, source.id).update(params);
};

Relation.prototype.delete = function(params) {
    var knex = this.target.getKnex();
    var query = getQuery.call(this);
    query = _.extend({}, params, query);

    if (this.type === 'hasMany' && this.through) {
        knex = buildThrough.call(this, knex);
        delete query[this.keyField];
    }

    return knex.where(query).delete();
};

//static build relation
Relation.buildRelation = function(model, definition) {
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
                var target = norel.model(item.model);
                return new Relation(this, type, target, item); //TODO Relation.call(...) is enougn
            });
        });
    }
};

function buildThrough(knex) {
    var sourceId = this.model.id;
    var through = this.through;
    var throughTable = norel.model(through.model)._tableName;
    var throughFk = through.throughFk;
    var otherKey = through.otherKey;
    knex.whereIn(this.keyField, function() {
        this.select(otherKey).where(throughFk, sourceId).from(throughTable);
    });

    return knex;
}

function getQuery() {
    var query = {};
    var source = this.model;

    if (this.where) {
        query = this.where;
    }

    if (this.type === 'hasMany' || this.type === 'hasOne') {
        query[this.keyField] = source.id;
    } else if (this.type === 'belongsTo') {
        query.id = source._meta[this.keyField];
    }

    return query;
}