#!/usr/bin/env node

/**
 * This tiny wrapper file checks for known node flags and appends them
 * when found, before invoking the "real" _mocha(1) executable.
 */

var forever = require('forever');
var Config = require('../src/config');
var Path = require('path');
var fs = require('fs');
var program = require('commander');
var nssocket = require('nssocket');
var packageConfig;
var exec = require('child_process').exec;
var spawn = require('child_process').spawn;
var logger = require('log4js').getLogger('core:webserver');
// var npm = require('npm');
try {
  packageConfig = JSON.parse(fs.readFileSync(Path.join(__dirname, '../package.json')));
} catch (e) {
  packageConfig = {};
}

var runScriptPath = Path.join(__dirname, '../src/run.js');

var mkdir = function(dir) {
  if (!fs.existsSync(dir)) {
    var parent = Path.dirname(dir);
    if (!fs.existsSync(parent)) {
      mkdir(parent);
    }
    fs.mkdirSync(dir);
  }
};

var qnsPath = Path.join(process.env.HOME, '.qns');

if (!fs.existsSync(qnsPath)) {
  mkdir(qnsPath);
  var child = spawn('cp', [Path.join(__dirname, '../conf/default.conf'), qnsPath]);
  child.on('exit', function() {
    program.parse(process.argv);
  });
  child.on('error', function(e) {
    logger.error(e);
  });
}

var start = function(opts) {
  opts = opts || {};
  forever.list(false, function(err, processes) {
    if (!processes) {
      if (opts.configFile) {
        Config.apply(opts.configFile);
      }
      var config = Config.load();
      var outPath = Path.normalize(config.logPath ? Path.join(process.env.HOME, '.qns', config.logPath) : Path.join(__dirname, '../logs/qns.log'));
      var options = {};

      mkdir(Path.dirname(outPath));

      options.logFile = outPath;

      var monitor = forever.startDaemon(runScriptPath, options);
      (function trySend() {
        sendCommand('start', opts, function(err) {
          if (err) {
            // console.log(err);
            setTimeout(trySend, 500);
          }
        });
      })();
    }
  });
};
var stop = function(callback) {
  forever.list(false, function(err, processes) {
    if (processes) {
      var ev = forever.stop(runScriptPath);
      if (callback) {
        ev.on('stop', function() {
          setTimeout(callback, 100);
        });
      }
    } else {
      if (callback) callback();
    }
  });
};
var reload = function() {
  forever.list(false, function(err, processes) {
    if (processes) {
      sendCommand('reload');
    }
  });
};
var status = function() {
  forever.list(true, function(err, processes) {
    if (processes) {
      forever.log.info('Qns is running');
    } else {
      forever.log.info('Qns is down.');
    }
  });
};
var install = function(modules, opts) {
  modules = modules.split(',');

};
var sendCommand = function(action, cmd, callback) {
  var socket = new nssocket.NsSocket();
  var config = Config.load();
  socket.on('end', function() {
    if (callback) callback();
  });
  socket.on('error', function(err) {
    if (callback) callback(err);
  });
  socket.connect(config.socketPort);
  socket.send(action, cmd);
  socket.end();
};
var _config = function(cmd) {
  forever.list(false, function(err, processes) {
    if (processes) {
      sendCommand('config', cmd);
    }
  });
};

var list = function(val) {
  return val.split(',')
}

var options = {
  // port: {
  //   action: 'start',
  //   short: 'p',
  //   type: 'number',
  //   des: 'port'
  // },
  modulePath: {
    action: 'config',
    short: 'm',
    type: 'path',
    des: 'module file path'
  },
  outfile: {
    action: 'config',
    short: 'o',
    type: 'path',
    des: 'outfile'
  },
  edit: {
    action: 'config',
    short: 'e',
    des: 'edit config file'
  },
  add: {
    action: 'module',
    short: 'a',
    type: 'items',
    des: 'add modules',
    fn: list
  },
  del: {
    action: 'module',
    short: 'd',
    type: 'items',
    des: 'delete modules',
    fn: list
  },
  root: {
    action: 'config',
    short: 'r',
    type: 'path',
    des: 'static root'
  },
  new: {
    short: 'n',
    action: 'module',
    type: 'string',
    des: 'create a new module in module path'
  }
  // configFile: {
  //   action: 'start',
  //   short: 'c',
  //   type: 'path',
  //   des: 'config file path'
  // }
};

var getOptions = function(cmd, action) {
  var opts = {};
  // console.log(cmd);
  for (var key in cmd) {
    if (options.hasOwnProperty(key)) {
      var actions = options[key].action.split(',');
      if (actions.indexOf(action) !== -1) {
        opts[key] = cmd[key];
      }
    }
  }
  return opts;
}

//定义参数,以及参数内容的描述  
program
  .version(packageConfig.version);

for (var name in options) {
  var option = options[name];
  program.option('-' + option.short + ', --' + name + (option.type ? ' <' + option.type + '>' : ''), option.des + ' ' + (option.action ? '<' + option.action + '> ' : ''), option.fn);
}

var startOpt = null;

program
  .command('start')
  .description('Start server on port')
  .action(function(cmd) {
    var opts = getOptions(cmd.parent, 'start');
    startOpt = opts;
    // console.log(opts);
    start(startOpt);
  });

program
  .command('stop')
  .description('Stop server')
  .action(function(cmd) {
    sendCommand('stop');
    stop();
  });

program
  .command('module')
  .description('load/unload modules')
  .action(function(cmd) {
    var opts = getOptions(cmd.parent, 'module');
    if (opts.new) {
      var moduleName = opts.new;
      var config = Config.load();
      var modulePath = Path.join(config.root, 'modules', moduleName);
      mkdir(modulePath);
      var files = {};
      files[Path.join(modulePath, 'package.json')] = '{"name":"' + moduleName + '","js":"index.js","stylesheet":"index.styl","template":"index.jade"}';
      files[Path.join(modulePath, 'index.js')] = 'define(["./view"],function(View){var view = new View({el: $(\'[data-module="' + moduleName + '"]\')});});';
      files[Path.join(modulePath, 'model.js')] = 'define(["js/models/base"],function(Base){var Model = Base.extend({});return Model;});';
      files[Path.join(modulePath, 'view.js')] = 'define(["js/views/base"],function(Base){var View = Base.extend({});return View;});';
      files[Path.join(modulePath, 'collection.js')] = 'define(["js/collections/base","./model"],function(Base,Model){var Colletion = Base.extend({model:Model});return Colletion;});';
      files[Path.join(modulePath, 'index.styl')] = '.' + moduleName.replace(/[A-Z]/g, function(s, i) {
        return (i > 0 ? '-' : '') + s.toLowerCase();
      }) + '\n  display:block';
      files[Path.join(modulePath, 'index.jade')] = 'div.' + moduleName.replace(/[A-Z]/g, function(s, i) {
        return (i > 0 ? '-' : '') + s.toLowerCase();
      }) + '(data-module="' + moduleName + '")';
      for (var filepath in files) {
        if (files.hasOwnProperty(filepath) && !fs.existsSync(filepath)) {
          fs.writeFileSync(filepath, files[filepath]);
        }
      }
    } else {
      sendCommand('module', opts);
    }
  });

program
  .command('restart')
  .description('Restart server')
  .action(function(cmd) {
    stop(function() {
      start(startOpt);
    });
  });

program
  .command('status')
  .description('Display status')
  .action(function(cmd) {
    status();
  });

program
  .command('install')
  .description('install a module')
  .action(function(modules, cmd) {
    if (arguments.length === 1) {
      cmd = modules;
      modules = '';
    }
    var opts = getOptions(cmd.parent, 'install');
    install(modules, opts);
  });

program
  .command('config')
  .description('Lists and set all qns user configuration')
  .action(function(cmd) {
    var opts = getOptions(cmd.parent, 'config');
    if (opts.edit) {
      Config.edit();
    } else {
      Config.save(opts);
    }
  });