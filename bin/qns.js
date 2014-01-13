#!/usr/bin/env node

/**
 * This tiny wrapper file checks for known node flags and appends them
 * when found, before invoking the "real" _mocha(1) executable.
 */

var Server = require('../src/server');
var forever = require('forever');
var Config = require('../src/config');
var Path = require('path');
var fs = require('fs');
var program = require('commander');
var nssocket = require('nssocket');
var packageConfig;
try{
  packageConfig = JSON.parse(fs.readFileSync(Path.join(__dirname,'../package.json')));
}
catch(e){
  packageConfig = {};
}

var config = Config.load();

var runScriptPath = Path.join(__dirname, '../src/run.js');

var start = function(opts) {
  forever.list(false, function (err, processes) {
    if (!processes) {
      var outPath = Path.normalize(config.logPath || '/data/logs/qns/access.log');
      var options = {};

      if (fs.existsSync(outPath)) {
        options.logFile = outPath;
      }
      var monitor = forever.startDaemon(runScriptPath,options);
      (function trySend(){
        sendCommand('start',opts,function(err){
          if(err){
            console.log(err);
            setTimeout(trySend,500);
          }
        });
      })();
    }
  });
};
var stop = function() {
  forever.list(false, function (err, processes) {
    if (processes) {
      forever.stop(runScriptPath);
    }
  });
};
var status = function(){
  forever.list(false, function (err, processes) {
    if (processes) {
      forever.log.info('Forever processes running');
      processes.split('\n').forEach(function (line) {
        forever.log.data(line);
      });
    }
    else {
      forever.log.info('Qns is down.');
    }
  });
};
var sendCommand = function(action,cmd,callback){
  var socket = new nssocket.NsSocket();
  socket.on('end',function(){
    callback();
  });
  socket.on('error',function(err){
    callback(err);
  });
  socket.connect(config.socketPort);
  socket.send(action,cmd);
  socket.end();
};
var _config = function(cmd) {
  forever.list(false, function (err, processes) {
    if (processes) {
      sendCommand('config',cmd);
    }
  });
};

var list = function(val) {
  return val.split(',')
}

var options = {
  port:{action:'start',short:'p',type:'number',des:'port'},
  watch:{action:'start',short:'w',des:'watch config file'},
  outfile:{action:'start,config',short:'o',type:'path',des:'outfile'},
  errfile:{action:'start,config',short:'e',type:'path',des:'errfile'},
  add:{action:'config',short:'a',type:'items',des:'add modules',fn:list},
  del:{action:'config',short:'d',type:'items',des:'delete modules',fn:list}
};

var getOptions = function(cmd,action){
  var opts = {};
  for(var key in cmd){
    if(options.hasOwnProperty(key)){
      var actions = options[key].action.split(',');
      if(actions.indexOf(action) !== -1){
        opts[key] = cmd[key];
      }
    }
  }
  return opts;
}

//定义参数,以及参数内容的描述  
program
  .version(packageConfig.version);

for(var name in options){
  var option = options[name];
  program.option('-' + option.short + ', --' + name + (option.type ? ' <' + option.type + '>' : ''), option.des, option.fn);
}

program
  .command('start')
  .description('Start server on port')
  .action(function(cmd) {
    var opts = getOptions(cmd.parent,'start');
    console.log(opts);
    start(opts);
  });

program
  .command('stop')
  .description('Stop server')
  .action(function(cmd) {
    stop();
  });

program
  .command('status')
  .description('Display status')
  .action(function(cmd) {
    status();
  });

program
  .command('config')
  .description('Lists and set all qns user configuration')
  .action(function(cmd) {
    var opts = getOptions(cmd.parent,'config');
    _config(opts);
  });

//解析commandline arguments  
program.parse(process.argv)