var path = require('path');
var esprima = require('esprima');

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

    if (0 != absSrcPath.indexOf(absPkgPath)) {
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

    if (!args.length) {
        return null;
    }
    var kModule = {
        name: null,
        requires: []
    };

    if(args[0].type === 'Literal') {
        kModule.requires = args[2] ? transform(args[2]).requires : [];
        kModule.name = args[0].value;
    } else {
        throw new Error('KISSY module has no name!');
    }

    return kModule;
}


/**
 * Turn Ast to Js
 * @param ast
 * @returns {*}
 */
function transform (ast) {
    var result;
    switch (ast.type) {
        case esprima.Syntax.ObjectExpression:
            result = {};
            ast.properties.forEach(function(property) {
                result[property.key.name] = transform(property.value);
            });
            break;
        case esprima.Syntax.ArrayExpression:
            result = ast.elements.map(function (element) {
                return transform(element)
            });
            break;
        case esprima.Syntax.Literal:
            result = ast.value;
            break;
    }
    return result;
}

/**
 * Fix Module
 * @param {Object} astAdd
 * @param {String} srcFile
 * @param {Object} pkg
 * @returns {*}
 */
function fixModule(astAdd, srcFile, pkg) {
    var callExpression = astAdd.expression;
    var args = callExpression.arguments;

    var moduleName = getModuleName(pkg, srcFile);

    if (!args.length) {
        return astAdd;
    }

    if (args[0].type === 'FunctionExpression') {
        args.unshift({
            type: esprima.Syntax.Literal,
            value: moduleName
        });
    }

    return astAdd;
}

exports.getKISSYAddFunctions = getKISSYAddFunctions;
exports.getKissyModuleInfo = getKissyModuleInfo;
exports.transform = transform;
exports.fixModule = fixModule;
