var express = require('express');
var lib = require('qiyilib');
var Path = require('path');
var fs = require('fs');
var ic = new lib.ic.InfoCenter({
    moduleName: 'core.webserver'
});

var Server = function(options) {
    options = options || {};
    this.__app = express();
    this.__app.use(express.cookieParser());
    this.__port = options.port || 8080;
    this.__routeMaps = {};
    this.__host = options.__host;
};

Server.prototype.start = function() {
    this.__app.listen(this.__port);
    ic.log('QNS start at ' + this.__port);
};

Server.prototype._set = function(name, value) {
    this.__app.set(name, value);
};
Server.prototype._root = function(path) {
    this.__app.use(express.static(path));
};
/**
 * 必须在module执行init阶段注册route
 * 因为需要记录一条route是哪个模块注册的，并且需要得到模块的相关信息，而又不希望每次执行route的时候，传入module实例
 */
Server.prototype.route = function(routers) {
    var self = this;
    var routeMaps = this.__routeMaps;
    var module = this.__host._getInitingModule();
    if (!module) throw 'no module is initing';
    for (var path in routers) {
        var router = routers[path];
        var method = router.method || 'get';
        if (!routeMaps[path]) {
            if (!this['__' + method]) throw 'not support method';
            if (!router.callback) {
                (function(router) {
                    router.callback = function(req, res, next) {
                        if (!router.data) {
                            router.data = function(req, callback) {
                                callback({});
                            };
                        }
                        router.data(req, function(data) {
                            self.__app.set('views', Path.join(module.dir, 'views'));
                            self.__app.render(router.view, data, function(err, html) {
                                if (err) {
                                    ic.error(err);
                                }
                                res.send(html);
                            });
                        });
                    };
                })(router)
            }
            this.__routeMaps[path] = {
                method: method,
                module: module,
                path: path,
                callback: router.callback
            };
            this['__' + method](path, router.callback);
        }
    }
};
Server.prototype._unload = function(module) {
    var routers = this.__findRouters(module);
    routers.forEach(function(router) {
        this['__un' + router.method](router.path, router.callback);
        delete this.__routeMaps[router.path];
    }.bind(this));
};
Server.prototype.__findRouters = function(module) {
    var routeMaps = this.__routeMaps;
    var routers = [];
    for (var path in routeMaps) {
        if (routeMaps[path].module === module) {
            routers.push(routeMaps[path]);
        }
    }
    return routers;
};
Server.prototype.__get = function(url, fn) {
    ic.log('get : ' + url);
    this.__app.get(url, fn);
};
Server.prototype.__unget = function(url, fn) {
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
    } else {
        routes.splice(0, routes.length);
    }
};
Server.prototype.__post = function(url, fn) {
    this.__app.post(url, fn);
};
Server.prototype.__unpost = function(url, fn) {
    url = url.toString();
    var routes = this.__app.routes['post'];
    for (var i = 0; i < routes.length; i++) {
        var item = routes[i];
        if (item.path.toString() === url) {
            var callbacks = item.callbacks;
            for (var j = 0; j < callbacks.length; j++) {
                if (callbacks[j] === fn) {
                    callbacks.splice(j, 1);
                    return;
                }
            }
        }
    }
};

var server;

module.exports = {
    init: function(app, config) {
        config = config || {};
        config.__host = app;
        server = new Server(config);
        app._injectMethod(server, ['start', 'route', '_set', '_root']);
        return server;
    },
    unload: function() {

    }
};