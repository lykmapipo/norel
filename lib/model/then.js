'use strict';
var _ = require('lodash');
var Promise = require("bluebird");

//wrap knex then method to allow
//applying before and after hooks
//and return model instance than 
//plain object
module.exports = function Then(knexThen, knex) {
    //return then to be binded to an object
    return function then(resolve, reject, progress) {

        return Promise
            .resolve()
            .then(function() {
                //bind the before hooks
                //TODO all hooks must be promises
                // console.log(object);
                return knexThen.call(knex);
            }).then(function(result) {
                //bind after hooks
                //TODO all after hooks must be promises
                // console.log(result);
                return result;
            })
            .then(resolve, reject, progress);
    };
}