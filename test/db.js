/**
 * 测试加载一个新模块和卸载一个老模块时的自动更新功能
 *
 */
var lib = require('qiyilib');
var Path = require('path');
var childProcess = require('child_process');
var Server = require('../src/server');

var assert = require('assert');

var log = require('loglevel');
log.disableAll();
var server = new Server({port:9999});
describe('read and write', function(){
    var db = server.db();
    var model;
    before(function(done){
        db.connect('mongodb://115.28.35.2/test',function(){
            model = db.model('persons',{name:String});
            db.model('animal',{name:String});
            done();
        });
    });
    after(function(){
        db.disconnect();
    });
    beforeEach(function(done){
        this.timeout(0);
        model.remove(function(){
            done();
        });
    });
    it('add one item', function(done){
        model.add({name:'marry'});
        model.save(function(){
            model.find({name:'marry'},function(err,persons){
                if (persons.length > 0) {
                    assert.equal('marry', persons[0].name);
                    done();
                }
            });
        });
    });
    it('add one item with callback', function(done){
        model.add({name:'marry'},function(){
            model.find({name:'marry'},function(err,persons){
                assert.equal(1, persons.length);
                assert.equal('marry', persons[0].name);
                done();
            });
        });
    });
    it('add multi items', function(done){
        model.add({name:'marry0'});
        model.add({name:'marry1'});
        model.add({name:'marry2'});
        model.add({name:'marry3'});
        model.save(function(){
            model.find({name:/^marry[0-3]/},function(err,persons){
                assert.equal(4, persons.length);
                done();
            });
        });
    });
    it('update one item', function(done){
        model.add({name:'marry'});
        model.save(function(){
            model.find({name:'marry'},function(err,persons){
                assert.equal(1, persons.length);
                assert.equal('marry', persons[0].name);
                model.update({name:'marry'},{name:'marry2'});
                model.save(function(){
                    model.find({name:'marry2'},function(err,persons){
                        assert.equal(1, persons.length);
                        done();
                    });
                });
            });
        });
    });
    it('update one item with callback', function(done){
        model.add({name:'marry'});
        model.save(function(){
            model.find({name:'marry'},function(err,persons){
                assert.equal(1, persons.length);
                assert.equal('marry', persons[0].name);
                model.update({name:'marry'},{name:'marry2'},function(){
                    model.find({name:'marry2'},function(err,persons){
                        assert.equal(1, persons.length);
                        done();
                    });
                });
            });
        });
    });
    it('update multi item', function(done){
        model.add({name:'marry'});
        model.add({name:'marry'});
        model.add({name:'marry'});
        model.add({name:'marry'});
        model.save(function(){
            model.find({name:'marry'},function(err,persons){
                assert.equal(4, persons.length);
                model.update({name:'marry'},{name:'mark'},{multi:true});
                model.save(function(){
                    model.find({name:'mark'},function(err,persons){
                        assert.equal(4, persons.length);
                        done();
                    });
                });
            });
        });
    });
    it('remove item', function(done){
        model.add({name:'marry'},function(){
            model.find({name:'marry'},function(err,persons){
                assert.equal(1,persons.length);
                assert.equal('marry',persons[0].name);
                model.remove({name:'marry'});
                model.save(function(err){
                    model.find({name:'marry'},function(err,persons){
                        assert.equal(0, persons.length);
                        done();
                    });
                });
            });
        });
    });
    it('remove item with callback', function(done){
        model.add({name:'marry'},function(){
            model.find({name:'marry'},function(err,persons){
                assert.equal(1,persons.length);
                assert.equal('marry',persons[0].name);
                model.remove({name:'marry'},function(err){
                    model.find({name:'marry'},function(err,persons){
                        assert.equal(0, persons.length);
                        done();
                    });
                });
            });
        });
    });
    it('remove one item in model', function(done){
        model.add({name:'marry0'});
        model.add({name:'marry1'});
        model.add({name:'marry2'});
        model.add({name:'marry3'});
        model.save(function(){
            model.find({name:/^marry[0-3]/},function(err,persons){
                assert.equal(4, persons.length);
                model.remove({name:'marry2'},function(){
                    model.find({name:/^marry[0-3]/},function(err,persons){
                        assert.equal(3, persons.length);
                        persons.sort(function(a,b){
                            if(a.name > b.name){
                                return 1;
                            }
                            else if(a.name < b.name){
                                return -1;
                            }
                        });
                        assert.equal('marry0', persons[0].name);
                        assert.equal('marry1', persons[1].name);
                        assert.equal('marry3', persons[2].name);
                        done();
                    })
                });
            });
        });
    });
    it('remove all', function(done){
        model.add({name:'marry0'});
        model.add({name:'marry1'});
        model.add({name:'marry2'});
        model.add({name:'marry3'});
        model.save(function(){
            model.find({name:/^marry[0-3]/},function(err,persons){
                assert.equal(4, persons.length);
                model.remove(function(){
                    model.find({name:/^marry[0-3]/},function(err,persons){
                        assert.equal(0, persons.length);
                        done();
                    })
                });
            });
        });
    });
    it('switch model', function(done){
        model.add({name:'marry'},function(){
            model = db.use('animal');
            model.find({name:'marry'},function(err,persons){
                assert.equal(0,persons.length);
                done();
            });
        });
    });
});