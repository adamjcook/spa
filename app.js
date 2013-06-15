/**
 * Module dependencies.
 */

var express = require('express');
var app = express();
var routes  = require('./routes.js')(app);

//Configuration
app.configure(function () {
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static( __dirname + '/public'));
});

app.configure('development', function() {
  app.use(express.errorHandler({dumpExceptions: true, showStack: true })); 
});

app.configure('production', function() {
  app.use(express.errorHandler()); 
});

routes.set();

var server = app.listen(3000);
console.log("Express server listening on port %d in %s mode", server.address().port, app.settings.env);