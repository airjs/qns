var lib = require('qiyilib');
var Path = require('path');
var fs = require('fs');
var uglify = require('uglify-js');

var defaultConfig = Path.join(__dirname, '../conf/default.conf');
var currConfig = defaultConfig;

var evt = {};

(function(obj) {
    var p = [],
        push = function(m) {
            return '\\' + p.push(m) + '\\';
        },
        pop = function(m, i) {
            return p[i - 1]
        },
        tabs = function(count) {
            return new Array(count + 1).join('\t');
        };

    obj.format = function(json) {
        p = [];
        var out = "",
            indent = 0;

        // Extract backslashes and strings
        json = json
            .replace(/\\./g, push)
            .replace(/(".*?"|'.*?')/g, push)
            .replace(/\s+/, '');

        // Indent and insert newlines
        for (var i = 0; i < json.length; i++) {
            var c = json.charAt(i);

            switch (c) {
                case '{':
                case '[':
                    out += c + "\n" + tabs(++indent);
                    break;
                case '}':
                case ']':
                    out += "\n" + tabs(--indent) + c;
                    break;
                case ',':
                    out += ",\n" + tabs(indent);
                    break;
                case ':':
                    out += ": ";
                    break;
                default:
                    out += c;
                    break;
            }
        }

        // Strip whitespace from numeric arrays and put backslashes 
        // and strings back in
        out = out
            .replace(/\[[\d,\s]+?\]/g, function(m) {
                return m.replace(/\s/g, '');
            })
            .replace(/\\(\d+)\\/g, pop) // strings
        .replace(/\\(\d+)\\/g, pop); // backslashes in strings

        return out;
    };
})(JSON);

var Config = {
    load: function() {
        return this._load();
    },
    watch: function() {
        if (currConfig) {
            fs.unwatchFile(currConfig);
        }
        fs.watchFile(currConfig, this._onchange.bind(this));
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
        return lib.fs.readFile(currConfig);
    },
    write: function(config) {
        var str = JSON.stringify(config);
        lib.fs.writeFile(currConfig, JSON.format(str));
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
        var defaultConfig = {
            socketPort: 56789
        };
        try {
            fileContent = lib.fs.readFile(currConfig);
        } catch (e) {
            return defaultConfig;
        }
        try {
            config = lib.object.extend(defaultConfig, JSON.parse(fileContent));
        } catch (e) {
            return defaultConfig;
        }
        return config;
    }
};

module.exports = Config;