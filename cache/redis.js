var redis = require('redis');
var lib = require('qiyilib');
var config = require('../config').load().redis || {};

var ic = new lib.ic.InfoCenter({moduleName:'redis'});

var options = {
    detect_buffers: true
};
var client = redis.createClient(config.port, config.host, options);

client
    .on('ready', function() {
        ic.log('client ready.');
    })
    .on('error', function(error) {
        ic.log('client error.', error);
    })
    .on('end', function() {
        ic.log('client end.');
    });

var set = function(name, value, expires, callback){
    if(!callback && typeof expires === 'function'){
        callback = expires;
        expires = null;
    }

    if(!client.ready){
        callback && callback('client not ready yet.')
        return;
    }

    client.set(name, value, function(err, reply){
        if(expires){
            client.send_command('EXPIRE', [name, expires]);
        }
        callback & callback(err, reply);
    });
};

var get = function(name, callback){
    if(!client.ready){
        callback && callback('client not ready yet.')
        return;
    }

    client.get(name, callback);
};

var isAboutToExpired = function(name, callback){
    if(!client.ready){
        callback && callback('client not ready yet.')
        return;
    }

    client.send_command('ttl', [name], function(err, reply){
        if(err){
            callback && callback(err);
            return;
        }
        callback(null, (reply > 0) && (reply < 10));
    });
};

module.exports = {
    get: get,
    set: set,
    isAboutToExpired: isAboutToExpired
};