# norel 
A Nodejs object relation manager

It is built atop the [Knex Query Builder](http://knexjs.org/) and 
borrow a lot from [knex-model](https://github.com/wcp1231/knex-model)

## Example

```js
var Model = require('norel')(knex);
var Promise = require('bluebird');

var User = Model.define('User', {
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

var Entry = Model.define('Entry', {
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

## TODO

- [x] test
- [x] example
- [x] Relation `through`
- [x] Realtion `hasOne`
- [ ] boardcast event
  - [x] `beforeCreate`
  - [x] `afterCreate`
  - [x] `beforeUpdate`
  - [x] `afterCreate`
  - [ ] `beforeFind`
  - [ ] `afterFind`
  - [ ] `afterFindOne`
