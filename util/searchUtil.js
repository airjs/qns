var lib = require('qiyilib');
var formatSeconds = lib.date.formatSeconds;
var channelFilter = require('./channelFilter');
var SearchUtil = {
    getData4PTmpl: function (results) {
        var data = [];
        var _this = this;
        results.forEach(function (item) {
            var category = channelFilter.getCategoryIdByName(item['category']);
            var o = {};
            var vdata = _this._bindData(item);
            vdata.channelId = item.categoryId;
            if (vdata) {
                //过滤会员
                //if(vdata.isPurchase == '2') return;
                //过滤单集数据
                //if(!vdata.isSeries) return;
                vdata.channel = channelFilter.gethtidByName(item['category']);
                if (item['playtime']) {
                    vdata.playTime = formatSeconds(item['playtime']);
                }
                //o[category] = vdata;
                data.push(vdata);
            }
        });
        return data;
    },
    _bindData: function (item) {
        switch (item['category']) {
            case '电影':
                return this._bindMovie(item);
            case '电视剧':
                return this._bindTV(item);
            case '娱乐':
                return this._bindYuLe(item);
            case '搞笑':
                return this._bindYuLe(item);
            case '广告':
                return this._bindYuLe(item);
            case '纪录片':
                return this._bindJiLuPian(item);
            case '综艺':
                return this._bindZongYi(item);
            case '片花':
                return this._bindPianHua(item);
            case '动漫':
                return this._bindDongMan(item);
            case '音乐':
                return this._bindYinYue(item);
            case '时尚':
                return this._bindShiShang(item);
            case '旅游':
                return this._bindLvYou(item);
            case '微电影':
                return this._bindWeiDianYing(item);
            case '体育':
                return this._bindTiYu(item);
            case '教育':
                return this._bindJiLuPian(item);
            case '生活':
                return this._bindShiShang(item);
            case '游戏':
                return this._bindShiShang(item);
            case '少儿':
                return this._bindShaoer(item);
            case '财经':
                return this._bindShiShang(item);
            case '资讯':
                return this._bindShiShang(item);
            case '汽车':
                return this._bindShiShang(item);
            default:
                return this._bindMovie(item);
        }
    },
    _bindMovie: function (item) {
        var pic = item['vrsVideoTv.TvBigPic'];
        pic = pic.replace('.jpg', '_110_70.jpg');
        var year = item['VrsVideotv.tvYear'];
        var tags = [];
        if (item['threeCategory']) {
            var tcs = item['threeCategory'].split(',');
            for (var i = 0; i < 4; i++) {
                if (tcs[i] == '电影' || tcs[i] == '电视剧' || !tcs[i]) {
                    continue;
                }
                tags.push(tcs[i]);
            }
        }
        /*if (year) {
         tags.unshift(year.substring(0, 4));
         }*/
        /*var joinTags = tags.join('/');
         if (joinTags.match(/\/$/)) {
         joinTags = joinTags.replace('/\/$/', '');
         }*/
        return {
            "apic": pic,
            "albumId": item['VrsVideoTv.id'],
            "focus": item['tvFocus'].substring(0, 14),
            "name": item['VrsVideoTv.tvName'],
            "sname": item['VrsVideoTv.tvName'].substring(0, 14),
            "tags": tags,
            "stags": tags.length > 0 ? true : false,
            'firstVid': item['vid'],
            'firstTvid': item['tvId'],
            'year': year.substring(0, 4)
        };
    },
    _bindTV: function (item) {
        var tv = this._bindMovie(item);
        if (tv) {
            if (!item.updateTo || (item.updateTo == item.tvsets)) {
                tv.sets = parseInt(item['tvsets'], 10);
            } else {
                tv.follow = parseInt(item['updateTo'], 10);
            }
        }
        var isSeries;
        if (item['video_doc_type'] == '2') {//只有电视剧用video_doc_type
            isSeries = 0;
        } else {
            isSeries = 1;
        }
        tv.isSeries = isSeries;
        return tv;
    },
    _bindYuLe: function (item) {
        var pic = item['vrsVideoTv.TvBigPic'];
        pic = pic.replace('.jpg', '_110_70.jpg');
        return {
            "apic": pic,
            "albumId": item['VrsVideoTv.id'],
            "name": item['VrsVideoTv.tvName'],
            "sname": item['VrsVideoTv.tvName'].length > 14 ? item['VrsVideoTv.tvName'].substring(0, 13) : '',
            "focus": item['tvFocus'].substring(0, 14),
            "pubtime": item['AlbumPublishTime'].substring(0, 10),
            "playcount": this._formatPlayCount(item['AlbumPlayCount']),
            "firstVid": item['vid'],
            "firstTvid": item['tvId']
        };
    },
    _bindJiLuPian: function (item) { //tvYear可能为'0'
        var pic = item['vrsVideoTv.TvBigPic'];
        pic = pic.replace('.jpg', '_110_70.jpg');
        var tags = [];
        if (item['threeCategory']) {
            var tcs = item['threeCategory'].split(',');
            for (var i = 1, len = tcs.length; i < len; i++) {
                if (tcs[i]) {
                    tags.push(tcs[i]);
                }
            }
        }
        var sets, follow;
        if (!item.updateTo || (item.updateTo == item.tvsets)) {
            sets = parseInt(item['tvsets'], 10);
        } else {
            follow = parseInt(item['updateTo'], 10);
        }
        return {
            "apic": pic,
            "albumId": item['VrsVideoTv.id'],
            "focus": item['tvFocus'].substring(0, 14),
            "name": item['VrsVideoTv.tvName'],
            "sname": item['VrsVideoTv.tvName'].length > 14 ? item['VrsVideoTv.tvName'].substring(0, 13) : '',
            "tags": tags,
            "stags": tags.length > 0 ? true : false,
            "sets": sets,
            "playcount": this._formatPlayCount(item['AlbumPlayCount']),
            "isSeries": parseInt(item['isSeries'], 10),
            "firstVid": item['vid'],
            "firstTvid": item['tvId'],
            "follow": follow
        };
    },
    _bindZongYi: function (item) {
        var pic = item['vrsVideoTv.TvBigPic'];
        pic = pic.replace('.jpg', '_110_70.jpg');
        var actors = item['VrsCredits.CreditsName'] || '';
        var threeActor = [];
        if (actors) {
            threeActor = actors.split(',', '3');
        }
        return {
            "apic": pic,
            "albumId": item['VrsVideoTv.id'],
            "name": item['VrsVideoTv.tvName'],
            "sname": item['VrsVideoTv.tvName'].length > 14 ? item['VrsVideoTv.tvName'].substring(0, 13) : '',
            "focus": item['tvFocus'].substring(0, 14),
            "pubtime": item['VrsVideotv.tvYear'].substring(0, 10),
            "period": parseInt(item['tvPhase'], 10),
            "season": parseInt(item['tvSeason'], 10),
            // "emcee": threeActor.join(','),
            // "codeId": parseInt(item['sourceCode']),
            "firstVid": item['vid'],
            "firstTvid": item['tvId']
        };
    },
    _bindPianHua: function (item) {
        var pic = item['vrsVideoTv.TvBigPic'];
        pic = pic.replace('.jpg', '_110_70.jpg');
        var year = item['VrsVideotv.tvYear'];

        var tags = [];
        if (item['threeCategory']) {
            var tcs = item['threeCategory'].split(',');
            for (var i = 1, len = tcs.length; i < len; i++) {
                if (tcs[i]) {
                    tags.push(tcs[i]);
                }
            }
        }
        return {
            "apic": pic,
            "albumId": item['VrsVideoTv.id'],
            "name": item['VrsVideoTv.tvName'],
            "sname": item['VrsVideoTv.tvName'].length > 14 ? item['VrsVideoTv.tvName'].substring(0, 13) : '',
            "focus": item['tvFocus'].substring(0, 14),
            "tags": tags,
            "stags": tags.length > 0 ? true : false,
            "year": year.substring(0, 4),//tags.join('/'),
            "playcount": this._formatPlayCount(item['AlbumPlayCount']),
            "firstVid": item['vid'],
            "firstTvid": item['tvId']
        };
    },
    _bindDongMan: function (item) {
        var pic = item['vrsVideoTv.TvBigPic'];
        pic = pic.replace('.jpg', '_110_70.jpg');
        var tags = [];
        /*if (item['VrsVideotv.tvYear']){
         tags.push(item['VrsVideotv.tvYear']);
         }*/
        var age;
        if (item['threeCategory']) {
            var tcs = item['threeCategory'].split(',');
            for (var i = 1; i < 4; i++) {
                if (tcs[i]) {
                    tags.push(tcs[i]);
                }
            }
            age = tcs[tcs.length - 1];
            if (age === '') {
                age = tcs[tcs.length - 2];
            }
            if (/(\d+)以上/.test(age)) {
                age = RegExp.$1 + '岁' + '以上';
            } else {
                age += '岁';
            }
        }
        var sets, follow;
        if (!item.updateTo || (item.updateTo == item.tvsets)) {
            sets = parseInt(item['tvsets'], 10);
        } else {
            follow = parseInt(item['updateTo'], 10);
        }
        return {
            "apic": pic,
            "albumId": item['VrsVideoTv.id'],
            "name": item['VrsVideoTv.tvName'],
            "sname": item['VrsVideoTv.tvName'].length > 14 ? item['VrsVideoTv.tvName'].substring(0, 13) : '',
            "tags": tags,
            "stags": tags.length > 0 ? true : false,
            "year": item['VrsVideotv.tvYear'],//tags.join('/'),
            "follow": follow,
            "sets": sets,
            "age": age,
            "focus": item['tvFocus'].substring(0, 14),
            "isSeries": parseInt(item['isSeries'], 10),
            "firstVid": item['vid'],
            "firstTvid": item['tvId']
        };
    },
    _bindYinYue: function (item) {
        var pic = item['vrsVideoTv.TvBigPic'];
        pic = pic.replace('.jpg', '_110_70.jpg');
        var tags = [];
        // if (item['VrsVideotv.tvYear']) {
        //     var tvYear = item['VrsVideotv.tvYear'];
        //     tags.push(tvYear.substring(0, 4));
        // }
        if (item['threeCategory']) {
            var tcs = item['threeCategory'].split(',');
            for (var i = 1; i < 4; i++) {
                if (tcs[i]) {
                    tags.push(tcs[i]);
                }
            }
        }
        return {
            "apic": pic,
            "albumId": item['VrsVideoTv.id'],
            "name": item['VrsVideoTv.tvName'],
            "sname": item['VrsVideoTv.tvName'].length > 14 ? item['VrsVideoTv.tvName'].substring(0, 13) : '',
            "tags": tags,
            "stags": tags.length > 0 ? true : false,
            "playcount": this._formatPlayCount(item['AlbumPlayCount']),
            "firstVid": item['vid'],
            "firstTvid": item['tvId']
        };
    },
    _bindShiShang: function (item) {
        var pic = item['vrsVideoTv.TvBigPic'];
        pic = pic.replace('.jpg', '_110_70.jpg');
        var codeId = 0;
        if (item['VrsFieldValue.fieldValue']) {
            codeId = 1;
        }
        var publishTime = item['AlbumPublishTime'];
        return {
            "apic": pic,
            "albumId": item['VrsVideoTv.id'],
            "name": item['VrsVideoTv.tvName'],
            "sname": item['VrsVideoTv.tvName'].length > 14 ? item['VrsVideoTv.tvName'].substring(0, 13) : '',
            "pubtime": item['VrsVideotv.tvYear'] || publishTime ? publishTime.split(' ')[0] : '',
            "playcount": this._formatPlayCount(item['AlbumPlayCount']),
            "focus": item['tvFocus'].substring(0, 14),
            "codeId": codeId,
            "firstVid": item['vid'],
            "firstTvid": item['tvId'],
            "period": parseInt(item['tvPhase'], 10),
            "season": parseInt(item['tvSeason'], 10),
            "isSeries": parseInt(item['isSeries'], 10)
        };
    },
    _bindLvYou: function (item) {
        var pic = item['vrsVideoTv.TvBigPic'];
        pic = pic.replace('.jpg', '_110_70.jpg');
        var tags = [];
        if (item['threeCategory']) {
            var tcs = item['threeCategory'].split(',');
            if (tcs[1]) {
                tags.push(tcs[1]);
            }
            for (var i = 3; i < 5; i++) {
                if (tcs[i]) {
                    tags.push(tcs[i]);
                }
            }
        }
        var sets, follow;
        if (!item.updateTo || (item.updateTo == item.tvsets)) {
            sets = parseInt(item['tvsets'], 10);
        } else {
            follow = parseInt(item['updateTo'], 10);
        }
        var codeId = 0;
        if (item['VrsFieldValue.fieldValue']) {
            codeId = 1;
        }
        return {
            "apic": pic,
            "albumId": item['VrsVideoTv.id'],
            "name": item['VrsVideoTv.tvName'],
            "sname": item['VrsVideoTv.tvName'].length > 14 ? item['VrsVideoTv.tvName'].substring(0, 13) : '',
            "focus": item['tvFocus'].substring(0, 14),
            "tags": tags,
            "stags": tags.length > 0 ? true : false,
            "sets": sets,
            "follow": follow,
            "playcount": this._formatPlayCount(item['AlbumPlayCount']),
            'codeId': codeId,
            "firstVid": item['vid'],
            "firstTvid": item['tvId'],
            "pubtime": item['VrsVideotv.tvYear'].substring(0, 10),
            "period": parseInt(item['tvPhase'], 10),
            "season": parseInt(item['tvSeason'], 10),
            "isSeries": parseInt(item['isSeries'], 10)
        };
    },
    _bindWeiDianYing: function (item) {
        var pic = item['vrsVideoTv.TvBigPic'];
        pic = pic.replace('.jpg', '_110_70.jpg');
        var tags = [];
        if (item['threeCategory']) {
            var tcs = item['threeCategory'].split(',');
            for (var i = 2; i < 5; i++) {
                if (tcs[i]) {
                    tags.push(tcs[i]);
                }
            }
        }
        return {
            "apic": pic,
            "albumId": item['VrsVideoTv.id'],
            "name": item['VrsVideoTv.tvName'],
            "sname": item['VrsVideoTv.tvName'].length > 14 ? item['VrsVideoTv.tvName'].substring(0, 13) : '',
            "focus": item['tvFocus'].substring(0, 14),
            "tags": tags,
            "stags": tags.length > 0 ? true : false,
            "playcount": this._formatPlayCount(item['AlbumPlayCount']),
            "firstVid": item['vid'],
            "firstTvid": item['tvId']
        };
    },
    _bindTiYu: function (item) {
        var pic = item['vrsVideoTv.TvBigPic'];
        pic = pic.replace('.jpg', '_110_70.jpg');
        var tags = [];
        if (item['threeCategory']) {
            var tcs = item['threeCategory'].split(',');
            for (var i = 2; i < 5; i++) {
                if (tcs[i] !== '') {
                    tags.push(tcs[i]);
                }
            }
        }
        var sets, follow, codeId;
        if (!item.updateTo || (item.updateTo == item.tvsets)) {
            sets = parseInt(item['tvsets'], 10);
        } else {
            follow = parseInt(item['updateTo'], 10);
        }
        if (item['VrsFieldValue.fieldValue']) {
            codeId = 1;
        } else {
            codeId = 0;
        }
        return {
            "apic": pic,
            "albumId": item['VrsVideoTv.id'],
            "name": item['VrsVideoTv.tvName'],
            "sname": item['VrsVideoTv.tvName'].length > 14 ? item['VrsVideoTv.tvName'].substring(0, 13) : '',
            "focus": item['tvFocus'].substring(0, 14),
            "sets": sets,
            "follow": follow,
            "tags": tags,
            "stags": tags.length > 0 ? true : false,
            "pubtime": item['VrsVideotv.tvYear'].substring(0, 10),
            "period": parseInt(item['tvPhase'], 10),
            "season": parseInt(item['tvSeason'], 10),
            "playcount": this._formatPlayCount(item['AlbumPlayCount']),
            "codeId": codeId,
            "firstVid": item['vid'],
            "firstTvid": item['tvId']
        };
    },
    _bindShaoer: function (item) {
        var codeId = item.sourceCode;
        codeId = codeId == '0' ? 0 : codeId;
        var obj = {"codeId": codeId};
        if (codeId) {
            lib.object.extend(obj, this._bindZongYi(item));
        } else {
            lib.object.extend(obj, this._bindTV(item));
        }
        return obj;
    },
    _formatPlayCount: function (pc) {
        if (pc.length < 3) {
            return pc;
        }
        var a = [];
        while (pc.length > 3) {
            var t = pc.substring(pc.length - 3, pc.length);
            pc = pc.substr(0, pc.length - 3);
            a.push(t);
        }
        a.push(pc);
        a.reverse();
        return a.join(',');
    }
};
module.exports = SearchUtil;