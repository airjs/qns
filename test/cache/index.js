/**
 * 测试cache get, set, expires
 *
 */

var should = require('should');

var Cache = require('../../cache');

var apis = ['set', 'get', 'isAboutToExpired'];

// only formatted vals could be cached
var format = function(obj){
    return JSON.parse(JSON.stringify(obj));
};

var like = function (target, source) {
    var type = typeof source;

    if(type !== typeof target){
        return false;
    }

    if(type !== 'object'){
        return target === source;
    }

    for (var p in source) {
        if (!like(target[p], source[p])) {
            return false;
        }
    }
    return true;
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
        expires: 2
    },
    {
        key: 'c',
        val: {
            son: {
                name: 'who?'
            }
        },
        expires: 13
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
        cache.set(testCase.key, testCase.val, {
            expires: testCase.expires
        });
    });

    describe('#set(), #get()', function(done){
        it('should set successfully & get right value', function(){
            testCases.forEach(function(testCase, i){
                var a = format(testCase.val),
                    b = cache.get(testCase.key),
                    right;
                switch(typeof a){
                case 'object':
                    right = like(a, b);
                    break;
                default:
                    right = a === b;
                }
                right.should.equal(true);
            });
        });
    });
});
