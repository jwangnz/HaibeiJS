var Util = require('./Util'),
    DomReady = require('./DomReady');

var appMap = {},
    uniqId = 0;

var DomModule = '$';

var eventSpliter = /^([\w\.]+)(?:\s+(.*))?$/;
var bindEvents = function(definition, $, container) {
    var events = definition.events;

    Util.map(events, function(handler, eventStr) {
        var match = eventStr.match(eventSpliter),
            eventName = match[1],
            selector = match[2],
            method = Util.bind(definition[handler], definition);

        if (!selector) {
            container.bind(eventName, method);
        } else {
            container.delegate(selector, eventName, Util.bind( definition[ handler ], definition));
        }
    });
};

var Application = function(id, dependencies, runImmediately) {
    if (appMap[id]) {
        throw new Error('App "' + id + '" all ready exists');
    }
    appMap[id] = this;

    this.id = id;
    this.dependencies = dependencies;
    this.runImmediately = runImmediately;
    this.config = {};
};

Util.extend(Application.prototype, {
    provide: function(factory) {
        this.factory = factory;
        return this;
    },

    // legacy
    define: function(factory) {
        return this.provide(factory).run();
    },

    run: function(container, config) {
        var me = this;
        require.async(this.dependencies.concat(DomModule), function() {
            var definition = me.factory,
                $ = require(DomModule);

            if (Util.isFunction(definition)) {
                definition = definition.call(null, require);
            }
            if (!definition) {
                // factory没有return
                return;
            }

            var container = container || definition.container;
                container = $(container);
            // definition.container = container;
            definition.getContainer = function() {
                return container;
            };

            var exec = function() {
                if (definition.events) {
                    bindEvents(definition, $, container);
                }
                if (definition.main) {
                    definition.main(config);
                }
            };

            if (me.runImmediately) {
                exec();
            } else {
                DomReady.ready(exec);
            }
        });
        return this;
    }
});


var anonymousAppId = function() {
    return '_app_ ' + (uniqId++);
};

var App = function(id, dependencies) {
    if (!dependencies) {
        if (id) {
            dependencies = id;
        } else {
            dependencies = [];
        }
        id = anonymousAppId();
    }
    return new Application(id, dependencies);
};

App.get = function(id) {
    return appMap[id] || null;
};

App.use = function(id, contianer, config) {
    var app = Util.create(App.get(id));
    return app.run(container, config);
};

module.exports = App;
