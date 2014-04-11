var lib = require('qiyilib');
var cluster = require('cluster');
var numCPUs = require('os').cpus().length;
var ic = new lib.ic.InfoCenter({
    moduleName: 'qns'
});
var nssocket = require('nssocket');
var Config = require('./config');
var config = Config.load();
var Server = require('./server');
lib.ic.InfoCenter.enable();

// if (cluster.isMaster) {
//     var num = numCPUs;
//     if(process.platform === 'win32'){
//         num = 1;
//     }
//     for(var i = 0; i < num; i++){
//         var worker = cluster.fork();
//     }

//     cluster.on('exit', function(worker, code, signal) {
//         ic.log('worker ' + worker.process.pid + ' died');
//         cluster.fork();
//     });
// } else {

// }

var running = null;

var socketServer = nssocket.createServer(function(socket) {
    // socket.data(['config'], function (data) {
    //   console.log(data);
    // });
    socket.data('start', function(data) {
        if (!running) {
            running = new Server(data);
            running.start();
        }
    });
    socket.data('config', function(data) {
        running.config(data);
    });
    socket.data('reload', function() {
        running.reload();
    });
});
socketServer.listen(config.socketPort);
ic.log('Starting...');