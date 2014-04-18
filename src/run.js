var lib = require('qiyilib');
var cluster = require('cluster');
var numCPUs = require('os').cpus().length;
var nssocket = require('nssocket');
var Config = require('./config');
var config = Config.load();
var Server = require('./server');
var logger = require('log4js').getLogger('core:webserver');

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
running = new Server();
running.start();

var socketServer = nssocket.createServer(function(socket) {
    // socket.data(['config'], function (data) {
    //   console.log(data);
    // });
    // socket.data('start', function(data) {
    //     if (!running) {
    //         console.log(data);
    //     }
    // });
    socket.data('module', function(data) {
        if (data.add) {
            running.loadModule(data.add);
        }
        if (data.del) {
            running.unloadModule(data.del);
        }
    });
    socket.data('stop', function() {
        if (running) {
            running.stop();
        }
        logger.info('Stoped.');
    });
});
socketServer.listen(config.socketPort);
logger.info('Starting...');