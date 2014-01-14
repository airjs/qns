var lib = require('qiyilib');
var Path = require('path');
var fs = require('fs');
var Config = require('./config');
var Server = require('./core/webserver');
var Template = require('./core/template');
var log = require('loglevel');
log.enableAll();
var modulePath = process.env.QNS_PATH || Path.join(__dirname,'qns_modules');

var Container = function(options){
    options = options || {};
    var _this = this;
    if(options.watch){
        Config.watch();
        Config.on('change',function(e){
            var config = e.data.config;
            log.info('Event[config.change]:' + JSON.stringify(e));
            _this.config(config);
        });
    }
    var config = Config.load();
    if(config){
        this.config(config);
    }
    this.__coreModules = {
        server:Server.init(this,options),
        template:Template.init(this,options)
    };
    this.__runningModules = {};
    var modules = options.modules;
    if (modules) {
      modules.forEach(function(Module) {
        this.__initingModule = Module;
        Module.init(this, options);
        this.__initingModule = null;
      }.bind(this));
    }
};

Container.prototype.injectMethod = function(module,names){
    var _this = this;
    names.forEach(function(name){
        _this[name] = function(){
            return module[name].apply(module,arguments);
        };
    });
};

/**
 * 获取正在初始化的模块
 * protected方法，只允许在模块中使用
 * @return {[type]} [description]
 */
Container.prototype._getInitingModule = function(){
    return this.__initingModule;
};

Container.prototype.__clearModuleCache = function(moduleFilePath){
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
                _this.__clearModuleCache(child.id);
            });
        }
        else{
            this.__clearModuleCache(childs.id);
        }
        if(donotClear.indexOf(moduleFilePath) === -1){
            log.info('clear cache : ' + moduleFilePath);
            delete require.cache[moduleFilePath];
        }
    }
};
Container.prototype._watchAllFiles = function(moduleFilePath,watcher){
    log.info('watching file : ' + moduleFilePath);
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
Container.prototype._unwatchAllFiles = function(moduleFilePath,watcher){
    log.info('unwatching file : ' + moduleFilePath);
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
Container.prototype._watchModule = function(moduleName){
    log.info('watching module : ' + moduleName);
    var module = this.__runningModules[moduleName];
    var moduleFilePath = Path.join(modulePath,moduleName,'index.js');
    var _this = this;
    if(!module.__watcher){
        module.__watcher = function(){
            _this.reloadModule(moduleName);
        };
    }
    this._watchAllFiles(moduleFilePath,module.__watcher);
};
Container.prototype._unwatchModule = function(moduleName){
    log.info('unwatch module : ' + moduleName);
    var module = this.__runningModules[moduleName];
    if(module){
        var moduleFilePath = Path.join(modulePath,moduleName,'index.js');
        this._unwatchAllFiles(moduleFilePath,module.__watcher);
    }
};
Container.prototype.reloadModule = function(moduleNames){
    this.unloadModule(moduleNames);
    this.loadModule(moduleNames);
};
Container.prototype.unloadModule = function(moduleNames){
    if(typeof moduleNames === 'string'){
        moduleNames = [moduleNames];
    }
    moduleNames.forEach(function(moduleName){
        log.info('unloading ' + moduleName);
        var moduleFilePath = Path.join(modulePath,moduleName,'index.js');
        var module = this.__runningModules[moduleName];
        if(module){
            module.unload(this);
            for(var name in this.__coreModules){
                //模块可能会在核心模块中注册过，因此模块被卸载时，需要通知核心模块，便于核心模块也做相应的移除处理
                var coreModule = this.__coreModules[name];
                if (coreModule && coreModule._unload) {
                    coreModule._unload(module);
                }
            }
            delete this.__runningModules[moduleName];
        }
        if (this._moduleAutoReload) {
            this._unwatchModule(moduleName);
        }
        this.__clearModuleCache(moduleFilePath);
        log.info('Unload ' + moduleName);
    }.bind(this));
};
Container.prototype.loadModule = function(moduleNames){
    if(typeof moduleNames === 'string'){
        moduleNames = [moduleNames];
    }
    var _this = this;
    for(var moduleName in this.__runningModules){
        if(this.__runningModules.hasOwnProperty(moduleName)){
            var index = moduleNames.indexOf(moduleName);
            if(index !== -1){
                //已经启动过的模块不再重新启动
                moduleNames.splice(index,1);
            }
            else{
                this.unloadModule(moduleName);
            }
        }
    }
    if(moduleNames.length > 0){
        moduleNames.forEach(function(moduleName){
            var moduleFilePath = Path.join(modulePath,moduleName);
            if(lib.fs.isExist(moduleFilePath)){
                log.info('Load ' + moduleName + ' (' + moduleFilePath + ')');
                var Module;
                try{
                    Module = require(moduleFilePath);
                    log.info(moduleName + ' loaded');
                }
                catch(e){
                    log.error(e.stack);
                    return;
                }
                var moduleMethods = ['init','unload'];
                for(var i = 0; i < moduleMethods.length; i++){
                    var methodName = moduleMethods[i];
                    if(!Module[methodName]){
                        log.error('Module [' + moduleName + '] does not implement [' + methodName + ']');
                        return;
                    }
                }
                try{
                    this.__initingModule = Module;
                    Module.init(this);
                    this.__initingModule = null;
                }
                catch(e){
                    log.error(e.stack);
                    this.unloadModule(moduleName);
                    return;
                }
                this.__runningModules[moduleName] = Module;
                if(this._moduleAutoReload){
                    this._watchModule(moduleName);
                }
            }
            else{
                log.error('Module [' + moduleName + '] is not exist in ' + modulePath);
            }
        }.bind(this));
    }
};
Container.prototype.config = function(config){
    if(!config){
        return;
    }
    if(config.log === true){
        lib.log.InfoCenter.enable();
    }
    else{
        // lib.log.InfoCenter.disable();
    }
    this._moduleAutoReload = config.moduleAutoReload;
    if(config.modules){
        try{
            this.loadModule(config.modules);
        }
        catch(e){
            log.error(e.stack);
        }
    }
};



module.exports = Container;