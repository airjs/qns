var express = require('express');
var lib = require('qiyilib');
var Path = require('path');
var fs = require('fs');
var ic = new lib.ic.InfoCenter({moduleName:'core.http'});
lib.ic.InfoCenter.enable();

var modulePath = process.env.QNS_PATH || Path.join(__dirname,'qns_modules');

var runningModules = {};

var Server = function(options){
    options = options || {};
    this._app = express();
    this._app.use(express.cookieParser());
    this._port = options.port || 8080;
};

Server.prototype.start = function(){
    this._app.listen(this._port);
    ic.log('QNS start at ' + this._port);
};
Server.prototype.get = function(url,fn){
    ic.log('get : ' + url);
    this._app.get(url,fn);
};
Server.prototype.unget = function(url,fn){
    url = url.toString();
    var routes = this._app.routes['get'];
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
Server.prototype.post = function(url,fn){
    this._app.post(url,fn);
};
Server.prototype.unpost = function(url,fn){
    url = url.toString();
    var routes = this._app.routes['post'];
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
        var server = new Server(config);
        //导出公共方法
        var methods = ['get','unget','post','unpost'];
        methods.forEach(function(methodName){
          app[methodName] = function(){
            return model[methodName].apply(model,arguments);
          }
        });
        return model;
    }
};