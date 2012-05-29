// 解析commonjs的依赖关系
// 包裹上AMD Wrapper
// 重写使用了相对路径的require模块

var uglify = require('uglify-js'),
    processor = uglify.uglify,
    parser = uglify.parser;

var Builder = function(identify, code, config) {
    config = config || {};

    var ast = toAst(code);
    var dependencies = findDependencies(ast);

    if (replaceDefine(ast, identify, dependencies)) {
        code = astToCode(ast, config);
    } else if (replaceApp(ast, identify, dependencies)) {
        code = astToCode(ast, config);
    } else {
        code = astToCode(ast, config);
        code = wrapDefine(ast, identify, dependencies, code);
    }

    return code;
};

var wrapDefine = function(ast, identify, dependencies, code) {
    var walker = processor.ast_walker();

    var defineFuncCall = 0;
    var handleExpr = function(expr, args) {
        if (expr[0] === "name" && expr[1] === "define") {
            defineFuncCall++;
        }
    };

    ast = walker.with_walkers({
        'call': handleExpr
    }, function() {
        return walker.walk(ast);
    });

    if (!defineFuncCall) {
        var dependenciesAst = ['array', dependencies.map(function(dep) {
            return ['string', dep];
        })];
        return 'define("' + identify + '", ' + astToCode(dependenciesAst) + ', function(require, module, exports) {\n' + code + '\n});';
    } else {
        return code;
    }
};

var replaceApp = function(ast, identify, dependencies) {
    var walker = processor.ast_walker();

    var times = 0;
    var result = false;
    var handleExpr = function(dot) {
        if (++times > 1) {
            return;
        }
        if (dot[1][1] && dot[1][1][0] === 'name' && dot[1][1][1] === 'K' &&
            dot[1][2] === 'App') {

            var idAst = ['string', identify],
                dependenciesAst = ['array', dependencies.map(function(dep) {
                    return ['string', dep];
                })];

            var args = dot[2];
            if (args.length === 0) {
                args.unshift(dependenciesAst);
                args.unshift(idAst);
            } else if (args.length === 1) {
                args.unshift(idAst);
                args[1] = dependenciesAst;
            }
            result = true;
            return dot;
        }
    };

    ast = walker.with_walkers({
        'dot': handleExpr
    }, function() {
        return walker.walk(ast);
    });

    return result;
};

var replaceDefine = function(ast, identify, dependencies) {
    var walker = processor.ast_walker();

    var times = 0;
    var result = false;
    var handleExpr = function(stat) {
        if (++times > 1) {
            return;
        }
        if (stat[0] === 'call' &&
            stat[1][0] === 'name' &&
            stat[1][1] === 'define') {

            var idAst = ['string', identify],
                dependenciesAst = ['array', dependencies.map(function(dep) {
                    return ['string', dep];
                })];

            var args = stat[2];
            if (args.length === 1) {
                args.unshift(dependenciesAst);
                args.unshift(idAst);
            } else if (args.length === 2) {
                args.unshift(idAst);
                args[1] = dependenciesAst;
            } else if (args.length === 3) {
                args[0] = idAst;
                args[1] = dependenciesAst;
            }
            result = true;
            return stat;
        }
    };

    ast = walker.with_walkers({
        'stat': handleExpr
    }, function() {
        return walker.walk(ast);
    });

    return result;
};

var astToCode = function(ast, config) {
    return processor.gen_code(ast, config);
};

var toAst = function(code) {
    var ast,
        walker = processor.ast_walker();

    try {
        ast = parser.parse(code);
    } catch (err) {
        console.log(err);
        var syntaxError = new SyntaxError(err.message);
        syntaxError.line = err.line + 1;
        syntaxError.col = err.col;
        syntaxError.pos = err.pos;
        syntaxError.longDesc = syntaxError.toString() + '\n    at ' + syntaxError.line + ':' + syntaxError.col;
        syntaxError.toString = function() {
            return syntaxError.longDesc;
        };
        throw syntaxError;
    }

    return ast;
};

var findDependencies = function(ast) {
    var dependencies = [],
        walker = processor.ast_walker();

    var handleExpr = function(expr, args) {
        if (expr[0] === "name" && expr[1] === "require" && args[0][0] === "string") {
            dependencies.push(args[0][1]);
        }
    };

    walker.with_walkers({
        'new': handleExpr,
        'call': handleExpr
    }, function() {
        return walker.walk(ast);
    });

    return dependencies;
};

exports.build = Builder;
