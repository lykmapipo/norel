var path = require('path');
var _ = require('lodash');
var Promise = require('bluebird');

var validate = require('validate.js');
validate.Promise = function(callback) {
    return new Promise(callback);
};

var methods = require(path.join(__dirname, '..', 'methods'));
var Then = require(path.join(__dirname, 'then'));

var instanceMethods = ['insert', 'update', 'delete', 'del'];

/**
 * @description The "Model" is similar to the 'Active Model' in Rails,
 *              it defines a standard interface from which other objects may inherit.
 * @param {Object} attributes attributes to set into this model instance
 */
function Model(attributes) {
    this._initialize();

    //set attributes if any specified
    if (attributes) {
        this.set(attributes);
    }

    //return self
    return this;
}

//a default model id attribute 
Model.prototype.idAttribute = 'id';
//enable auto primary key
Model.prototype.autoPrimaryKey = true;
Model.prototype.attributes = {};

/**
 * @function
 * @author Lally Elias
 * @since 0.0.1
 *
 * @description initialize attributes with null values
 *
 * @private
 */
Model.prototype._initialize = function() {
    var self = this;

    //extend attributes with id attribute
    if (!_.has(this.attributes, this.idAttribute)) {
        var id = this.idAttribute;
        _.extend(this.attributes, {
            id: {}
        });
    }

    _(_.keys(this.attributes)).forEach(function(attributeName) {
        var attributeHash = self.attributes[attributeName];

        //initialize each attribute with null values
        //otherwise use default value specified
        self.attributes[attributeName] = _.extend(attributeHash, {
            value: null
        });

        //bind magic getters and setters
        Object.defineProperty(self, attributeName, {
            get: function() {
                return self.get(attributeName);
            },
            set: function(value) {
                self.set(attributeName, value);
            }
        });

    });


};


/**
 * @function
 * @author Lally Elias
 * @since 0.0.1
 *
 * @default validate this model instance
 *
 * @return {Promise} a promise that will eventually resolve with
 *                     the hash of valid attributes else rejectected
 *                     with hash of validation errors
 *
 * @public
 */
Model.prototype.validate = function() {
    //TODO if attribute type if date convert it to string before validate
    var self = this;

    var unknownValidators = ['value'];
    var constraints = {};

    //build constraints hash
    _(_.keys(this.attributes)).forEach(function(attributeName) {
        var attributeHash = self.attributes[attributeName];

        //remove unknown validators
        _(unknownValidators).forEach(function(unknownValidator) {
            attributeHash = _.omit(attributeHash, unknownValidator);
        });

        //add to constraints hash 
        constraints[attributeName] = attributeHash;
    });

    //validate
    return validate.async(this.toJSON(), constraints);

};

/**
 * @function
 * @author Lally Elias
 * @since 0.0.1
 *
 * @description check if this model has the given attribute
 *
 * @param  {String} attrribute this model attribute to check for existence
 * @return {Boolean} return true otherwise false
 *
 * @public
 */
Model.prototype.has = function(attribute) {
    return _.has(this.attributes, attribute);
};


/**
 * @function
 * @author Lally Elias
 * @since 0.0.1
 *
 * @description check whether a specified attribute has a value or not.
 *
 * @param  {String}  attribute an attribute to check if it has a value
 * @return {Boolean}           true if the attribute contains a value
 *                             that is not null or undefined otherwise false
 *
 * @public
 */
Model.prototype.hasValue = function(attribute) {
    var value = this.get(attribute);

    if (_.isUndefined(value) || _.isNull(value)) {
        return false;
    }

    return true;
};


/**
 * @function
 * @author Lally Elias
 * @since 0.0.1
 *
 * @description check if this model has already been persisted
 *              and have an id value
 *
 * @return {Boolean} true if it has an id value set else false
 *
 * @public
 */
Model.prototype.isNew = function() {
    return !this.hasValue(this.idAttribute);
};


/**
 * @function
 * @author Lally Elias
 * @since 0.0.1
 *
 * @description get a value of the specified attribute
 *
 * @param  {String} attrribute this model attribute to get
 * @return {Object}      a specified attribute value
 *
 * @public
 */
Model.prototype.get = function(attribute) {
    if (!this.has(attribute)) {
        throw new Error('Unknown model attribute');
    }

    return this.attributes[attribute].value;
};


/**
 * @function
 * @author Lally Elias
 * @since 0.0.1
 *
 * @description set a value of a given attribute of this model specified by a given key.
 *              if the provided key is a hash it will be used directly to affect the hash
 *              attributes of this model
 *
 * @param {Object|String} key   a key of the attribute to set
 *                              or a hash to set on this model attributes
 * @param {String} value to set on the key provided if undefined the null value is set
 * @return {Object}           model instance
 *
 * @public
 */
Model.prototype.set = function(key, value) {
    //TODO implement parser to parse in data
    var self = this;

    var attrs;

    //check for undefined or null key
    if (_.isUndefined(key) || _.isNull(key)) {
        throw new Error('Unknown set parameters');
    }

    // Handle both `"key", value` and `{key: value}` -style arguments.
    if (_.isPlainObject(key)) {
        attrs = key;
    } else {
        (attrs = {})[key] = value;
    }

    // For each `set` attrs set this model attribute
    _(_.keys(attrs)).forEach(function(attr) {
        //check if this model has the given attribute in its attribute hash
        if (self.has(attr)) {
            //TODO validate attr before set
            //set attribute value
            self.attributes[attr].value = attrs[attr];
        }
    });
};


/**
 * @function
 * @author Lally Elias
 * @since 0.0.1
 *
 * @description compute json presentation of this module
 *
 * @return {Object}   a json presentation of this module
 *
 * @public
 */
Model.prototype.toJSON = function() {
    //TODO handle date object to string
    var self = this;
    var toJson = {};

    _(_.keys(this.attributes)).forEach(function(attributeName) {
        toJson[attributeName] = self.attributes[attributeName].value;
    });

    return toJson;
};

/**
 * @description Process model to knex aware object for query manipulations
 * @return {Object} a plain object presentation of this model
 */
Model.prototype._toObject = function() {
    //TODO handle date object to string
    var self = this;
    var toObject = {};

    _(_.keys(this.attributes)).forEach(function(attributeName) {
        toObject[attributeName] = self.attributes[attributeName].value;
    });

    //delete id if auto primary key is used
    if (self.autoPrimaryKey) {
        delete toObject.id;
    }

    return toObject;
};

//bind knex builder methods as model instance query chains
_(instanceMethods).forEach(function(method) {
    Model.prototype[method] = function() {
        var self = this;
        //lazy evaluate _knex
        var norel = require('norel');

        //evaluate table name
        var knex = norel._knex(Model._tableName);

        //override knex.then
        var knexThen = knex.then;

        knex.then = Then(knexThen, knex);

        //bind knex query method to the model
        // Model.knex = knex[method].apply(knex, arguments);
        return knex[method].call(knex, self._toObject());
    };
});

//bind knex builder methods as model static query chains
_(methods).forEach(function(method) {
    Model[method] = function() {
        var args = arguments;
        //lazy evaluate _knex
        var norel = require('norel');

        //evaluate table name
        var knex = norel._knex(Model._tableName);

        //override knex.then
        var knexThen = knex.then;

        knex.then = Then(knexThen, knex);
        //bind knex query method to the model
        // Model.knex = knex[method].apply(knex, arguments);
        return knex[method].apply(knex, args);
    };
});

//export model
module.exports = Model;