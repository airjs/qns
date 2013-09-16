var lib = require('qiyilib');
var Cache = require('./cache');

var ic = new lib.ic.InfoCenter({moduleName:'fetch'});

var cache = new Cache();

var updateCache = function(options,callback){
    var url = options.url;
    var params = options.params || {};
    var key = lib.crypto.md5(url + (JSON.stringify(params)));
    var method = options.method || 'get';
    var rurl = url,qParams = lib.url.jsonToQuery(params);
    if(method === 'get' && qParams){
        rurl = url.indexOf('?') !== -1 ? (url + '&' + qParams) : (url + '?' + qParams);
    }
    else{
        rurl = url;
    }
        ic.log('Fetching ' + rurl);
        var t = Date.now();
        lib.http.request(rurl,{
            data:qParams,
            onsuccess:function(xhr,data){
                ic.log(rurl + ' responesed in ' + (Date.now() - t) + 'ms');
                data = data.toString();
                data = data.trim();
                var rdata;
                data = data.replace(/^[^\[\{]*([\[\{].*[\]\}]).*?$/,'$1');
                try{
                    data = JSON.parse(data + '');
                }
                catch(e){
                    if(callback){
                        callback({message:'JSON.parse error.'});
                    }
                    return;
                }
                if(data.hasOwnProperty('code') && data.hasOwnProperty('data')){
                    if(data.code !== 'A00000'){
                        if(callback){
                            callback({message:'data.code is ' + data.code});
                        }
                        return;
                    }
                    else{
                        rdata = data.data;
                    }
                }
                else{
                    rdata = data;
                }
                var map = options.map;
                var cdata = rdata;
                if(map){
                    cdata = {};
                    for(var name in map){
                        if(map.hasOwnProperty(name)){
                            var value;
                            try{
                                value = eval('rdata.' + map[name]);
                            }
                            catch(e){
                                continue;
                            }
                            cdata[name] = value;
                        }
                    }
                }
                if(options.expires){
                    cache.set(key,cdata,{expires:options.expires});
                }
                if(callback){
                    callback(null,cdata);
                }
            },
            onfailure:function(){
                var errmsg = 'fetch failed : ' + rurl;
                ic.log(errmsg);
                if(callback){
                    callback({message:errmsg});
                }
            }
        });
};

var fetch = function(options,callback){
    var url = options.url;
    var params = options.params || {};
    var key = lib.crypto.md5(url + (JSON.stringify(params)));
    var cached = cache.get(key);
    if(cached){
        ic.log(url + ' response frome cache.');
        if(callback){
            callback(null,cached);
        }
        if(cache.isAboutToExpired(key)){
            ic.log('update cache.');
            updateCache(options);
        }
        return;
    }
    updateCache(options,callback);
};

module.exports = fetch;