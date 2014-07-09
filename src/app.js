var koa = require('koa');
var extend = require('node.extend');
var logger = require('log4js').getLogger('core:app');
var nssocket = require('nssocket');
var path = require('path');
var fs = require('fs');
var Config = require('../src/config');
var routing = require('koa-routing');
var views = require('koa-views');
var logs = require('koa-log4js');
var vhost = require('koa-vhost');
var staticServe = require('koa-static');
var session = require('koa-sess');
var redisStore = require('koa-redis');
var body = require('koa-body');

var app = koa();

var Vhost = function(options) {

  this.hostname = options.host;
  this.path = options.path;
  this.modulePath = path.join(this.path, 'modules');
  this.viewPath = path.join(this.path, 'views');
  this.staticPath = path.join(this.path, 'dist');

  this.runningModules = {};

  var app = this.app = koa();
  app.__id = this.hostname;

  //加载中间件,中间件需保证顺序不要变动
  //记录access log
  app.use(logs());

  //模板
  app.use(views(this.viewPath, {
    default: 'jade',
    cache: process.env.NODE_ENV === 'production' ? true : false
  }));

  //parse body
  app.use(body());

  //session
  app.use(session({
    defer: true,
    store: redisStore(),
    cookie: {
      signed: false
    }
  }));

  //routing
  app.use(routing(app, {
    defer: true
  }));
  app.unroute = function(route) {
    route.path = '';
    route.handlers = {};
  };

  //static
  app.use(staticServe(this.staticPath, {
    maxage: 3600 * 24 * 30 * 1000,
    defer: true
  }));

  var vhost = require(this.path);
  vhost.init(this);
};

Vhost.prototype.loadModule = loadModule;
Vhost.prototype.loadSingleModule = loadSingleModule;
Vhost.prototype.unloadModule = unloadModule;
Vhost.prototype.reloadModule = reloadModule;
Vhost.prototype.reload = reload;

var config = Config.load();

//向daemon进程注册
registerToDaemon();

var server = {
  app: app,
  start: start,
  stop: stop,
  reloadVhost: reloadVhost
};

module.exports = server;

//function definations

function start(options) {
  //加载配置文件

  //merge配置
  config = extend(config, options || {});

  //加载vhosts
  var vhosts = [];
  this._vhosts = {};
  if (config.vhosts) {
    for (var name in config.vhosts) {
      var vhostConfig = config.vhosts[name];
      var host = new Vhost(vhostConfig);
      var vapp = host.app;
      vhosts.push({
        host: vhostConfig.host,
        app: vapp
      });
      logger.info('Vhost [' + name + '] is running');
      this._vhosts[name] = host;
    }
  }
  app.use(vhost(vhosts));

  //监听配置事件

  app.listen(config.port);
  logger.info('Server start on : ' + config.port + ' (socket:' + config.socketPort + ')');
}

function stop() {
  logger.info('Server stopped' + ' (socket:' + config.socketPort + ')');
}

function reloadVhost(vhostName) {
  var info = vhostName.split(':');
  vhostName = info[0];
  var moduleName = info[1];
  var vhost = this._vhosts[vhostName];
  vhost.reload(moduleName);
}

/**
 * 向daemon进程注册一个worker
 * @param  {Function} callback function(err,data){}
 * @return {[type]}            [description]
 */
function registerToDaemon() {
  // 用于接收来自daemon的消息的socket，此socket关闭时，daemon会认为该worker已经死掉了
  var socket = new nssocket.NsSocket();
  socket.data('hello', function() {
    socket.send('i am a worker');
  });
  socket.data('accept', function(data) {
    //记录daemon进程分发过来的配置信息
    config = extend(config, data);
    logger.debug('Daemon accept[' + data.socketPort + '].');
    socket.send('worker is running', {
      port: data.socketPort
    });
  });

  //commands
  socket.data('start', function(options) {
    server.start(options);
    socket.send('ok');
  });

  socket.data('stop', function() {
    server.stop();
    socket.send('ok');
  });

  socket.data('config', function(data) {
    logger.debug(data);
  });

  socket.data('module', function(data) {
    logger.debug(data);
    if (data.loadmodule) {
      loadModule(data.loadmodule);
    } else if (data.reloadmodule) {
      reloadModule(data.reloadmodule);
    }
  });

  socket.data('vhost', function(data) {
    if (data.reloadvhost) {
      var name = data.reloadvhost;
      server.reloadVhost(name);
    }
  });

  socket.on('error', function(err) {
    console.error(err);
  });
  socket.connect(56789);
}

function loadModule(names) {
  if (typeof names === 'string') {
    names = [names];
  }
  if (!this.modulePath) {
    logger.error('No modulePath specific');
    return;
  }
  var self = this;
  if (names.length > 0) {
    names.forEach(function(name) {
      var moduleFilePath = path.join(self.modulePath, name);
      if (fs.existsSync(moduleFilePath)) {
        logger.debug('Load ' + name + ' (' + moduleFilePath + ')');
        self.loadSingleModule(name, moduleFilePath);
      } else {
        logger.error('Module [' + name + '] is not exist in ' + self.modulePath);
      }
    });
  }
}

function loadSingleModule(name, moduleFilePath) {
  var Module;
  try {
    Module = require(moduleFilePath);
    Module.dir = moduleFilePath;
  } catch (e) {
    logger.error(e.stack || e.message || e);
    return;
  }
  if (!checkModule(Module, name)) {
    return;
  }
  try {
    Module.init(this.app);
  } catch (e) {
    logger.error(e.stack || e.message || e);
    this.unloadModule(name);
    return;
  }
  this.runningModules[name] = Module;
  logger.debug('Module [' + name + '] loaded.');
}

function unloadModule(names) {
  if (typeof names === 'string') {
    names = [names];
  }
  var self = this;
  names.forEach(function(name) {
    logger.debug('unloading ' + name);
    var moduleFilePath = path.join(self.modulePath, name);
    var module = self.runningModules[name];
    if (module) {
      module.unload(self.app);
      delete self.runningModules[name];
    }
    clearModuleCache(moduleFilePath);
    logger.debug('Unload ' + name);
  });
}

function reloadModule(names) {
  this.unloadModule(names);
  this.loadModule(names);
}

function checkModule(Module, moduleName) {
  var moduleMethods = ['init', 'unload'];
  for (var i = 0; i < moduleMethods.length; i++) {
    var methodName = moduleMethods[i];
    if (!Module[methodName]) {
      logger.error('Module [' + moduleName + '] does not implement [' + methodName + ']');
      return false;
    }
  }
  return true;
}

function clearModuleCache(filePath) {
  if (path.extname(filePath) !== '.js') {
    filePath = path.join(filePath, 'index.js');
  }
  var moduleCache = require.cache[filePath];
  logger.debug('clearing cache : ' + filePath);
  if (moduleCache) {
    var childs = moduleCache.children;
    if (Array.isArray(childs)) {
      childs.forEach(function(child) {
        clearModuleCache(child.id);
      });
    } else {
      clearModuleCache(childs.id);
    }
    logger.debug('cleared cache : ' + filePath);
    delete require.cache[filePath];
  }
}

function reload(moduleName) {
  if (moduleName) {
    if (this.runningModules[moduleName]) {
      this.reloadModule(moduleName);
    } else {
      logger.debug('Module [' + moduleName + '] is not running.');
    }
  } else {
    var names = Object.keys(this.runningModules);
    this.unloadModule(names);
    clearModuleCache(this.path);
    var vhost = require(this.path);
    vhost.init(this);
  }
}