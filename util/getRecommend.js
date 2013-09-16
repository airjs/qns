var lib = require('qiyilib');
var fetch = require('../fetch');
var Channel = require('./channel');

var ic = new lib.ic.InfoCenter({moduleName:'getRecommend'});

var baseUrl = 'http://localhost/cache';
// if(process.platform === 'win32'){
    baseUrl = 'http://qiyu.iqiyi.com';
// }

var getRecommend = function(params,callback){
    params = lib.object.extend({
        rltfmt:'json'
    },params || {});
    fetch({
        url:baseUrl + '/p13n',
        params:params
    },function(err,data){
        if(!err){
            data.channel_rec[0].selected_album.forEach(function(item){
                item.pic_url = item.pic_url.replace(/\.(\w+)$/,'_120_160.$1');
                item.time_length = lib.date.formatSeconds(item.time_length);
                item.path = Channel.getDataByCid(item.channel_id).url;
            });
            callback(null,data);
        }
        else{
            callback(err);
        }
    });
};

module.exports = getRecommend;