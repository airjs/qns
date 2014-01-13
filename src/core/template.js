var lib = require('qiyilib');
var cons = require('consolidate');
var ic = new lib.ic.InfoCenter({moduleName:'core.template'});

module.exports = {
    init:function(app,config){
        config = config || {};
        var type = config.type || 'jade';
        var ext = config.ext || 'jade';
        var views = config.views || __dirname + '/views';
        app.engine(ext,cons[type]);
        console.log(cons[type]);
        app.set('view engine', 'html');
        app.set('views', views);
    }
};