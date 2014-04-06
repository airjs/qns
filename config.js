var lib = require('qiyilib');
var Path = require('path');
var fs = require('fs');
var UglifyJS = require('uglify-js');

var defaultConfig = Path.join(__dirname, 'conf/default.conf');
var currConfig = defaultConfig;

var evt = {};

var Config = {
    load: function(filePath) {
        if (currConfig) {
            fs.unwatchFile(currConfig);
        }
        this.apply(filePath);
        fs.watchFile(currConfig, this._onchange.bind(this));
        return this._load();
    },
    reload: function() {
        return this._load();
    },
    apply: function(filePath) {
        if (filePath) {
            currConfig = filePath;
        } else {
            currConfig = defaultConfig;
        }
    },
    read: function() {
        this.apply();
        return lib.fs.readFile(currConfig);
    },
    write: function(config) {
        this.apply();
        var stream = UglifyJS.OutputStream({
            beautify: true
        });
        var ast = UglifyJS.parse(config);
        var str = ast.print(stream);
        lib.fs.writeFile(currConfig, str);
    },
    on: function(type, listener) {
        var listeners = evt[type];
        if (!listeners) {
            evt[type] = [];
            listeners = evt[type];
        }
        listeners.push(listener);
    },
    fire: function(ev) {
        var type = ev.type;
        var data = ev.data;
        var listeners = evt[type];
        if (listeners) {
            listeners.forEach(function(listener) {
                listener(ev);
            });
        }
    },
    _onchange: function() {
        var _this = this;
        var config = this.reload();
        this.fire({
            type: 'change',
            data: {
                config: config
            }
        });
    },
    _load: function() {
        var fileContent, config;
        try {
            fileContent = lib.fs.readFile(currConfig);
        } catch (e) {
            return null;
        }
        try {
            config = JSON.parse(fileContent);
        } catch (e) {
            return null;
        }
        return config;
    }
};

module.exports = Config;