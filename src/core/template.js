var lib = require('qiyilib');
var cons = require('consolidate');
var ic = new lib.ic.InfoCenter({
    moduleName: 'core.template'
});

module.exports = {
    init: function(app, config) {
        app._set('view engine', 'jade');
    },
    unload: function() {}
};