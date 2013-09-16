var lib = require('qiyilib');

var fetch = require('../fetch');




module.exports = function(params,callback){
    fetch({
        url:'http://top.inter.qiyi.com/index/fronts',
        params:{
            len:'10',
            area:'iqiyi',
            cids:'2_1_16_6_4_3_10_7_5_17_13_9_22_21_20_12_15_8_24_25_26',
            dim:'wee'
        },
        expires:300
    },callback);
};