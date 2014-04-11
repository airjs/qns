var mongoose = require('mongoose');
var log = require('loglevel');
var assert = require('assert');
var async = require('async');

var DB = function(options){
    options = options || {};
    this.__models = {};
    this.__model = null;
};

DB.prototype.db = function(){
    return this;
};

DB.prototype.connect = function(connectStr,callback){
    mongoose.connect(connectStr,callback);
};

DB.prototype.model = function(name,schema){
    if(this.__models[name]){
        return this.__models[name];
    }
    return this.__models[name] = new Model(name,schema);
};

DB.prototype.use = function(name){
    if(!this.__models.hasOwnProperty(name)){
        log.info('No model named :' + name);
        return;
    }
    return this.__model = this.__models[name];
};

DB.prototype.disconnect = function(name){
    mongoose.disconnect();
};

var Model = function(name,schema){
    this.__model = mongoose.model(name,schema);
    this.__queue = [];
};

Model.prototype.add = function(item,callback){
    var model = new this.__model(item);
    if(callback){
        model.save(callback);
    }
    else{
        this.__queue.push({
            action:'add',
            data:model
        });
    }
};

Model.prototype.update = function(condition,update,options,callback){
    var args = Array.prototype.slice.call(arguments,0);
    var hasCallback = args.some(function(arg){
        if(typeof arg === 'function'){
            return true;
        }
    });
    if(hasCallback){
        this.__model.update.apply(this.__model,arguments);
    }
    else{
        this.__queue.push({
            action:'update',
            data:args
        });
    }
};

Model.prototype.remove = function(condition,callback){
    if(arguments.length === 1 && typeof arguments[0] === 'function'){
        callback = condition;
    }
    if(callback){
        this.__model.remove(condition,callback);
    }
    else{
        this.__queue.push({
            action:'remove',
            data:condition
        });
    }
};

Model.prototype.find = function(condition,callback){
    this.__model.find(condition,callback);
};

Model.prototype.save = function(callback){
    var len = this.__queue.length;
    var tasks = [];
    while(len){
        tasks.push(function(cb){
            var item = this.__queue.pop();
            switch(item.action){
                case 'add':
                    item.data.save(cb);
                    break
                case 'remove':
                    this.__model.remove(item.data,cb);
                    break;
                case 'update':
                    item.data.push(cb);
                    this.__model.update.apply(this.__model,item.data);
                    break;
            }
        }.bind(this));
        len--;
    }
    // console.time('save');
    async.parallel(tasks,function(err){
    // async.series(tasks,function(err){
        // console.timeEnd('save');
        if(callback){
            callback(err);
        }
    })
};

module.exports = {
    init:function(app,config){
        config = config || {};
        config.__host = app;
        var db = new DB(config);
        app.injectMethod(db,['db']);
        return db;
    }
};