var express = require('express');
var lib = require('qiyilib');
var Path = require('path');
var fs = require('fs');
var Config = require('./config');
var ic = new lib.ic.InfoCenter({moduleName:'server'});

var modulePath = process.env.QNS_PATH;

var runningModules = {};

var Server = function(){
    this._app = express();
    this._app.use(express.cookieParser());
    this._port = 8080;
    var _this = this;
    Config.on('change',function(e){
        var config = e.data.config;
        ic.log('Event[config.change]:' + JSON.stringify(e));
        _this.config(config);
    });
    var config = Config.load();
    if(config){
        this.config(config);
    }
};

Server.prototype.start = function(){
    this._app.listen(this._port);
    ic.log('Qiyi node server start at ' + this._port);
};
Server.prototype.get = function(url,fn){
    this._app.get(url,fn);
};
Server.prototype.unget = function(url,fn){
    url = url.toString();
    var routes = this._app.routes['get'];
    for(var i = 0; i < routes.length; i++){
        var item = routes[i];
        if(item.path.toString() === url){
            var callbacks = item.callbacks;
            for(var j = 0; j < callbacks.length; j++){
                if(callbacks[j] === fn){
                    ic.log('unget : ' + url);
                    routes.splice(i,1);
                    return;
                }
            }
        }
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
Server.prototype._clearModuleCache = function(moduleFilePath){
    var _this = this;
    /**
     * cache模块加入不自动清缓存列表。
     * 这样可以实现模块重启，但是缓存数据不丢失。
     * 如果要更新cache模块，则必须重启服务
     */
    var donotClear = [
        Path.join(__dirname,'cache.js')
    ];
    var moduleCache = require.cache[moduleFilePath];
    if(moduleCache){
        var childs = moduleCache.children;
        if(lib.array.isArray(childs)){
            childs.forEach(function(child){
                _this._clearModuleCache(child.id);
            });
        }
        else{
            this._clearModuleCache(childs.id);
        }
        if(donotClear.indexOf(moduleFilePath) === -1){
            ic.log('clear cache : ' + moduleFilePath);
            delete require.cache[moduleFilePath];
        }
    }
};
Server.prototype._watchAllFiles = function(moduleFilePath,watcher){
    ic.log('watching file : ' + moduleFilePath);
    var _this = this;
    fs.watchFile(moduleFilePath,watcher);
    var moduleCache = require.cache[moduleFilePath];
    if(moduleCache){
        var childs = moduleCache.children;
        if(lib.array.isArray(childs)){
            childs.forEach(function(child){
                _this._watchAllFiles(child.id,watcher);
            });
        }
        else{

            this._watchAllFiles(childs.id,watcher);
        }
    }
};
Server.prototype._unwatchAllFiles = function(moduleFilePath,watcher){
    ic.log('unwatching file : ' + moduleFilePath);
    var _this = this;
    fs.unwatchFile(moduleFilePath,watcher);
    var moduleCache = require.cache[moduleFilePath];
    if(moduleCache){
        var childs = moduleCache.children;
        if(lib.array.isArray(childs)){
            childs.forEach(function(child){
                _this._unwatchAllFiles(child.id,watcher);
            });
        }
        else{

            this._unwatchAllFiles(childs.id,watcher);
        }
    }
};
Server.prototype._watchModule = function(moduleName){
    ic.log('watching module : ' + moduleName);
    var module = runningModules[moduleName];
    var moduleFilePath = Path.join(modulePath,moduleName,'index.js');
    var _this = this;
    if(!module.__watcher){
        module.__watcher = function(){
            _this._reloadModule(moduleName);
        };
    }
    this._watchAllFiles(moduleFilePath,module.__watcher);
};
Server.prototype._unwatchModule = function(moduleName){
    ic.log('unwatch module : ' + moduleName);
    var module = runningModules[moduleName];
    if(module){
        var moduleFilePath = Path.join(modulePath,moduleName,'index.js');
        this._unwatchAllFiles(moduleFilePath,module.__watcher);
    }
};
Server.prototype._unloadModule = function(moduleName){
    ic.log('unloading ' + moduleName);
    var moduleFilePath = Path.join(modulePath,moduleName,'index.js');
    runningModules[moduleName].unload(this);
    this._unwatchModule(moduleName);
    this._clearModuleCache(moduleFilePath);
    delete runningModules[moduleName];
    ic.log('Unload ' + moduleName);
};
Server.prototype._reloadModule = function(moduleName){
    ic.log('Reloading ' + moduleName);
    var moduleFilePath = Path.join(modulePath,moduleName,'index.js');
    runningModules[moduleName].unload(this);
    this._clearModuleCache(moduleFilePath);
    if(lib.fs.isExist(moduleFilePath)){
        var module;
        try{
            module = require(Path.join(modulePath,moduleName));
        }
        catch(e){
            ic.error(e);
            return;
        }
        try{
            module.init(this);
        }
        catch(e){
            this._unloadModule(moduleName);
            ic.error(e);
            return;
        }
        runningModules[moduleName] = module;
        ic.log('Reload ' + moduleName);
    }
};
Server.prototype.loadModule = function(modules){
    var _this = this;
    for(var moduleName in runningModules){
        if(runningModules.hasOwnProperty(moduleName)){
            var index = modules.indexOf(moduleName);
            if(index !== -1){
                //修改配置文件不重启模块
                // this._reloadModule(moduleName);
                modules.splice(index,1);
            }
            else{
                this._unloadModule(moduleName);
            }
        }
    }
    if(modules.length > 0){
        modules.forEach(function(moduleName){
            var moduleFilePath = Path.join(modulePath,moduleName);
            if(lib.fs.isExist(moduleFilePath)){
                ic.log('Load ' + moduleName + ' (' + moduleFilePath + ')');
                var module;
                try{
                    module = require(moduleFilePath);
                    ic.log(moduleName + ' loaded');
                }
                catch(e){
                    ic.error(e);
                    return;
                }
                var moduleMethods = ['init','unload'];
                for(var i = 0; i < moduleMethods.length; i++){
                    var methodName = moduleMethods[i];
                    if(!module[methodName]){
                        ic.error('Module [' + moduleName + '] does not implement [' + methodName + ']');
                        return;
                    }
                }
                try{
                    module.init(_this);
                }
                catch(e){
                    _this._unloadModule(moduleName);
                    ic.error(e);
                    return;
                }
                runningModules[moduleName] = module;
                if(_this._moduleAutoReload){
                    _this._watchModule(moduleName);
                }
            }
            else{
                ic.error('Module [' + moduleName + '] is not exist.');
            }
        });
    }
};
Server.prototype.config = function(config){
    if(!config){
        return;
    }
    if(config.log === true){
        lib.ic.InfoCenter.enable();
    }
    else{
        lib.ic.InfoCenter.disable();
    }
    this._moduleAutoReload = config.moduleAutoReload;
    if(config.modules){
        try{
            this.loadModule(config.modules);
        }
        catch(e){
            ic.error('Load modules err : ' + e);
        }
    }
};

module.exports = Server;