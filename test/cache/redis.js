/**
 * 测试redis get, set, expires
 * 
 * use:
 *      $mocha --timeout 20000 test/cache/redis.js
 *      * 20000 could be some other value depends on testCases.expires
 * otherwise mocha will throw:
 *      Error: timeout of 2000ms exceeded
 */

var should = require('should');

var redis = require('../../cache/redis');

var apis = ['set', 'get', 'isAboutToExpired'];

var aboutToExpiredTime = 10 * 1000; // millisecond

var testCases = [
    {
        key: 'a',
        val: {
            name: 'a'
        },
        expires: 1
    },
    {
        key: 'b',
        val: {
            num: 1
        },
        expires: 3
    },
    {
        key: 'c',
        val: {
            son: {
                name: 'who?'
            }
        },
        expires: 11
    }
];

describe('redis', function(){
    testCases.forEach(function(testCase, i){
        if(i!=1){
            return;
        }
        describe('#set() ' + i, function(){
            it('should set successfully', function(done){
                redis.set(testCase.key, JSON.stringify(testCase.val), testCase.expires, function(err, reply){
                    (!err).should.be.true;
                    done();
                });
                testCase.expireAt = Date.now() + testCase.expires * 1000;
            });
        });

        describe('#get() ' + i, function(){
            it('should get right value', function(done){
                var a = JSON.stringify(testCase.val);
                redis.get(testCase.key, function(err, b){
                    a.should.equal(b);
                    done();
                });
            });
        });

        describe('#isAboutToExpired ' + i, function(){
            it('should get right value now', function(done){
                setTimeout(function(){
                    var t = Date.now();
                    var isAboutToExpired = t + aboutToExpiredTime > testCase.expireAt && t < testCase.expireAt;
                    redis.isAboutToExpired(testCase.key, function(err, b){
                        (!err && b === isAboutToExpired).should.be.true;
                        done();
                    });
                }, 0);
            });
        });

        describe('#isAboutToExpired ' + i, function(){
            it('should get right value 2s later', function(done){
                setTimeout(function(){
                    var t = Date.now();
                    var isAboutToExpired = t + aboutToExpiredTime > testCase.expireAt && t < testCase.expireAt;
                    redis.isAboutToExpired(testCase.key, function(err, b){
                        (!err && b === isAboutToExpired).should.be.true;
                        done();
                    });
                }, 2000);
            });
        });

        describe('#expires ' + i, function(){
            it('should get nil value', function(done){
                setTimeout(function(){
                    redis.get(testCase.key, function(err, b){
                        (b === null).should.be.true;
                        done();
                    });
                }, testCase.expires * 1000);
            });
        });
    });
});
