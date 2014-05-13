var koa = require('koa');
var extend = require('node.extend');

var app = koa();

extend(app, {
  loadModule: function() {

  }
});

module.exports = app;