var channels = [{
        name:'电影',//over
        htid:'dianying',//首页模板id
        categoryId:1,
        types:[{
            desc:"按地区",
            mb10:true,
            all:["全部","华语","美国","欧洲","韩国","日本"]
        },{
            desc:"按类型",
            all:["全部","动作","喜剧","爱情","惊悚","科幻"]
        }]
    },{
        name:'电视剧',//over
        htid:'dianshiju',//首页模板id
        categoryId:2,
        types:[{
            desc:"按地区",
            mb10:true,
            all:["全部","内地","韩国","美剧","台湾","香港"]
        },{
            desc:"按类型",
            all:["全部","青春","家庭","军旅","言情","古装"]
        }]
    },{
        name:'片花',//over
        htid:'pianhua',//首页模板id
        categoryId:10,
        types:[{
            desc:"按分类",
            mb10:true,
            all:["全部","电影","电视剧"]
        },{
            desc:"按地区",
            all:["全部","华语","美国","欧洲"]
        }]
    },{
        name:'微电影',//over
        htid:'weidianying',//首页模板id
        categoryId:16,
        types:[{
            desc:"按片种",
            mb10:true,
            all:["全部","剧情","动画","记录","创意","音乐","网剧"]
        },{
            desc:"按类型",
            all:["全部","伦理","社会","惊悚","悬疑","温情","奇幻"]
        }]
    },{
        name:'动漫',//over
        htid:'dongman',//首页模板id
        categoryId:4,
        types:[{
            desc:"按地区",
            mb10:true,
            all:["全部","大陆","日本","美国","法国","韩国"]
        },{
            desc:"按年龄",
            all:["全部","0-3","4-6","7-13","14-17","18以上"]
        }]
    },{
        name:'综艺',//over
        htid:'zongyi',//首页模板id
        categoryId:6,
        types:[{
            desc:"按地区",
            mb10:true,
            all:["全部","内地","港台","日韩","其它"]
        },{
            desc:"按类型",
            all:["全部","选秀","访谈","相亲","游戏","脱口秀"]
        }]
    },{
        name:'纪录片',//over
        htid:'jilupian',//首页模板id
        categoryId:3,
        types:[{
            desc:"按类型",
            mb10:true,
            all:["全部","社会","军事","探索","自然","历史"]
        }]
    },{
        name:'音乐',//over
        htid:'yinyue',//首页模板id
        categoryId:5,
        types:[{
            desc:"按地区",
            mb10:true,
            all:["全部","内地","欧美","日韩"]
        },{
            desc:"按流派",
            all:["全部","流行","摇滚","民谣","说唱","爵士"]
        }]
    },{
        name:'旅游',//over
        htid:'lvyou',//首页模板id
        categoryId:9,
        types:[{
            desc:"按地区",
            mb10:true,
            all:["全部","北京","西藏","法国","日本","埃及"]
        },{
            desc:"按类型",
            all:["全部","风光","饮食","出行","住宿"]
        }]
    },{
        name:'时尚',//oever
        htid:'shishang',//首页模板id
        categoryId:13,
        types:[{
            desc:"按行业",
            mb10:true,
            all:["全部","美容","服饰","生活","其他"]
        },{
            desc:"按季节",
            all:["全部","早春","春夏","早秋","秋冬","其他"]
        }]
    },{
        name:'娱乐',//voer
        htid:'yule',//首页模板id
        categoryId:7,
        types:[{
            desc:"按地区",
            mb10:true,
            all:["全部","内地","港台","日韩","海外","其它"]
        },{
            desc:"按类型",
            all:["全部","明星","影视","音乐","综艺"]
        }]
    },{
        name:'体育',//over
        htid:'sports',//首页模板id
        categoryId:17,
        types:[{
            desc:"按项目",
            mb10:true,
            all:["全部","热点","篮球","足球","网球","八卦"]
        },{
            desc:"按类型",
            all:["全部","集锦","花絮","进球","整场","节目"]
        }]
    },
        {
            name:'搞笑',//over
            htid:'fun',//首页模板id
            categoryId:22,
            types:[{
                desc:"按地区",
                mb10:true,
                all:["全部", "国内", "国外"]
            },{
                desc:"按类型",
                all:["全部", "热播", "原创","屌丝", "童趣"]
            }]
        },
        {
            name:'广告',//over
            htid:'ad',//首页模板id
            categoryId:20,
            types:[{
                desc:"按分类",
                mb10:true,
                all:["全部","明星","公益","欧美","形象","搞笑"]
            },{
                desc:"按品牌",
                all:["全部", "食品", "饮料", "化妆品", "房地产"]
            }]
        },
        {
            name:'生活',//over
            htid:'life',//首页模板id
            categoryId:21,
            types:[{
                desc:"按地区",
                mb10:true,
                all:["全部","国内", "国外"]
            },{
                desc:"按类型",
                all:["全部","热播","社会" ,"奇闻" ,"美食"]
            }]
        },
        {
            name:'教育',//over
            htid:'edu',//首页模板id
            categoryId:12,
            types:[{
                desc:"按类型",
                mb10:true,
                all:["全部" ,"幼儿","小学" ,"初中" ,"高中"]
            },{
                desc:"按学科",
                all:["全部","语文", "数学", "英语", "物理" ,"化学"]
            }]
        },
        {
            name:'财经',//over
            htid:'caijing',//首页模板id
            categoryId:24,
            types:[{
                desc:"按类型",
                mb10:true,
                all:["全部" ,"宏观","民生" ,"产经" ,"理财","访谈"]
            }]
        },
        {
            name:'少儿',//over
            htid:'shaoer',//首页模板id
            categoryId:15,
            types:[{
                desc:"按产地",
                mb10:true,
                all:["全部" ,"大陆","港台" ,"欧美" ,"日韩", "其他"]
            },{
                desc:"按类型",
                all:["全部","动画", "少儿", "早教"]
            }]
        },
        {
            name:'游戏',//over
            htid:'youxi',//首页模板id
            categoryId:8,
            types:[{
                desc:"按类型",
                mb10:true,
                all:["全部" ,"网游","竞技" ,"单机" ,"手机","美女"]
            }]
        },
        {
            name:'资讯',//over
            htid:'zixun',//首页模板id
            categoryId:25,
            types:[{
                desc:"按类型",
                mb10:true,
                all:["全部" ,"社会","财经" ,"奇闻" ,"民生", "科技"]
            },{
                desc:"按地区",
                all:["全部","国内", "国外"]
            }]
        },
        {
            name:'汽车',//over
            htid:'qiche',//首页模板id
            categoryId:26,
            types:[{
                desc:"按内容",
                mb10:true,
                all:["全部" ,"资讯","新车" ,"试驾" ,"用车", "车模"]
            },{
                desc:"按地区",
                all:["全部","自主", "欧洲", "亚洲", "北美"]
            }]
        }];
        var ChannelFilter = {
            getByName: function(name) {
                var category;
                channels.forEach(function(channel){
                    if(channel.name==name){
                        category = channel;
                        return;
                    }
                });

                category.types.forEach(function(type,i){
                    var all = [];
                    type.all.forEach(function(item){
                        if(item=='全部'){
                            all.push({'name':item,'sel':true});
                        }
                        else {
                            all.push({'name':item,'sel':false});
                        }
                    });
                    type.alls = all;
                    type.i=i;
                });
                return category;
            },
            getCategoryIdByName : function(name) {
                var categoryId = 0;
                channels.forEach(function(c) {
                    if (c.name == name) {
                        categoryId = c.categoryId;
                    }
                });
                return categoryId;
            },
            gethtidByName : function(name) {
                var htid = null;
                channels.forEach(function(c) {
                    if (c.name == name) {
                        htid = c.htid;
                    }
                });
                return htid;
            }
        };

module.exports = ChannelFilter;