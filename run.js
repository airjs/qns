var lib = require('qiyilib');
var cluster = require('cluster');
var numCPUs = require('os').cpus().length;
var ic = new lib.ic.InfoCenter({moduleName:'qns'});

var Server = require('./server');

if (cluster.isMaster) {
    var num = numCPUs;
    if(process.platform === 'win32'){
        num = 1;
    }
    for(var i = 0; i < num; i++){
        var worker = cluster.fork();
    }

    cluster.on('exit', function(worker, code, signal) {
        ic.log('worker ' + worker.process.pid + ' died');
        cluster.fork();
    });
} else {
    var server = new Server();
    server.start();
}