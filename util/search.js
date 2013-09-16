var lib = require('qiyilib');
var Search =  {
    _url : 'http://search.m.iqiyi.com/commonSearch',
    formatKey : function(key) {
        var encodedKey = encodeURIComponent(key);
        return encodedKey.replace(/%/g, '_');
    },
    formatContentType : function(category) {
        var c = encodeURIComponent(category || "");
        var temp = c.replace(/%/g, '_');
        if (temp === "片花") {
            return 2;
        }
        return 0;
    },
    //只支持array
    formatThreeCategory : function(arr) {
        var threeCategory = '';
        if (lib.array.isArray(arr)) {
            threeCategory = encodeURIComponent(arr.join(',')).replace(/%/g, '_');
        }
        return threeCategory;
    },
    search:function(param,fn) {
        var self = this;

        var query = {
            keyWord : param.keyWord,
            cur : param.cur,
            sortKey : param.sortKey,
            category : param.category,
            threeCategory : param.threeCategory,
            limit : param.limit,
            isPurchase :param.isPurchase, // h5端过滤会员视频的搜索结果
            domain : param.domain,
            from : param.from,
            contentType : param.contentType
        };

        // 对于undefine的值，设置其为空
        for(var i in query){
            if(typeof query[i] === "undefined"){
                query[i] = "";
            }
        }

        var request_url = Search._url + '/?' + lib.url.jsonToQuery(query);

        lib.http.request(request_url, {
            method : 'get',
            cors : true,
            timeout : 30000,
            noCache : true,
            onfailure : function(xhr, data) {
                fn(false);
            },
            onsuccess : function(xhr, text) {

                if (text) {

                    var json = JSON.parse(text);

                    if (json.code == 'A00000') {
                        if (json.data) {
                            var _data = {};
                            _data.success = true;
                            _data.eventId = json.eventId;
                            _data.data = json.data;
                            if (json.data.list && json.data.list.length === 0) {
                                _data.isFinal = true;
                            }
                            else if (json.data.list &&
                                json.data.rows &&
                                json.data.rows > json.data.list.length) {
                                _data.isFinal = true;
                            }
                            else if (json.data.startRow > json.data.sumCounts) {
                                _data.isFinal = true;
                            }
                            else if (json.data.cur == json.data.sumPages) {
                                _data.isFinal = true;
                            }
                            else {
                                _data.isFinal = false;
                            }
                            _data.first = json.first;
                            fn(_data);
                            return;
                        }
                    }
                }
            }
        });
    }
};
module.exports = Search;