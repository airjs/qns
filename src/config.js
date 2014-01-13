var lib = require('qiyilib');
var Path = require('path');
var fs = require('fs');

var defaultConfig = Path.join(__dirname,'../conf/default.conf');
var currConfig = defaultConfig;

var evt = {};

var Config = {
    load:function(filePath){
        this.apply(filePath);
        return this._load();
    },
    watch:function(){
        if(currConfig){
            fs.unwatchFile(currConfig);
        }
        fs.watchFile(currConfig,this._onchange.bind(this));
    },
    reload:function(){
        return this._load();
    },
    apply:function(filePath){
        if(filePath){
            currConfig = filePath;
        }
        else{
            currConfig = defaultConfig;
        }
    },
    read:function(){
        this.apply();
        return lib.fs.readFile(currConfig);
    },
    write:function(config){
        this.apply();
        lib.fs.writeFile(currConfig,config);
    },
    on:function(type,listener){
        var listeners = evt[type];
        if(!listeners){
            evt[type] = [];
            listeners = evt[type];
        }
        listeners.push(listener);
    },
    fire:function(ev){
        var type = ev.type;
        var data = ev.data;
        var listeners = evt[type];
        if(listeners){
            listeners.forEach(function(listener){
                listener(ev);
            });
        }
    },
    _onchange:function(){
        var _this = this;
        var config = this.reload();
        this.fire({type:'change',data:{config:config}});
    },
    _load:function(){
        var fileContent,config;
        var defaultConfig = {
            socketPort:56789
        };
        try{
            fileContent = lib.fs.readFile(currConfig);
        }
        catch(e){
            return defaultConfig;
        }
        try{
            config = lib.object.extend(defaultConfig,JSON.parse(fileContent));
        }
        catch(e){
            return defaultConfig;
        }
        return config;
    }
};

module.exports = Config;