var fns = [],
    fn,
    f = false,
    doc = document,
    testEl = doc.documentElement,
    hack = testEl.doScroll,
    domContentLoaded = 'DOMContentLoaded',
    addEventListener = 'addEventListener',
    onreadystatechange = 'onreadystatechange',
    readyState = 'readyState',
    loaded = /^loade|c/.test(doc[readyState]);

var flush = function(f) {
    loaded = 1;
    while (f = fns.shift()) {
        f();
    }
};

if (doc[addEventListener]) {
    doc[addEventListener](domContentLoaded, fn = function () {
        doc.removeEventListener(domContentLoaded, fn, f);
        flush();
    }, f);
}

if (hack) {
    doc.attachEvent(onreadystatechange, fn = function () {
        if (/^c/.test(doc[readyState])) {
            doc.detachEvent(onreadystatechange, fn);
            flush();
        }
    });
}

var ready = function(fn) {
    if (loaded) {
        fn();
    } else {
        fns.push(fn);
    }
};
if (hack && self == top) {
    ready = function(fn) {
        try {
            testEl.doScroll('left');
        } catch (e) {
            return setTimeout(function() {
                ready(fn);
            }, 50);
        }
        fn();
    };
}

exports.ready = ready;
