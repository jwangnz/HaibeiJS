var Util = require('./Util');

var Pubsub = function() {
    this.__callbacks__ = {};
};

Util.extend(Pubsub.prototype, {
    on: function(name, callback, context) {
        if (context) {
            callback = Util.bind(callback, context);
        }

        this.__callbacks__[name] = this.__callbacks__[name] || [];
        this.__callbacks__[name].push(callback);

        return [name, callback];
    },

    off: function(handle) {
        var name = handle[0];
        var callback = handle[1];

        if (name in this.__callbacks__) {
            var callbacks = this.__callbacks__[name];
            Util.forEach(callbacks, function(cb, ii) {
                if (callback == cb) {
                    callbacks[ii] = null;
                }
            });
        }
    },

    once: function(name, callback, context) {
        var me = this;
        var handle = this.on(name, function() {
            callback.apply(context, arguments);
            me.off(handle);
        });
    },

    trigger: function(name/* args */) {
        if (name in this.__callbacks__) {
            var callbacks = this.__callbacks__[name];
            var args = Array.prototype.slice.call(arguments, 1);
            Util.forEach(callbacks, function(callback, ii) {
                if ( typeof(callback) != "function") {
                    return null;
                }
                return callback.apply(null, args);
            });
        }
    }
});

module.exports = Pubsub;

