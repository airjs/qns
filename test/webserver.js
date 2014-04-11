/**
 * 测试加载一个新模块和卸载一个老模块时的自动更新功能
 *
 */
var lib = require('qiyilib');
var Path = require('path');
var childProcess = require('child_process');
var base = '';
var Server = require('../src-cov/server');

var assert = require('assert');

var modulePath = Path.join(process.env.QNS_PATH,'test');
var log = require('loglevel');
log.disableAll();
var server = new Server({port:9999,views:modulePath});
server.start();

var _process = function(req,res){
    res.send('testget');
};
var TestModule = {
    modulePath:modulePath,
    add:function(){
        lib.fs.mkdir(this.modulePath);
        var moduleFilePath = Path.join(this.modulePath,'index.js');
        lib.fs.writeFile(moduleFilePath,'var Test = {init:function(server){server._route({"/test.html":{callback:this._process}})},unload:function(server){},_process:function(req,res){res.render("test.jade",{name:"seon"})}};module.exports = Test;');
        this.writeTemplate();
    },
    remove:function(){
        lib.fs.rm(this.modulePath);
    },
    write:function(content){
        var moduleFilePath = Path.join(this.modulePath,'index.js');
        lib.fs.writeFile(moduleFilePath,'var Test = {init:function(server){server._route({"/test.html":{callback:this._process}})},unload:function(server){},_process:function(req,res){res.send("' + content + '")}};module.exports = Test;');
    },
    writeTemplate:function(content){
        content = content || '="test"';
        lib.fs.writeFile(Path.join(this.modulePath,'test.jade'),content)
    }
};

describe('Webserver', function(){
    it.skip('load a module by array param', function(done){
        TestModule.add();
        server.loadModule(['test']);
        lib.http.request('http://localhost:9999/test.html',{
            onsuccess:function(xhr,data){
                if(data.toString() === 'test'){
                    done();
                }
                server.unloadModule(['test']);
                TestModule.remove();
            },
            onfailure:function(e){
                server.unloadModule(['test']);
                TestModule.remove();
                throw e;
            }
        });
    });
});