var path = require('path');
var esprima = require('esprima');
var _ = require('lodash');
var escodegen = require('escodegen');

/**
 * get Module Name by Path
 * @param {Object} pkg
 * @param {String} src
 * @param {String} rel
 * @optional
 * @returns {*}
 */
function getModuleName(pkg, src, rel) {
    var absPkgPath = path.resolve(pkg.path);
    var absSrcPath = path.resolve(src);

    if (rel) {
        absSrcPath = path.join(src, rel);
    }

    if (0 !== absSrcPath.indexOf(absPkgPath)) {
        throw new Error('文件在包外');
    }

    // remove.js
    var dir = path.dirname(absSrcPath);
    var base = path.basename(absSrcPath, '.js');
    absSrcPath = path.join(dir, base);
    var mName = path.relative(absPkgPath, absSrcPath);

    mName = path.join(pkg.name, mName);

    return mName;
}

/**
 * Find all KISSY add function call tree;
 * @param ast
 * @returns {Array}
 */
function getKISSYAddFunctions(ast) {
    return ast.body.filter(function(item) {
        return item.type === 'ExpressionStatement' &&
            item.expression.type === 'CallExpression' &&
            item.expression.callee.object &&
            item.expression.callee.object.name === 'KISSY' &&
            item.expression.callee.property &&
            item.expression.callee.property.name === 'add';
    });
}


/**
 * get Module info
 * @param astAdd
 * @returns {*}
 */
function getKissyModuleInfo(astAdd) {
    var callExpression = astAdd.expression;
    var args = callExpression.arguments;

    if (!args.length || args[0].type !== 'Literal') {
        throw new Error('Module Error: without module name');
    }

    var kModule = {
        name: null,
        requires: []
    };
    kModule.name = args[0].value;

    if (args[2] && args[1].type === esprima.Syntax.ArrayExpression) {
        kModule.requires = astToJS(args[1]);
    } else if (args[2] && args[2].type === esprima.Syntax.ObjectExpression ) {
        kModule.requires = astToJS(args[2]).requires;
    }

    if (!kModule.requires) {
        kModule.requires = [];
    }

    return kModule;
}


/**
 * Turn Ast to Js
 * @param ast
 * @returns {*}
 */
function astToJS (ast) {
    var result;
    switch (ast.type) {
        case esprima.Syntax.ObjectExpression:
            result = {};
            ast.properties.forEach(function(property) {
                result[astToJS(property.key)] = astToJS(property.value);
            });
            break;
        case esprima.Syntax.ArrayExpression:
            result = ast.elements.map(function (element) {
                return astToJS(element);
            });
            break;
        case esprima.Syntax.Literal:
            result = ast.value;
            break;
        case esprima.Syntax.Identifier:
            result = ast.name;
            break;
    }
    return result;
}

/**
 * Turn JS value to Ast;
 * @param value
 * @returns {Object}
 */
function toAst(value) {
    var Syntax = esprima.Syntax;

    if ('object' !== typeof value) {
        return {
            type: Syntax.Literal,
            value: value
        };
    }

    if (_.isArray(value)) {
        return {
            "type": Syntax.ArrayExpression,
            "elements": value.map(toAst)
        };
    }

    if (_.isPlainObject(value)) {
        return {
            "type": Syntax.ObjectExpression,
            "properties": _.pairs(value).map(function(pair){
                return {
                    type: Syntax.Property,
                    key: {
                        type: Syntax.Literal,
                        value: pair[0]
                    },
                    value: toAst(pair[1]),
                    kind: 'init'
                };
            })
        };
    }

}


/**
 * get requires from factory
 * @param {Object} ast of function
 * @return {Array} The required modules;
 */
function getRequiresFromFactory(ast) {

    var commentRegExp = /(\/\*([\s\S]*?)\*\/|([^:]|^)\/\/(.*)$)/mg,
        requireRegExp = /[^.'"]\s*require\s*\(([^)]+)\)/g;


    function getRequireVal(str) {
        var m;
        // simple string
        if (!(m = str.match(/^\s*["']([^'"\s]+)["']\s*$/))) {
            console.error('can not find required mod in require call: ' + str);
        }
        return  m[1];
    }


    // from https://github.com/kissyteam/kissy/blob/master/src/seed/src/loader/utils.js
    var requiredModules = [];
    // Remove comments from the callback string,
    // look for require calls, and pull them into the dependencies,
    // but only if there are function args.
    escodegen.generate(ast)
        .replace(commentRegExp, '')
        .replace(requireRegExp, function (match, dep) {
            requiredModules.push(getRequireVal(dep));
        });

    return requiredModules;
}

function checkKISSYRequire(factory, config) {
    var kConfig;
    if (!config && factory.type === esprima.Syntax.FunctionExpression ) {
        var requires = getRequiresFromFactory(factory);
        kConfig = toAst(requires.length? {
            requires: requires
        }:{});
    } else if (config && config.type === esprima.Syntax.ObjectExpression){
        kConfig = config;
    } else {
        kConfig = toAst({});
    }
    return kConfig;
}

/**
 * Fix Module
 * @param {Object} astAdd
 * @param {String} srcFile
 * @param {Object} pkg
 * @returns {*}
 */
function fixModuleName(astAdd, srcFile, pkg) {
    var callExpression = astAdd.expression;
    var args = callExpression.arguments;
    var newArgs = [];

    var moduleName = getModuleName(pkg, srcFile);

    newArgs.push(toAst(moduleName));

    if (!args.length || args.length === 3) {
        return astAdd;
    }

    // KISSY.add(function(){}), KISSY.add('foo');
    if (args[0].type === 'FunctionExpression' || args.length === 1) {
        newArgs.push(args[0]);
        newArgs.push(checkKISSYRequire(args[0], args[1]));
    }

    callExpression.arguments = newArgs;

    return astAdd;
}

exports.getKISSYAddFunctions = getKISSYAddFunctions;
exports.getKissyModuleInfo = getKissyModuleInfo;
exports.astToJS = astToJS;
exports.toAst = toAst;
exports.fixModuleName = fixModuleName;
