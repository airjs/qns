var Path = require('path');
var fs = require('fs');
var uglify = require('uglify-js');
var extend = require('node.extend');
var cp = require('child_process');

var defaultConfig = Path.join(process.env.HOME, '.qns/default.conf');

var currConfPath = Path.join(process.env.HOME, '.qns/.currconfig');

var currConfig = defaultConfig;

if (fs.existsSync(currConfPath)) {
    currConfig = fs.readFileSync(currConfPath).toString();
}

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
        this.__config = this._load();
        return this.__config;
    },
    watch: function() {
        if (currConfig) {
            fs.unwatchFile(currConfig);
        }
        fs.watchFile(currConfig, this._onchange.bind(this));
    },
    apply: function(filePath) {
        if (filePath) {
            currConfig = filePath;
        } else {
            currConfig = defaultConfig;
        }
        fs.writeFileSync(Path.join(process.env.HOME, '.qns/.currconfig'), currConfig, {
            flag: 'w+'
        });
    },
    edit: function() {
        cp.spawn(process.env.EDITOR || 'vi', [currConfig], {
            stdio: 'inherit'
        });
    },
    read: function() {
        return fs.readFileSync(currConfig);
    },
    save: function(config) {
        if (!this.__config) {
            this.load();
        }
        extend(true, this.__config, config);
        this.write(this.__config);
    },
    write: function(config) {
        var str = JSON.stringify(config);
        fs.writeFileSync(currConfig, JSON.format(str));
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
        this.load();
        this.fire({
            type: 'change',
            data: {
                config: this.__config
            }
        });
    },
    _load: function() {
        var fileContent, config;
        var defaultConfig = {
            socketPort: 56789,
            port: 8080
        };
        try {
            fileContent = fs.readFileSync(currConfig);
        } catch (e) {
            return defaultConfig;
        }
        try {
            config = extend(defaultConfig, JSON.parse(fileContent));
        } catch (e) {
            console.log(e)
            return defaultConfig;
        }
        return config;
    }
};

module.exports = Config;