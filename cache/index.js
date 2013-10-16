var lib = require('qiyilib');

var ic = new lib.ic.InfoCenter({moduleName:'cache'});

var Cache = function(){
    this._cache = {};
    var _this = this;
    var cache = this._cache;
    setInterval(function(){
        var now = Date.now();
        var cleared = 0;
        for(var key in  cache){
            if(cache.hasOwnProperty(key)){
                var cached = cache[key];
                if(cached.expires < now){
                    delete cache[key];
                    cleared++;
                }
            }
        }
        ic.log('clear ' + cleared + ' caches in ' + (Date.now() - now) + ' ms & ' + Object.keys(cache).length + ' caches left');
    },60 * 1000);
};

Cache.prototype.set = function(name,value,options){
    var cache = this._cache;
    var expires = 0;
    if(options.expires){
        expires = options.expires;
    }
    expires = new Date(Date.now() + expires * 1000);
    var data;
    if(lib.object.isObject(value)){
        data = JSON.stringify(value);
    }
    else{
        data = value;
    }
    cache[name] = {
        expires:expires,
        data:data
    };
};

Cache.prototype.get = function(name){
    var cached = this._cache[name];
    if(cached){
        try{
            if(Date.now() < cached.expires){
                return JSON.parse(cached.data);
            }
        }
        catch(e){
            console.log(e);
            return null;
        }
    }
    return null;
};

Cache.prototype.isAboutToExpired = function(name){
    var t = Date.now();
    var cached = this._cache[name];
    if(t + 10000 > cached.expires && t < cached.expires){
        return true;
    }
    return false;
};

module.exports = Cache;