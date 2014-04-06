#!/usr/bin/env node

/**
 * This tiny wrapper file checks for known node flags and appends them
 * when found, before invoking the "real" _mocha(1) executable.
 */

var spawn = require('child_process').spawn;
var Config = require('../config');
var Q = require('qiyilib');
var Path = require('path');
var fs = require('fs');
var program = require('commander');
var packageConfig;
try {
  packageConfig = JSON.parse(Q.fs.readFile(Path.join(__dirname, '../package.json')));
} catch (e) {
  packageConfig = {};
}

var config = Config.read();
if (config) {
  try {
    config = JSON.parse(config);
  } catch (e) {
    config = {};
  }
} else {
  config = {};
}
var pidFile = Path.join(__dirname, '../pid');

var start = function(argument) {
  if (!fs.existsSync(pidFile)) {
    var outPath = Path.normalize('/data/logs/napi/access.log');
    var errPath = Path.normalize('/data/logs/napi/error.log');
    var out;
    var err;
    if (fs.existsSync(outPath)) {
      out = fs.openSync(outPath, 'a');
      err = fs.openSync(errPath, 'a');
    } else {
      out = process.stdout;
      err = process.stderr;
    }
    var cp = spawn('node', [Path.join(__dirname, '../run.js')], {
      stdio: ['ignore', out, err]
    });
    Q.fs.writeFile(pidFile, cp.pid);
  }
};
var stop = function() {
  if (fs.existsSync(pidFile)) {
    var pid = Q.fs.readFile(pidFile);
    console.log('kill ' + pid);
    try {
      process.kill(pid);
    } catch (e) {}
    Q.fs.rm(pidFile);
  }
};
var _config = function(add, del) {
  var modules = config.modules;
  if (add) {
    for (var i = 0; i < add.length; i++) {
      var module = add[i];
      if (modules.indexOf(module) === -1) {
        modules.push(module);
      }
    }
  }
  if (del) {
    for (var i = 0; i < del.length; i++) {
      var module = del[i];
      var index = modules.indexOf(module);
      if (index !== -1) {
        modules.splice(index, 1)
      }
    }
  }
  Config.write(JSON.stringify(config));
}

var list = function(val) {
  return val.split(',')
}

//定义参数,以及参数内容的描述  
program
  .version(packageConfig.version)
  .option('-p, --port <number>', 'port')
  .option('-o, --outfile <path>', 'outfile')
  .option('-e, --errfile <path>', 'outfile')
  .option('-a, --add <items>', 'add the modules list', list)
  .option('-d, --delete <items>', 'delete the modules list', list)

program
  .command('start')
  .description('Start server on port')
  .action(function(cmd) {
    start();
  });

program
  .command('stop')
  .description('Stop server')
  .action(function(cmd) {
    stop();
  });

program
  .command('config')
  .description('Lists and set all qns user configuration')
  .action(function(cmd) {
    _config(cmd.parent.add, cmd.parent.delete);
  });

//解析commandline arguments  
program.parse(process.argv)

if (process.platform !== 'win32') {
  process.exit(0);
}