var lib = require('qiyilib');
var fetch = require('../fetch');

var ic = new lib.ic.InfoCenter({moduleName:'getVideoInfo'});

var baseUrl = 'http://localhost/cache';
if(process.platform === 'win32'){
    baseUrl = 'http://cache.m.iqiyi.com';
}

var getVideoInfo = function(tvid,callback){
    var t = Date.now();
    fetch({
        url:baseUrl + '/qmt/' + tvid + '/',
        map:{
            vh:'startTime',
            vt:'endTime',
            ts:'mtl',
            mp4:'mpl',
            pv:'ptv',
            nv:'ntv',
            ipl:'ipLimit',
            cid:'categoryId'
        },
        expires:300
    },function(err,data){
        if(!err){
            var t1 = Date.now();
            ic.log('qmt response in ' + (t1 - t));
            var vi = data;
            var vid;
            var ts = vi.ts;
            var mp4 = vi.mp4;
            if(ts && ts.length > 0){
                vid = ts[0].vid;
            }
            else if(mp4 && mp4.length > 0){
                vid = mp4[0].vid;
            }
            else{
                callback({message:'no rate.'});
                return;
            }
            fetch({
                url:baseUrl + '/vi/' + tvid + '/' + vid + '/',
                map:{
                    pt:'plg',
                    vn:'vn',
                    an:'an',
                    af:'tvFocuse',
                    vf:'subt',
                    ma:'ma',
                    ctg:'categoryKeywords',
                    vdes:'info',
                    vimg:'vpic',
                    aimg:'apic',
                    vurl:'vu',
                    aurl:'au',
                    aid:'aid',
                    qtid:'qtId',
                    dir:'d',
                    wf:'fl',
                    tg:'tg'
                },
                expires:300
            },function(err,data){
                ic.log('vi response in ' + (Date.now() - t1));
                if(!err){
                    lib.object.extend(vi,data);
                    callback(null,vi);
                }
                else{
                    callback(err);
                }
            });
        }
        else{
            callback(err);
        }
    });
};

module.exports = getVideoInfo;