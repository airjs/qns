#!/usr/bin/env node --harmony

/**
 * This tiny wrapper file checks for known node flags and appends them
 * when found, before invoking the "real" _mocha(1) executable.
 */

var Config = require('../src/config');
var path = require('path');
var fs = require('fs');
var program = require('commander');
var nssocket = require('nssocket');
var packageConfig;
var exec = require('child_process').exec;
var spawn = require('child_process').spawn;
var logger = require('log4js').getLogger('core:bin');
var os = require('os');

try {
  packageConfig = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json')));
} catch (e) {
  packageConfig = {};
}

var runScriptPath = path.join(__dirname, '../src/run.js');

var mkdir = function(dir) {
  if (!fs.existsSync(dir)) {
    var parent = path.dirname(dir);
    if (!fs.existsSync(parent)) {
      mkdir(parent);
    }
    fs.mkdirSync(dir);
  }
};

var qnsPath = path.join(process.env.HOME, '.qns');

var check = function(pname, callback) {
  var child = spawn('pm2', ['jlist']);
  var json = '';
  child.stdout.on('data', function(data) {
    json += data;
  });
  child.on('exit', function() {
    json = json.match(/\[.*\]/) || '[]';
    var processes = JSON.parse(json);
    if (processes) {
      callback(processes.some(function(item) {
        return (item.name === pname && item.pm2_env.status === 'online');
      }));
    } else {
      return false;
    }
  });
};

var cpus = os.cpus();

var socketPort = 56789;

var startDaemon = function(callback) {
  var child = spawn('pm2', ['start', './src/daemon.js', '--name', 'daemon'], {
    cwd: path.join(__dirname, '../')
  });
  var err = '';
  child.stdout.on('data', function(data) {
    logger.debug(data.toString());
  });
  child.stderr.on('data', function(data) {
    err += data;
  });
  child.on('error', function(err) {
    logger.error(err);
    callback(err);
  });
  child.on('exit', function() {
    callback(err);
  });
};

var start = function(opts) {
  if (opts.daemon) {
    check('daemon', function(exist) {
      if (!exist) {
        startDaemon(function(err) {
          if (!err) {
            var child = spawn('pm2', ['start', './src/app.js', '--name', 'app', '-i', cpus.length], {
              cwd: path.join(__dirname, '../')
            });
            child.stdout.on('data', function(data) {
              logger.debug(data.toString());
            });
            child.stderr.on('data', function(data) {
              logger.error(data.toString());
            });
            child.on('error', function(err) {
              logger.error(err);
            });
            child.on('exit', function() {
              process.exit(0);
            });
          }
        });
      } else {
        logger.debug('Already running.');
      }
    });
  } else {
    var app = require('../src/app');
    app.start(opts);
  }
};

var stop = function(callback) {
  check('daemon', function(exist) {
    logger.debug('Check daemon for stop.');
    if (exist) {
      sendCommand({
        action: 'stop',
        port: socketPort
      }, function(err) {
        if (!err) {
          exec('pm2 stop app', function(err, stdout, stderr) {
            err = err || stderr;
            if (err) {
              logger.error(err)
            }
            var pm2 = path.join(__dirname, '../node_modules/pm2/bin/pm2');
            // console.log(pm2)
            // CLI.stopProcessName('app')
            exec('node ' + pm2 + ' stop daemon', function(err, stdout, stderr) {
              err = err || stderr;
              if (err) {
                logger.error(err)
              }
              logger.debug(stdout);
              if (callback) {
                callback(err);
              }
            });
          });
        } else {
          logger.error(err)
          if (callback) {
            callback(err);
          }
        }
      });
    } else {
      logger.debug('No qns is running.');
      if (callback) {
        callback();
      }
    }
  });
};

var reload = function(callback) {
  check('daemon', function(exist) {
    logger.debug('Check daemon for restart.');
    if (exist) {
      exec('pm2 restart app', function(err, stdout, stderr) {
        err = err || stderr;
        if (err) {
          logger.error(err)
        }
        logger.debug(stdout);
        if (callback) {
          callback(err);
        }
      });
    } else {
      logger.debug('No qns is running.');
      if (callback) {
        callback();
      }
    }
  });
};

var restart = function(callback) {
  check('daemon', function(exist) {
    logger.debug('Check daemon for restart.');
    if (exist) {
      exec('pm2 restart daemon', function(err, stdout, stderr) {
        err = err || stderr;
        if (err) {
          logger.error(err);
          if (callback) {
            callback(err);
          }
        } else {
          exec('pm2 restart app', function(err, stdout, stderr) {
            err = err || stderr;
            if (err) {
              logger.error(err)
            }
            logger.debug(stdout);
            if (callback) {
              callback(err);
            }
          });
        }
      });
    } else {
      logger.debug('No qns is running.');
      if (callback) {
        callback();
      }
    }
  });
};

var sendCommand = function(options, callback) {
  var action = options.action;
  var port = options.port;
  var data = options.data;
  var socket = new nssocket.NsSocket();
  socket.data('hello', function() {
    logger.debug('Sending command [' + action + '] to daemon.');
    socket.send('command', {
      action: action,
      data: data
    });
  });
  socket.data('command done', function() {
    if (callback) callback();
    socket.end();
  });
  socket.on('error', function(err) {
    if (callback) callback(err);
  });
  socket.connect(port);
};

var config = function(data) {
  sendCommand({
    action: 'config',
    port: socketPort,
    data: data
  });
};

var list = function(val) {
  return val.split(',')
}

var options = {
  daemon: {
    action: 'start',
    short: 'd',
    des: 'daemon'
  },
  modulePath: {
    action: 'config',
    short: 'm',
    type: 'path',
    des: 'module file path'
  },
  edit: {
    action: 'config',
    short: 'e',
    des: 'edit config file'
  },
  reloadvhost: {
    action: 'vhost',
    short: 'r',
    type: 'string',
    des: 'reload modules'
  },
  new: {
    short: 'n',
    action: 'module',
    type: 'string',
    des: 'create a new module in module path'
  }
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
    stop(function(err) {
      process.exit(0);
    });
  });

program
  .command('module')
  .description('load/unload modules')
  .action(function(cmd) {
    var opts = getOptions(cmd.parent, 'module');
    sendCommand({
      action: 'module',
      port: socketPort,
      data: opts
    });
  });

program
  .command('vhost')
  .description('vhost')
  .action(function(cmd) {
    var opts = getOptions(cmd.parent, 'vhost');
    sendCommand({
      action: 'vhost',
      port: socketPort,
      data: opts
    });
  });

program
  .command('reload')
  .description('Restart server')
  .action(function(cmd) {
    reload(function() {
      process.exit(0);
    });
  });

program
  .command('restart')
  .description('Restart server')
  .action(function(cmd) {
    restart(function() {
      process.exit(0);
    });
  });

program
  .command('status')
  .description('Display status')
  .action(function(cmd) {
    exec('pm2 list', function(err, stdout, stderr) {
      logger.info(stdout);
    });
  });

program
  .command('config')
  .description('Lists and set all qns user configuration')
  .action(function(cmd) {
    var opts = getOptions(cmd.parent, 'config');
    config(opts);
  });

if (!fs.existsSync(qnsPath)) {
  mkdir(qnsPath);
  var child = spawn('cp', [path.join(__dirname, '../conf/default.conf'), qnsPath]);
  child.on('exit', function() {
    program.parse(process.argv);
  });
  child.on('error', function(e) {
    logger.error(e);
  });
} else {
  program.parse(process.argv);
}
