var DomReady = require('DomReady'),
    Util = require('Util');

var win = window,
    doc = win.document,
    docElement = doc.documentElement;

var config = {
    attrName: 'data-ajax',
    dialogModule: 'core/ajax/Dialog',
    requestModule: 'core/ajax/Request'
};

var getParentTag = function(node, tagName) {
    tagName = tagName.toUpperCase();
    while (node && node.nodeName != tagName) {
        node = node.parentNode;
    }
    return node;
};

var init = function() {
    var supportSubmitBubble = (function() {
        var el = doc.createElement("div");
        var support = ('onsubmit' in el);
        if (! support) {
            el.setAttribute('onsubmit', "return;");
            support = typeof el.onsubmit === 'function';
        }
        return support;
    })();

    docElement.onclick = function(event) {
        event = event || win.event;
        target = event.target || event.srcElement;

        if (!supportSubmitBubble) {
            var type = target.type;
            if (type == 'submit' || type == 'image') {
                return delegateSubmit(target);
            }
        }

        var href = target.href;
        if (href && !/#$/.test(href)) {
            var notClick = (event.which && event.which != 1),
                specialKey = (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey);

            if (notClick || specialKey) {
                return;
            }
        }

        var container = getParentTag(target, 'A') || target;
        var ajax = container.getAttribute(config.attrName);
        if (ajax && ajax.length) {
            href = container.getAttribute(config.attrName + '-url') || container.href;
            switch (ajax) {
                case 'dialog-post':
                case 'dialog':
                    require.async(config.dialogModule, function(Dialog) {
                        Dialog.load(href, container);
                    });
                    break;
                case 'request-post':
                case 'request':
                    require.async(config.requestModule, function(Request) {
                        Request.load(href, container);
                    });
                    break;
                default:
                    return;
            }
            return false;
        }
    };
};

exports.init = function(cfg) {
    Util.extend(config, cfg);
    init();
};
