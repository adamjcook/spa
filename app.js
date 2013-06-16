/**
 * Module dependencies.
 */

var express = require('express');
var app = express();
var http = require('http');
var server = http.createServer(app).listen(3000);
var routes  = require('./routes.js')(app, server);

//Configuration
app.configure(function () {
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  // Ordering of below app.use statements are important
  app.use(express.static( __dirname + '/public'));
  app.use(app.router);
});

app.configure('development', function() {
  app.use(express.errorHandler({dumpExceptions: true, showStack: true })); 
});

app.configure('production', function() {
  app.use(express.errorHandler()); 
});

routes.set();
console.log("Express server listening on port %d in %s mode", server.address().port, app.settings.env);