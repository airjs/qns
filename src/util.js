var Util = {
    exportMethods:function(from,to,methods){
        //导出公共方法
        var methods = ['start','get','unget','post','unpost'];
        methods.forEach(function(methodName){
          to[methodName] = function(){
            return from[methodName].apply(from,arguments);
          }
        });
    }
};