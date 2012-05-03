// 轻量级的 CommonJS Browser Wrapper
(function(global) {

    if (global.define || global.require) {
        return;
    }

    var _modules = {},
        _waitings = {},
        uniqId = 0,
        hasOwnProperty = Object.prototype.hasOwnProperty,
        RELATIVE_IDENTIFIER_PATTERN = /^\.\.?\//;

    var createRequire = function(id, main) {
        var path = id.substring(0, id.lastIndexOf('/') + 1);

        var require = function(identifier) {
            var id = resolveIdentifier(identifier, path),
                mod = _modules[id];

            if (!mod) {
                throw new Error('Require unknown module "' + identifier + '(' + id + ')"');
            }

            if (mod.waiting > 0) {
                throw new Error('Require module "' + identifier + '" with unresolved dependencies');
            }

            if (!mod.exports) {
                var m = {
                    id: id,
                    exports: {}
                };
                var factory = mod.factory;
                if (typeof(factory) === 'function') {
                    var r = createRequire(id, main || m);
                    var ret = factory(r, m.exports, m);
                    if (ret) {
                        m.exports = ret;
                    }
                } else {
                    m.exports = factory;
                }
                mod.exports = m.exports;
            }

            return mod.exports;
        };

        require.async = function(ids, callback) {
            if (typeof(ids) === 'string') {
                ids = [ ids ];
            }
            for (var ii = 0, length = ids.length; ii < length; ii++) {
                ids[ii] = resolveIdentifier(ids[ii], path);
            }
            define(ids, function(require) {
                var modules = [];
                for (var ii = 0, length = ids.length; ii < length; ii++) {
                    modules.push(require(ids[ii]));
                }
                callback.apply(null, modules);
            });
        };

        require.main = main;
        return require;
    };

    // define(id?, dependencies?, factory)
    var define = function(id, dependencies, factory) {
        var anonymous = false;
        var argsLength = arguments.length;
        if (argsLength < 3) {
            anonymous = true;
        }
        if (argsLength == 1) {
            factory = id;
            id = anonymousModuleName();
            dependencies = [];
        } else if (argsLength == 2) {
            factory = dependencies;
            dependencies = id;
            id = anonymousModuleName();
        }
        var mod = {
            id: id,
            factory: factory,
            dependencies: dependencies,
            anonymous: anonymous
        };
        var waiting = 0;
        for (var ii = 0, length = dependencies.length; ii < length; ii++) {
            var dependency = dependencies[ii];
            if (!(dependency in _modules) || _modules[dependency].waiting) {
                waiting++;
                if (!_waitings[dependency]) {
                    _waitings[dependency] = {};
                }
                _waitings[dependency][id] = 1;
            }
        }

        mod.waiting = waiting;
        _modules[id] = mod;

        if (!waiting) {
            resolveDependency(id);
        }
    };

    define._debugInfo = {
        modules: _modules,
        waitings: _waitings
    };

    var anonymousModuleName = function() {
        return '_module_' + (++uniqId);
    };

    var resolveDependency = function(id) {
        var mod = _modules[id];
        if (mod.anonymous && !mod.waiting) {
            require(id);
        }
        var waitings = _waitings[id];
        if (waitings) {
            delete _waitings[id];
            for (var key in waitings) {
                if (hasOwnProperty.call(waitings, key)) {
                    _modules[key].waiting--;
                    if (!_modules[key].waiting) {
                        resolveDependency(key);
                    }
                }
            }
        }
    };

    var resolveIdentifier = function(identifier, dir) {
        var parts, part, path;

        if (! RELATIVE_IDENTIFIER_PATTERN.test(identifier)) {
            return identifier;
        }

        parts = (dir + identifier).split('/');

        path = [];
        for (var ii = 0, length = parts.length; ii < length; ii++) {
            part = parts[ii];
            switch (part) {
                case '':
                case '.':
                    continue;
                case '..':
                    if (path.length) {
                        path.pop();
                    } else {
                        throw new RangeError('Out of bounds identifier: ' + identifier);
                    }
                    break;
                default:
                    path.push(part);
            }
        }
        return path.join('/');
    };


    global.define = define;
    global.require = createRequire('');
})(this);
