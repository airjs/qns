/**
 * 测试cache get, set, expires
 *
* use:
 *      $mocha --timeout 20000 test/cache/redis.js
 *      * 20000 could be some other value depends on testCases.expires
 * otherwise mocha will throw:
 *      Error: timeout of 2000ms exceeded
 */

var should = require('should');

var Cache = require('../../cache');

var apis = ['set', 'get', 'isAboutToExpired'];

// only formatted vals could be cached
var format = function(obj){
    return JSON.parse(JSON.stringify(obj));
};

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
            },
            say: function(){}
        },
        expires: 11
    }
];

describe('Cache', function(){
    var cache = new Cache();

    describe('#new', function(){

        it('should return a cache object with right apis', function () {
            cache.should.have.properties(apis);
        });

    });

    testCases.forEach(function(testCase, i){

        describe('#set(), #get() ' + i, function(){
            cache.set(testCase.key, testCase.val, {
                expires: testCase.expires
            });
            testCase.expireAt = Date.now() + testCase.expires * 1000;

            it('should set successfully & get right value', function(){
                var a = format(testCase.val),
                    b = cache.get(testCase.key);
                a.should.eql(b);
            });
        });

        describe('#isAboutToExpired ' + i, function(){
            it('should get right value now', function(done){
                var t = Date.now();
                var isAboutToExpired = t + 10000 > testCase.expireAt && t < testCase.expireAt;
                cache.isAboutToExpired(testCase.key).should.equal(isAboutToExpired);
                done();
            });
        });

        describe('#isAboutToExpired ' + i, function(){
            it('should get right value 2s later', function(done){
                setTimeout(function(){
                    var t = Date.now();
                    var isAboutToExpired = t + 10000 > testCase.expireAt && t < testCase.expireAt;
                    cache.isAboutToExpired(testCase.key).should.equal(isAboutToExpired);
                    done();
                }, 2000);
            });
        });
    });
});
