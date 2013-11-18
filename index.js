var esprima = require('esprima');
var escodegen = require('escodegen');
var path = require('path');
var fs = require('fs');
var glob = require("glob");
var mkdirp = require("mkdirp");
var os = require("os");


exports.buildPackage = buildPackage;
exports.compilePackage = compileFile;


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

///**
// * Get Package By path
// * @param src
// * @param packages
// * @returns {*}
// */
//function getPackage(src, packages) {
//    var pkgLen = packages.length;
//
//    var absSrc = path.resolve(src);
//    var pkg = null;
//    var pkgi, pkgiPath;
//
//
//    for(var i=0; i < pkgLen; i++) {
//        pkgi = packages[i];
//        pkgiPath = pkgi.ipn ? pkgi.absPath : path.join(pkgi.absPath, pkgi.name);
//        if (0 === absSrc.indexOf(pkgi.absPath)) {
//            pkg = pkgi;
//            break;
//        }
//    }
//
//    return pkg;
//}

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

    if (pkg.ipn) {
        mName = path.join(pkg.name, mName);
    }

    return mName;
}

/**
 * Compile a File
 * @param {Object} options
 * @param {String} options.srcFile file to compile
 * @param {Object} options.package config for package
 * @return {Object}
 */
function compileFile(options) {

    var srcFile = options.srcFile;
    var srcCnt = fs.readFileSync(srcFile, 'utf8');

    var ret = {
        srcCode: srcCnt
    };

    var ast = esprima.parse(srcCnt);

    var kissyAddFunctions = getKISSYAddFunctions(ast);

    if (!kissyAddFunctions.length) {
        ret.isKISSY = false;
    } else {
        kissyAddFunctions.forEach(function(fnAdd){
            fixModule(fnAdd, srcFile, options.package);
        });
        ret.isKISSY = true;
        ret.genCode = escodegen.generate(ast);
        ret.modules = kissyAddFunctions.map(getKissyModuleInfo);
    }

    return ret;
}

/*

{
  files: [{
    filename: '',
    srcFile: '',
    fileType: 'css',
    isKISSY: boolean,
    srcCode: code,
    genCode: code,
  }],
  modules: [{
    'module/name': {
        requires: '',
        file: ''
    }
  }]
}
 */

/**
 * Compile a KISSY Package
 * @param {Object} pkg
 * @param {String} pkg.name Name of Package
 * @param {String} pkg.path Package path in filesystem
 * @param {String} pkg.ignorePackageNameInUri ignore package name
 * @param {String} pkg.ipn same as ignore PackageName
 * @param {String} pkg.charset Charset for package
 * @return {Object} The compile result of package
 */
function compilePackage(pkg) {

    if ('ipn' in pkg) {
    } else if ('ignorePackageNameInUri' in pkg) {
        pkg.ipn = pkg.ignorePackageNameInUri;
    } else {
        pkg.ipn = true;
    }

    var ret = {
        files: [],
        modules: {}
    };

    var src = pkg.path;

    var jsFiles = glob.
        sync('**/*.js', {
            cwd: src
        }).
        map(function(filename){

            var srcFile = path.join(src, filename);

            var mo =  compileFile({
                'srcFile': srcFile,
                'package': pkg
            });

            mo.filename = filename;
            mo.srcFile = srcFile;
            mo.type = 'js';

            return mo;
        });

    ret.files = ret.files.concat(jsFiles);

    var modules = {};

    jsFiles.
        map(function(result){
            return result.modules;
        }).
        reduce(function(prev, current) {
            return prev.concat(current);
        }, []).
        filter(function (m) {
            return m && m.requires && m.requires.length;
        }).
        forEach(function(m) {
            modules[m.name] = {
                requires: m.requires
            }
        });

    ret.modules = modules;

    glob.sync('**/*.css', {
        cwd: src
    }).forEach(function(css) {
        var srcFile = path.join(src, css);

        ret.files.push({
            srcFile: srcFile,
            filename: css,
            type: 'css'
        });
    });

    return ret;
}


/**
 * Build a KISSY Package
 * @param {Object} options
 * @param {Object} options.pkg Config Package
 * @param {String} options.dest Package path in filesystem
 * @param {String} options.depFilename ignore package name
 * @param {String} options.charset charset for output file
 */
function buildPackage(options) {


    var dest = options.dest;

    if (!dest) {
        throw new Error('No dest in options');
    }

    options.depFilename = options.depFilename || 'deps.js';


    var pkgData = compilePackage(options.pkg);


    pkgData.files.forEach(function(file){
        var destFile = path.join(dest, file.filename);

        var code = file.genCode || file.srcCode || null;

        mkdirp.sync(path.dirname(destFile));

        if (code) {
            fs.writeFileSync(destFile, code);
        } else {
            fs.writeFileSync(destFile, fs.readFileSync(file.srcFile));
        }

    });


    if (pkgData.modules) {
        var destDepFile = path.join(dest, options.depFilename);
        var depFile = 'KISSY.config(' +
            JSON.stringify({
                modules: pkgData.modules
            },null, 4) + ');';
        mkdirp.sync(path.dirname(destDepFile));
        fs.writeFileSync(destDepFile, depFile);
    }
}