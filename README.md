# norel 
A Nodejs object relation manager

It is built atop the [Knex Query Builder](http://knexjs.org/) ,
borrow a lot from [knex-model](https://github.com/wcp1231/knex-model)
and inspired by [Bookshelf.js](http://bookshelfjs.org/)

## Example

```js
var Model = require('norel')(knex);
var Promise = require('bluebird');

var User = Model.model('User', {
  tableName: 'users',
  hasMany: [
    {
      name: 'entries',
      model: 'Entry',
      key: 'user_id'
    }
  ]
}, {
  instanceMethod: function() {}
});

var Entry = Model.model('Entry', {
  tableName: 'entries',
  belongsTo: {
    name: 'author',
    model: 'User',
    key: 'user_id'
  }
});

User.register('beforeCreate', function(data) {
  var datetime = new Date();
  data.created_at = data.updated_at = data;
});
//  Support Promise
User.register('afterCreate', function(newId) {
  newId = newId[0];
  return Entry.create({ title: 'create new user ' + newId });
});

// same to knex('users').where(...).update({})
User.where(...).update({...});
User.where(...).delete();

User.first('id', 1).then(function(user) {
  return user.entries.create({
    title: 'title'
  });
}).then(function(insertId) {
  return user.entries.find();
}).then(function(entries) {
  console.log(entries);
  return Promise.props({
    isOk: entries[0].update({ title: 'updated' }),
    deleteId: entries[1].delete()
  });
}).then(function(result) {
  console.log(result);
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
