/**
 * 测试加载一个新模块和卸载一个老模块时的自动更新功能
 *
 */
var lib = require('qiyilib');
var Path = require('path');
var childProcess = require('child_process');
var base = '';
var Server = require('../../src/server');

var assert = require('assert');

var modulePath = Path.join(process.env.QNS_PATH,'test');

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

describe('Server', function(){
    describe('#functional', function(){
        it('load a module by array param', function(done){
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
        it('load a single module by string param', function(done){
            TestModule.add();
            server.loadModule('test');
            lib.http.request('http://localhost:9999/test.html',{
                onsuccess:function(xhr,data){
                    if(data.toString() === 'test'){
                        done();
                    }
                    server.unloadModule('test');
                    TestModule.remove();
                },
                onfailure:function(e){
                    server.unloadModule('test');
                    TestModule.remove();
                    throw e;
                }
            });
        });
        it('unload a module by array param', function(done){
            TestModule.add();
            server.loadModule(['test']);
            server.unloadModule(['test']);
            lib.http.request('http://localhost:9999/test.html',{
                onsuccess:function(xhr,data){
                    TestModule.remove();
                    throw 'unload module error';
                },
                onfailure:function(e){
                    done();
                    TestModule.remove();
                }
            });
        });
        it('unload a module by string param', function(done){
            TestModule.add();
            server.loadModule('test');
            server.unloadModule('test');
            lib.http.request('http://localhost:9999/test.html',{
                onsuccess:function(xhr,data){
                    TestModule.remove();
                    throw 'unload module error';
                },
                onfailure:function(e){
                    done();
                    TestModule.remove();
                }
            });
        });
        it('load a module that not exist', function(done){
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
        it('reload a module', function(done){
            TestModule.add();
            server.loadModule(['test']);
            TestModule.write('test2');
            server.reloadModule(['test']);
            lib.http.request('http://localhost:9999/test.html',{
                onsuccess:function(xhr,data){
                    if(data.toString() === 'test2'){
                        done();
                    }
                    else{
                        throw 'reload error';
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
    describe('template',function(){
        it('render', function(done){
            TestModule.add();
            TestModule.writeTemplate('h1= "hello " + name');
            server.loadModule(['test']);
            lib.http.request('http://localhost:9999/test.html',{
                onsuccess:function(xhr,data){
                    assert.equal(data + '','<h1>hello seon</h1>');
                    server.unloadModule(['test']);
                    TestModule.remove();
                    done();
                },
                onfailure:function(e){
                    server.unloadModule(['test']);
                    TestModule.remove();
                    throw e;
                }
            });
        });
    });
    describe('internal logic',function(){
        it('add to running module after load', function(done){
            TestModule.add();
            server.loadModule(['test']);
            TestModule.write('test2');
            server.reloadModule('test');
            lib.http.request('http://localhost:9999/test.html',{
                onsuccess:function(xhr,data){
                    if(data.toString() === 'test2'){
                        done();
                    }
                    else{
                        throw 'reload error';
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

        it('remove from running module after unload', function(done){
            TestModule.add();
            server.loadModule(['test']);
            server.unloadModule(['test']);
            assert.equal(true,!server.__runningModules['test']);
            done();
        });
        
        it('clear cache after unload', function(done){
            TestModule.add();
            server.loadModule(['test']);
            server.unloadModule(['test']);
            TestModule.write('test2');
            server.loadModule(['test']);
            lib.http.request('http://localhost:9999/test.html',{
                onsuccess:function(xhr,data){
                    assert.equal(data + '','test2');
                    server.unloadModule(['test']);
                    done();
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
});