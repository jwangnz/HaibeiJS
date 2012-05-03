var na = window.navigator,
    ua = na.userAgent.toLowerCase(),
    browserTester = /(msie|webkit|gecko|presto|opera|safari|firefox|chrome|maxthon)[ \/]([\d.]+)/ig,

    Browser = {
        platform: na.platform
    };

ua.replace(browserTester, function(a, b, c) {
    var bLower = b.toLowerCase();
    Browser[bLower] = c;
});

if (Browser.opera) { //Opera9.8后版本号位置变化
    ua.replace(/opera.*version\/([\d.]+)/, function(a, b) {
        Browser.opera = b;
    });
}

if (Browser.msie) {
    Browser.ie = Browser.msie;
    var v = parseInt(Browser.msie, 10);
    Browser['ie' + v] = true;
}

if (Browser.safari && Browser.chrome ){
    Browser.safari = false;
}

if (Browser.ie) {
    try {
        document.execCommand("BackgroundImageCache", false, true);
    } catch (e) {}
}

module.exports = Browser;
