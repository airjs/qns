/**
 * 测试加载一个新模块和卸载一个老模块时的自动更新功能
 *
 */
var lib = require('qiyilib');
var Path = require('path');
var childProcess = require('child_process');
var base = '';

var Config = {
    origin:'',
    path:Path.join(base,'conf/default.conf'),
    init:function(){
        var config = lib.fs.readFile(this.path);
        this.origin = config;
    },
    get:function(){
        var config = lib.fs.readFile(this.path);
        return config;
    },
    write:function(config){
        lib.fs.writeFile(this.path,config);
    },
    resume:function(){
        lib.fs.writeFile(this.path,this.origin);
    }
};

var TestModule = {
    modulePath:Path.join(base,'modules/test'),
    add:function(){
        var config = Config.get();
        lib.fs.mkdir(this.modulePath);
        var moduleFilePath = Path.join(this.modulePath,'index.js');
        lib.fs.writeFile(moduleFilePath,'var Test = {init:function(server){server.get("/test.html",this._process)},unload:function(server){server.unget("/test.html",this._process)},_process:function(req,res){res.send("test")}};module.exports = Test;');
        if(!config){
            config = {modules:['test']};
        }
        else{
            config = JSON.parse(config);
            if(!config.modules){
                config.modules = ['test'];
            }
            else{
                if(config.modules.indexOf('test') === -1){
                    config.modules.push('test');
                }
            }
        }
        Config.write(JSON.stringify(config));
    },
    remove:function(){
        Config.resume();
        lib.fs.rm(this.modulePath);
    },
    write:function(content){
        var moduleFilePath = Path.join(this.modulePath,'index.js');
        lib.fs.writeFile(moduleFilePath,'var Test = {init:function(server){server.get("/test.html",this._process)},unload:function(server){server.unget("/test.html",this._process)},_process:function(req,res){res.send("' + content + '")}};module.exports = Test;');
    }
};

Config.init();

describe('Config', function(){
    describe('#addModule', function(){
        it('add and remove a module', function(done){
            lib.http.request('http://localhost:8080/test.html',{
                onsuccess:function(xhr,data){
                    throw 'already exist.';
                },
                onfailure:function(e){
                    TestModule.add();
                    setTimeout(function(){
                        lib.http.request('http://localhost:8080/test.html',{
                            onsuccess:function(xhr,data){
                                TestModule.remove();
                                if(data.toString() != 'test'){
                                    throw 'result error.';
                                }
                                setTimeout(function(){
                                    lib.http.request('http://localhost:8080/test.html',{
                                        onsuccess:function(xhr,data){
                                            throw 'remove error.';
                                        },
                                        onfailure:function(e){
                                            done();
                                        }
                                    });
                                },10000);
                            },
                            onfailure:function(e){
                                TestModule.remove();
                                throw e;
                            }
                        });
                    },10000);
                }
            });
        });
    });
    describe('#moduleAutoReload', function(){
        it('do not auto reload.', function(done){
            var config = Config.get();
            if(config){
                config.moduleAutoReload = false;
                Config.write(JSON.stringify(config));
                TestModule.add();
                setTimeout(function(){
                    TestModule.write('hello');
                    setTimeout(function(){
                        lib.http.request('http://localhost:8080/test.html',{
                            onsuccess:function(xhr,data){
                                if(data.toString() === 'hello'){
                                    throw 'auto reloaded.';
                                }
                                else{
                                    done();
                                }
                            },
                            onfailure:function(e){
                                throw 'load failed.';
                            }
                        });
                    },10000);
                },10000);
            }
        });
    });
});