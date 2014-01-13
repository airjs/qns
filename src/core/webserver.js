var express = require('express');
var lib = require('qiyilib');
var Path = require('path');
var fs = require('fs');
var ic = new lib.ic.InfoCenter({moduleName:'core.webserver'});

var Server = function(options){
    options = options || {};
    this.__app = express();
    this.__app.use(express.cookieParser());
    this.__port = options.port || 8080;
    this.__routeMaps = {};
    this.__host = options.__host;
};

Server.prototype.start = function(){
    this.__app.listen(this.__port);
    ic.log('QNS start at ' + this.__port);
};
Server.prototype.engine = function(ext,callback){
    this.__app.engine(ext,callback);
};
Server.prototype.set = function(name,value){
    this.__app.set(name,value);
};
Server.prototype.render = function(view,options,callback){
    this.__app.render.apply(this.__app,arguments);
};
Server.prototype._route = function(routers){
    var routeMaps = this.__routeMaps;
    var module = this.__host._getInitingModule();
    if(!module) throw 'no module is initing';
    for(var path in routers){
        var router = routers[path];
        var method = router.method || 'get';
        if(!routeMaps[path]){
            if(!this['__' + method]) throw 'not support method';
            this.__routeMaps[path] = {
                method:method,
                module:module,
                path:path,
                callback:router.callback
            };
            this['__' + method](path,router.callback);
        }
    }
};
Server.prototype._unload = function(module){
    var routers = this.__findRouters(module);
    routers.forEach(function(router){
        this['__un' + router.method](router.path,router.callback);
        delete this.__routeMaps[router.path];
    }.bind(this));
};
Server.prototype.__findRouters = function(module){
    var routeMaps = this.__routeMaps;
    var routers = [];
    for(var path in routeMaps){
        if(routeMaps[path].module === module){
            routers.push(routeMaps[path]);
        }
    }
    return routers;
};
Server.prototype.__get = function(url,fn){
    ic.log('get : ' + url);
    this.__app.get(url,fn);
};
Server.prototype.__unget = function(url,fn){
    url = url.toString();
    var routes = this.__app.routes['get'];
    if (fn) {
        for (var i = 0; i < routes.length; i++) {
            var item = routes[i];
            if (item.path.toString() === url) {
                var callbacks = item.callbacks;
                for (var j = 0; j < callbacks.length; j++) {
                    if (callbacks[j] === fn) {
                        ic.log('unget : ' + url);
                        routes.splice(i, 1);
                        return;
                    }
                }
            }
        }
    }
    else{
        routes.splice(0,routes.length);
    }
};
Server.prototype.__post = function(url,fn){
    this.__app.post(url,fn);
};
Server.prototype.__unpost = function(url,fn){
    url = url.toString();
    var routes = this.__app.routes['post'];
    for(var i = 0; i < routes.length; i++){
        var item = routes[i];
        if(item.path.toString() === url){
            var callbacks = item.callbacks;
            for(var j = 0; j < callbacks.length; j++){
                if(callbacks[j] === fn){
                    callbacks.splice(j,1);
                    return;
                }
            }
        }
    }
};

module.exports = {
    init:function(app,config){
        config = config || {};
        config.__host = app;
        var server = new Server(config);
        app.injectMethod(server,['start','engine','set','_route']);
        return server;
    }
};