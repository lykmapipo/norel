# norel 
A Nodejs object relation manager

It uses [Knex Query Builder](http://knexjs.org/) as a query builder and inspired by [Bookshelf.js](http://bookshelfjs.org/)

## Example

```js
//require norel
var Norel = require('norel');
var faker = require('faker');

//establish database connection
Norel.connect({
                 client: 'mysql',
                 connection: {
                      host     : '127.0.0.1',
                      user     : 'your_database_user',
                      password : 'your_database_password',
                      database : 'your_database_name'
                     },
                     pool: {
                       min: 0,
                       max: 7
                     }
              });

//define a model
var User = norel
            .model('User', {
                tableName: 'users',
                attributes: {
                    email: {
                        email: {
                            message: "doesn't look like a valid email"
                        }
                    },
                    username: {
                        presence: true,
                        length: {
                            minimum: 6,
                            message: "must be at least 6 characters"
                        }
                    },
                    surname: {
                        length: {
                            maximum: 6,
                            message: "must be at most 6 characters"
                        },
                        format: {
                            pattern: "[a-z0-9]+",
                            flags: "i",
                            message: "can only contain a-z and 0-9"
                        }
                    },
                    friends: {
                        numericality: {
                            onlyInteger: true,
                            greaterThan: 0,
                            lessThanOrEqualTo: 30
                        }
                    },
                    country: {
                        exclusion: {
                            within: {
                                jp: "Japan",
                                ch: "China"
                            },
                            message: "^We don't support %{value} right now, sorry"
                        }
                    },
                    updated_at: {
                        datetime: true
                    }
                }
            });

//now queries
//you can chain queries as in knex
User
    .insert({
        username: faker.name.firstName(),
        updated_at: faker.date.past()
    })
    .then(function(results) {
        console.log(results);
    }).catch(function(error) {
        console.log(error);
    });

User
    .select()
    .where({
        username: faker.name.firstName()
    })
    .then(function(results) {
        console.log(results);
    }).catch(function(error) {
        console.log(error);
    });
```

##Test
* Install all development dependencies
```sh
$ npm install --dev
```

* npm link norel
```sh
$ npm link
$ npm link norel
```

* Then run the test
```sh
$ npm test
```

## TODO
- [x] Norel
- [x] Norel.connect
- [x] Norel.model
- [x] Norel.raw
- [x] Norel.transacting
- [x] Model
- [x] Model static knex query builder methods
- [x] Model instance insert, update, delete methods
- [x] Model validation
- [ ] Return model instance(s) after query execution
- [ ] Model custom validators
- [ ] Relation `through`
- [ ] Realtion `hasOne`
- [ ] boardcast event
  - [ ] `beforeCreate`
  - [ ] `afterCreate`
  - [ ] `beforeUpdate`
  - [ ] `afterCreate`
  - [ ] `beforeFind`
  - [ ] `afterFind`
  - [ ] `afterFindOne`
