// Legacy window.K
define(function(require, exports, module) {

    var Util = require('Util'),
        AutoLoader = require('AutoLoader'),
        Pubsub = require('Pubsub'),
        Resource = require('Resource'),
        DomReady = require('DomReady'),
        App = require('App'),
        Cookie = require('Cookie'),
        doT = require('doT'),
        Browser = require('Browser');

    var K = {};

    // ENV
    K.__env = '{_ENV_}';
    K.__debug = K.__env !== "production";
    K.Env = {};

    // App
    K.App = App;

    // K.Browser
    K.Browser = Browser;

    // 自动加载
    AutoLoader.init();

    // Pubsub
    K.Pubsub = K.extend(Pubsub, {
        un: function() {
            this.off.apply(this, arguments);
        },

        fire: function() {
            this.trigger.apply(this, arguments);
        }
    });
    Util.extend(K, (new K.Pubsub()));

    // CustEvent
    K.CustEvent = {
        createEvents: function(obj, events) {
            events = (typeof events === 'string') ? events.split(',') : events;
            Util.extend(obj, new K.Pubsub());
        }
    };

    // Module
    K.Module = {
        waiting: function() {
            return define.__debugInfo.waitings;
        },

        defined: function() {
            return define.__debugInfo.modules;
        }
    };

    // Resource
    K.Resource = {};
    K.Resource.addResourceMap = Resource.addResourceMap;
    K.Resource.loadCSS = Resource.loadCSS;
    K.Resource.loadJS = Resource.loadJS;
    K.Resource.setBasePath = Resource.setBaseURI;
    K.Resource.addResourceDepends = function() {};

    // 工具方法
    Util.extend(K, Util);
    K.mix = Util.extend;

    K.extend = function(klass, proto) {
        var T = function() {}; //构造prototype-chain
        T.prototype = proto.prototype;

        var klassProto = klass.prototype;

        klass.prototype = new T();
        klass.$super = proto; //在构造器内可以通过arguments.callee.$super执行父类构造

        //如果原始类型的prototype上有方法，先copy
        K.mix(klass.prototype, klassProto, true);

        return klass;
    };

    K.create = Object.create || function(proto, props) {
        var ctor = function(ps) {
            if (ps) {
                K.mix(this, ps, true);
            }
        };
        ctor.prototype = proto;
        return new ctor(props);
    };

    K.trim = function(str) {
        return str.replace(/^[\s\xa0\u3000]+|[\u3000\xa0\s]+$/g, "");
    };

    // 得到字节长度
    K.byteLen = function(str) {
        return str.replace(/[^\x00-\xff]/g, "--").length;
    };

    // 得到指定字节长度的子字符串
    K.subByte = function(str, len, tail) {
        if (K.byteLen(str) <= len) {
            return str;
        }
        tail = tail || '';
        len -= K.byteLen(tail);
        return str.substr(0, len).replace(/([^\x00-\xff])/g, "$1 ") //双字节字符替换成两个
            .substr(0, len) // 截取长度
            .replace(/[^\x00-\xff]$/, "") //去掉临界双字节字符
            .replace(/([^\x00-\xff]) /g, "$1") + tail; //还原
    };

    // 字符串为javascript转码
    K.encode4JS = function(str) {
        return str.replace(/\\/g, "\\u005C")
            .replace(/"/g, "\\u0022")
            .replace(/'/g, "\\u0027")
            .replace(/\//g, "\\u002F")
            .replace(/\r/g, "\\u000A")
            .replace(/\n/g, "\\u000D")
            .replace(/\t/g, "\\u0009");
    };

    // 为http的不可见字符、不安全字符、保留字符作转码
    K.encode4HTTP = function(str) {
        return str.replace(/[\u0000-\u0020\u0080-\u00ff\s"'#\/\|\\%<>\[\]\{\}\^~;\?\:@=&]/, function(s) {
            return encodeURIComponent(s);
            });
    };

    /**
     * 字符串为Html转码
     * @method encode4Html
     * @static
     * @param {String} s 字符串
     * @return {String} 返回处理后的字符串
     * @example
     var s="<div>dd";
     alert(encode4Html(s));
     */
    K.encode4Html = function(s){
        return s.replace(/&(?!\w+;|#\d+;|#x[\da-f]+;)/gi, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;').replace(/\//g,'&#x2F;');
    };

    /**
     * 字符串为Html的value值转码
     * @method encode4HtmlValue
     * @static
     * @param {String} s 字符串
     * @return {String} 返回处理后的字符串
     * @example:
     var s="<div>\"\'ddd";
     alert("<input value='"+encode4HtmlValue(s)+"'>");
     */
    K.encode4HtmlValue = function(s) {
        return K.encode4Html(s).replace(/"/g,"&quot;").replace(/'/g,"&#039;");
    };

    // 将所有tag标签消除，即去除<tag>，以及</tag>
    K.stripTags = function(str) {
        return str.replace(/<[^>]*>/gi, '');
    };

    // K.read
    K.ready = DomReady.ready;

    // K.load
    var isWindowLoaded = false;
    var onloadHandler = function() {
        isWindowLoaded = true;
        K.fire('Onload:Loaded');
    };
    if (document.addEventListener) {
        window.addEventListener( 'load', onloadHandler, false );
    } else {
        window.attachEvent( "onload", onloadHandler );
    }
    K.load = function(callback) {
        if (isWindowLoaded) {
            callback();
        } else {
            K.on('Onload:Loaded', callback);
        }
    };

    // Performance
    K.Performance = { timing: {} };
    var performance = window.performance || window.msPerformance || window.webkitPerformance || window.mozPerformance;
    if (performance && performance.timing) {
        K.Performance.timing = performance.timing;
    } else {
        K.Performance.timing.responseStart = K.global.pageStart;
        K.ready(function() {
            K.Performance.timing.domContentLoadedEventStart = (new Date()).getTime();
        });
        K.load(function() {
            K.Performance.timing.loadEventStart = (new Date()).getTime();
        });
    }

    // Log
    K.log = function() {
        if (! K.__debug) {
            return;
        }
        if ('console' in window && 'log' in window.console) {
            var len = arguments.length;
            if (len == 1) {
                window.console.log(arguments[0]);
            } else if (len == 2) {
                window.console.log(arguments[0], arguments[1]);
            }
        } else if (window.opera && window.opera.postError) {
            window.opera.postError.apply(window.opera, arguments);
        }
    };

    // 导出
    window.doT = doT;
    window.Cookie = Cookie;

    module.exports = K;
});

window.K = require('K');
