var path = require('path');
var esprima = require('esprima');
var _ = require('lodash');
var eswalker = require('eswalker');



function joinModulePath() {
    var ret =  path.join.apply(path, arguments);

    if (path.sep === '\\') {
        ret = ret.replace(/\\/g, '/');
    }

    return ret;
}

/**
 * get Module Name by Path
 * @param {Object} pkg
 * @param {String} filename
 * @param {String} rel
 * @optional
 * @returns {*}
 */
function getModuleName(pkg, filename, rel) {
    var absPkgPath = path.resolve(pkg.path);
    var absSrcPath = path.resolve(pkg.path, filename);

    if (rel) {
        absSrcPath = path.join(absSrcPath, rel);
    }

    if (0 !== absSrcPath.indexOf(absPkgPath)) {
        throw new Error('文件在包外');
    }

    // remove.js
    var dir = path.dirname(absSrcPath);
    var base = path.basename(absSrcPath, '.js');
    absSrcPath = path.join(dir, base);
    var mName = path.relative(absPkgPath, absSrcPath);

    mName = joinModulePath(pkg.name, mName);

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
        throw new Error('No module name found.');
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

    var walker = eswalker.createWalker();
    var nodes = [];

    walker.enterCallExpression = function(node, parent, filedName, siblings, index){
        if (node.callee.name === 'require' && node.arguments[0] && node.arguments[0].type === "Literal") {
            nodes.push(node.arguments[0]);
        }
    };

    walker.walkElement(ast, null, '');

    return nodes;
}


function checkKISSYRequire(factory, mo, pkg) {
    var nodes =  getRequiresFromFactory(factory);

    return nodes.map(function(node){
        var moduleName = node.value;
        var newName = modifyRequire(moduleName, mo, pkg);
        node.value = newName;
        return newName;
    });
}

function resolveModuleName(moduleName, mo) {
    // mo.moduleName foo/bar/index
    // './baz' > 'foo/bar/baz'
    // './baz.js' > 'foo/bar/baz'
    // './baz/' > 'foo/bar/baz/index'
    // '../baz/' > 'foo/baz/index'
    if(0 === moduleName.indexOf('.')) {
        moduleName = joinModulePath(mo.moduleName, '..' ,moduleName);
    }

    return moduleName.replace(/\/$/, '/index').replace(/\.js$/, '');
}

function modifyRequire(moduleName, mo, pkg) {

    if (!pkg.flatten) {
        return moduleName;
    }

    var alias = pkg.alias;

    var newName = resolveModuleName(moduleName, mo);

    // 使用压缩后的模块名
    if (alias) {
        var aliasName = alias[newName];
        if (aliasName) {
            return aliasName;
        }
    }
    return newName;

}
/**
 * Fix name of module and requires
 * @param {Object} astAdd
 * @param {Object} mo
 * @param {Object} pkg
 * @returns {*}
 */
function fixModuleName(astAdd, mo, pkg) {

    var callExpression = astAdd.expression;
    var args = callExpression.arguments;


    var name, fac, config, requires, moduleRequires = [];

    if (!args.length) {
        return astAdd;
    }

    if (args.length === 3) {
        name = args[0];
        fac = args[1];
        config = args[2];
    }

    if (args.length === 2 && args[0].type === esprima.Syntax.Literal) {

        name = args[0];
        fac = args[1];

    } else if (args[0].type === esprima.Syntax.FunctionExpression || args.length === 1) {

        fac = args[0];
        config = args[1];
    }

    var newArgs = [];

    // 模块名
    if (!name) {
        name = toAst(mo.mapModuleName || mo.moduleName);
    } else {
        if (mo.mapModuleName && astToJS(name) === mo.moduleName) {
            name = toAst(mo.mapModuleName);
        }
    }

    newArgs.push(name);

    // name, requires, factory --> name, factory, config
    if (fac.type === esprima.Syntax.ArrayExpression && config && config.type !== esprima.Syntax.ObjectExpression) {
        var temp = fac;
        fac = config;
        config = temp;

        config.elements.map(function(element) {
            if (element.type === esprima.Syntax.Literal) {
                element.value = modifyRequire(element.value, mo, pkg)
            }
        });

        requires = config;

    }
    // 提取 CMD 依赖
    if(fac.type === esprima.Syntax.FunctionExpression) {
        var requiresFromFactory = checkKISSYRequire(fac, mo, pkg);

        if(!config && requiresFromFactory.length) {
            requires = toAst(requiresFromFactory);
        }
    }

    if (requires) {
        newArgs.push(requires);
        moduleRequires = astToJS(requires);
    }

    newArgs.push(fac);

    // 处理依赖 AMD
    if (!requires && config) {
        if (config.type === esprima.Syntax.ObjectExpression) {

            var astRequire = _.find(config.properties, function (p) {
                return p.key.name === 'requires'
            });

            if (astRequire && astRequire.value.type === esprima.Syntax.ArrayExpression) {
                moduleRequires = astToJS(astRequire.value).map(function (r) {
                    return modifyRequire(r, mo, pkg);
                });
                astRequire.value = toAst(moduleRequires);
            }
        }

        newArgs.push(config);
    }


    callExpression.arguments = newArgs;

    return {
        name: astToJS(name),
        requires: moduleRequires || []
    };
}

exports.getKISSYAddFunctions = getKISSYAddFunctions;
exports.getKissyModuleInfo = getKissyModuleInfo;
exports.astToJS = astToJS;
exports.toAst = toAst;
exports.fixModuleName = fixModuleName;
exports.getModuleName = getModuleName;
exports.resolveModuleName = resolveModuleName;
