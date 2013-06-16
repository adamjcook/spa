/*jslint         node    : true, continue : true,
  devel  : true, indent  : 2,    maxerr   : 50,
  newcap : true, nomen   : true, plusplus : true,
  regexp : true, sloppy  : true, vars     : false,
  white  : true
*/

/*global require, process, module */

'use strict';

var mongodb = require('mongodb');
var mongoserver = new mongodb.Server('127.0.0.1', 
  mongodb.Connection.DEFAULT_PORT);
var db = new mongodb.Db('spa', mongoserver, {w: 1});
var ObjectID    = mongodb.ObjectID;
var fs = require('fs');
var jsv = require('JSV').JSV.createEnvironment();
var cache = require('./cache.js');
var schemaMap   = { 'users': {} };
var checkSchema;
var loadSchema;
var schemaPath;
var schemaName;
var crud;

db.open(function() {
  var set_all_users_as_offline = function() {
    crud.update(
      'users',
      {is_online: true},
      {is_online: false},
      function() { }
    );
  };
  
  console.log('Connected to Mongo.');
  set_all_users_as_offline();
});

loadSchema = function(err, data) {
  schemaMap[schemaName] = JSON.parse(data);
};

for (schemaName in schemaMap) {
  if (schemaMap.hasOwnProperty(schemaName)) {
    schemaPath = __dirname.replace('/lib', '/') + schemaName + '.json';
    fs.readFile(schemaPath, 'utf8', loadSchema);
  }
};

checkSchema = function(object, schema, callback) {
  var report = jsv.validate(object, schema);
  var pass_validation = (report.errors.length === 0);
  callback(pass_validation);
};

crud = {
  // construct === create. create is a root Object method in js.
  'construct': function(object_type, object_map, callback) {
    checkSchema(
      object_map,
      schemaMap[object_type],
      function(pass_validation) {
        var obj_map = object_map;
        if (pass_validation) {
          db.collection(object_type, function(err, collection) {
            var options_map = {safe: true};
            collection.insert(
              obj_map,
              options_map,
              function(err, result) {
                callback(result);
              });
          });
        }
        else {
          console.error('Did not pass validation.\n');
        }
      }
    );
  },
  
  'read': function(object_type, find_map, fields_map, callback) {
    var cache_key = find_map;
    
    cache.get(cache_key, callback, function() {
      db.collection(object_type, function(err, collection) {
        collection.find(find_map, fields_map).toArray(
          function(err, result) {
            cache.set(cache_key, result);
            callback(result);
          });
      });
    });
  },
  
  'update': function(object_type, find_map, object_map, callback) {
    checkSchema(
      object_map,
      schemaMap[object_type],
      function(pass_validation) {
        if (pass_validation) {
          db.collection(object_type, function(err, collection) {
            collection.update(
              find_map,
              {$set: object_map},
              {safe: true, multi: true, upsert: false},
              function(err, result) {
                callback(result);
              });
          });
        }
        else {
          console.error('Did not pass validation.\n');
        }
      });
  },
  
  // destroy === delete. delete is a reserved word in js.
  'destroy': function(object_type, find_map, callback) {
    db.collection(object_type, function(err, collection) {
      var options_map = {safe: true, single: true};
      collection.remove(
        find_map,
        options_map, 
        function(err, result) {
          callback(result);
        }
      );
    });
  },
  
  schema_map: schemaMap,
  ObjectId: ObjectID
};

module.exports = crud;