var Util = require('./Util');

var loadedMap = {},
    loadingMap = {},
    callbacks = [],
    cssLinks = [],
    baseURI = '',
    cssTimer;

var canonicalURI = function(src) {
    if (/^\/\/\/?/.test(src)) {
        src = location.protocol + src;
    }
    return src;
};

var initResourceMap = function() {
    var loadedMap = {};

    var allTags = document.getElementsByTagName('link'),
        len = allTags.length,
        tag;
    while (len) {
        tag = allTags[--len];
        if ((tag.rel === 'stylesheet' || tag.type === 'text/css') && tag.href) {
            loadedMap[canonicalURI(tag.href)] = 1;
        }
    }

    allTags = document.getElementsByTagName('script');
    len = allTags.length;
    while (len) {
        tag = allTags[--len];
        if ((!tag.type || tag.type === 'text/javascript') && tag.src) {
            loadedMap[canonicalURI(tag.src)] = 1;
        }
    }
    return loadedMap;
};


loadedMap = initResourceMap();

var setBaseURI = function(uri) {
    baseURI = uri;
};

var completeLoading = function(uri) {
    var list = callbacks,
        item, ii;

    delete loadingMap[uri];
    loadedMap[uri] = 1;

    // 因为会做splice 所以list.length必须每次重新取
    for (ii = 0; ii < list.length; ii++) {
        item = list[ii];
        if (!item) {
            console.log(list);
            console.log(ii);
            console.log(length);
        }
        delete item.resources[uri];
        if (Util.isEmpty(item.resources)) {
            if (item.callback) {
                item.callback();
            }
            list.splice(ii--, 1);
        }
    }
};

var isWebKit = ~navigator.userAgent.indexOf('AppleWebKit');
var cssPoller = function() {
    var sheets = document.styleSheets,
        ii = sheets.length,
        links = cssLinks;

    while (ii--) {
        var link = sheets[ii],
            ready = false;

        if (isWebKit) {
            ready = true;
        } else {
            try {
                if (link.cssRules) {
                    ready = true;
                }
            } catch (ex) {
                if (ex.code == 1000) {
                    ready = true;
                }
            }
        }

        if (ready) {
            var owner = link.ownerNode || link.owningElement,
            jj = links.length;

            if (owner) {
                while (jj--) {
                    if (owner == links[jj]) {
                        completeLoading(links[jj]['data-href']);
                        links.splice(jj, 1);
                    }
                }
            }
        }
    }

    if (! links.length) {
        clearInterval(cssTimer);
        cssTimer = null;
    }
};

var injectCSS = function(uri) {
    var link = document.createElement('link');
    Util.extend(link, {
        type: 'text/css',
        rel: 'stylesheet',
        href: uri,
        'data-href': uri
    });
    document.getElementsByTagName('head')[0].appendChild(link);

    if (link.attachEvent) {
        var callback = function() {
            completeLoading(uri);
        };
        link.onload = callback;
    } else {
        cssLinks.push(link);
        if (! cssTimer) {
            cssTimer = setInterval(cssPoller, 20);
        }
    }
};

var injectJS = function(uri) {
    var script = document.createElement('script');
    var callback = function() {
        script.onload = script.onerror = script.onreadystatechange = null;
        completeLoading(uri);
    };

    Util.extend(script, {
        type: 'text/javascript',
        src: uri,
        async: true
    });
    script.onload = script.onerror = callback;
    script.onreadystatechange = function() {
        var state = this.readyState;
        if (state == 'complete' || state == 'loaded') {
            callback();
        }
    };
    document.getElementsByTagName('head')[0].appendChild(script);
};

var load = function(uris, callback) {
    var resources = {},
        uri, path, type, ret;

    uris = Util.isArray(uris) ? uris : [ uris ];
    if (!uris.length) {
        setTimeout(callback, 0);
        return;
    }
    for (var ii = 0, length = uris.length; ii < length; ii++) {
        var uri = canonicalURI(uris[ii]);
        resources[uri] = 1;

        if (loadedMap[uri]) {
            setTimeout(Util.bind(completeLoading, null, uri), 0);
        } else if (!loadingMap[uri]) {
            loadingMap[uri] = 1;
            if (uri.indexOf('.css') > -1) {
                injectCSS(uri);
            } else {
                injectJS(uri);
            }
        }
    }

    if (callback) {
        callbacks.push({
            resources: resources,
            callback: callback
        });
    }
};

exports.loadJS = function(uris, callback) {
    load(uris, callback);
};

exports.loadCSS = function(uris, callback) {
    load(uris, callback);
};

exports.setBaseURI = function(uri) {
   setBaseURI(uri);
};
