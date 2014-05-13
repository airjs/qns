var os = require('os');
var nssocket = require('nssocket');
var logger = require('log4js').getLogger('core:daemon');

//sockets端口池
var sockets = [];
//用于记录活着的worker
var runnings = [];

var socketPort = 56789;

var cpus = os.cpus();

//创建与cpu core数量一样的端口池，因为会创建同样数量的worker
cpus.forEach(function(cpu, i) {
  sockets.push(socketPort + ++i);
});

process.on('exit', function() {
  logger.info('Daemon exit.');
});

daemon(socketPort);


//function definations

/**
 * daemon socket 用于与worker通信，监控worker状态
 * @param  {[type]} port [description]
 * @return {[type]}      [description]
 */
function daemon(port) {

  var socketServer = nssocket.createServer(function(socket) {

    socket.send('hello');

    //========= messages from worker =========
    socket.data('i am a worker', function() {
      socket.send('accept', {
        socketPort: sockets.pop()
      });
    });
    socket.data('worker is running', function(data) {
      logger.debug('Worker [' + data.port + '] is running.');
      socket.port = data.port;
      runnings[data.port] = socket;
      socket.on('close', function() {
        logger.debug('Worker [' + socket.port + '] died.');
        sockets.push(socket.port);
      });
      socket.send('start');
    });

    //========= messages from cli =========
    socket.data('command', function(cmd) {
      logger.debug('Recieved command [' + cmd.action + '].');
      for (var port in runnings) {
        var worker = runnings[port];
        logger.debug('Try to send stop command to [' + port + ']');
        worker.send(cmd.action, cmd.data);
      }
      socket.send('command done');
    });
  });

  socketServer.listen(port);
}