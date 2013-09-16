/**
 * 测试加载一个新模块和卸载一个老模块时的自动更新功能
 *
 */
var lib = require('qiyilib');
var Path = require('path');
var childProcess = require('child_process');
var base = '';
var Server = require('../../server');

var server = new Server();
server.start(8888);

var process = function(req,res){
    res.send('testget');
};

var TestModule = {
    modulePath:Path.join(base,'modules/test'),
    add:function(){
        lib.fs.mkdir(this.modulePath);
        var moduleFilePath = Path.join(this.modulePath,'index.js');
        lib.fs.writeFile(moduleFilePath,'var Test = {init:function(server){server.get("/test.html",this._process)},unload:function(server){server.unget("/test.html",this._process)},_process:function(req,res){res.send("test")}};module.exports = Test;');
    },
    remove:function(){
        lib.fs.rm(this.modulePath);
    },
    write:function(content){
        var moduleFilePath = Path.join(this.modulePath,'index.js');
        lib.fs.writeFile(moduleFilePath,'var Test = {init:function(server){server.get("/test.html",this._process)},unload:function(server){server.unget("/test.html",this._process)},_process:function(req,res){res.send("' + content + '")}};module.exports = Test;');
    }
};

describe('Server', function(){
    describe('#get', function(){
        it('get a url', function(done){
            server.get('/testget.html',process);
            lib.http.request('http://localhost:8888/testget.html',{
                onsuccess:function(xhr,data){
                    if(data.toString() === 'testget'){
                        done();
                    }
                },
                onfailure:function(e){
                    throw e;
                }
            });
        });
    });
    describe('#unget', function(){
        it('unget a url', function(done){
            lib.http.request('http://localhost:8888/testget.html',{
                onsuccess:function(xhr,data){
                    if(data.toString() === 'testget'){
                        server.unget('/testget.html',process);
                        lib.http.request('http://localhost:8888/testget.html',{
                            onsuccess:function(xhr,data){
                                throw 'unget error';
                            },
                            onfailure:function(e){
                                done();
                            }
                        });
                    }
                },
                onfailure:function(e){
                    throw e;
                }
            });
        });
    });
    describe('#loadModule', function(){
        it('load a module', function(done){
            TestModule.add();
            server.loadModule(['test']);
            lib.http.request('http://localhost:8888/test.html',{
                onsuccess:function(xhr,data){
                    if(data.toString() === 'test'){
                        done();
                    }
                    TestModule.remove();
                },
                onfailure:function(e){
                    TestModule.remove();
                    throw e;
                }
            });
        });
        it('load a module that not exist', function(done){
            server.get('/testget.html',process);
            server.loadModule(['test']);
            lib.http.request('http://localhost:8888/testget.html',{
                onsuccess:function(xhr,data){
                    if(data.toString() === 'testget'){
                        done();
                    }
                    server.unget('/testget.html',process);
                },
                onfailure:function(e){
                    server.unget('/testget.html',process);
                    throw e;
                }
            });
        });
    });
});