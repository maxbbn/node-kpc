var esprima = require('esprima');
var escodegen = require('escodegen');
var _ = require('lodash');

var path = require('path');
var fs = require('fs');
var glob = require("glob");
var minimatch = require("minimatch");
var mkdirp = require("mkdirp");
var os = require("os");

var tools = require('./lib/tools.js');

var genOptions = {
    format: {
        newline: os.EOL,
        quotes: 'single'
    },
    comment: false
};


exports.build = build;
exports.compile = compile;
exports.generateDepFile = generateDepFile;

function resolveFiles(files, defaultFile) {
    files = files || defaultFile || '**/*.js';

    if (!(Array.isArray(files) )) {
        files = [files];
    }

    return files.reduce(function(prev, pattern) {
        var matches = glob.sync(pattern).
            filter(function(filename) {
                return /\.js$/.test(filename);
            });
        return prev.concat(matches)

    }, []);
}

function preCompileFile(filename, pkg) {

    var isEntry = pkg.entry ? (_.findIndex(pkg.entry, function(patten){
        return minimatch(filename, patten)
    }) >= 0) : true;

//    console.log(filename, isEntry);


    var mo = {
        filename : filename,
        moduleName: tools.getModuleName(pkg, filename),
        srcFile: path.join(pkg.path, filename),
        realFilename: filename,
        isEntry: isEntry
    };

    mo.srcCode = fs.readFileSync(mo.srcFile, 'utf8');

    mo.ast = esprima.parse(mo.srcCode);
    mo.astAddFunctions = tools.getKISSYAddFunctions(mo.ast);

    mo.isKISSY = mo.astAddFunctions.length > 0;

    return mo;
}

/**
 * Compile a File
 * @param {Object} mo
 * @param {String} mo.srcFile file to compile
 * @param {String} mo.mapFilename file to compile
 * @param {String} mo.moduleName KISSY module name
 * @param {String} mo.mapModuleName KISSY module name map
 * @param {String} mo.filename file to compile
 * @param {String} mo.astAddFunctions ast function of all KISSY.add
 * @param {String} mo.ast ast of file
 * @param {Object} pkg config for package
 * @return {Object}
 */
function compileFile(mo, pkg) {

    mo.modules = mo.astAddFunctions.map(function(fnAdd) {
        return tools.fixModuleName(fnAdd, mo, pkg);
    });

    if (mo.mapFilename) {
        mo.filename = mo.mapFilename;
    }

    var comment = '/**' + os.EOL;

    comment += ' * Generate by node-kpc' + os.EOL;

    if (mo.mapFilename) {
        comment += ' * map from ' + mo.realFilename + os.EOL;
    }
    comment += ' */' + os.EOL;

    mo.genCode = comment + escodegen.generate(mo.ast, genOptions);

    return mo;
}

function findAllNOEntryModule(mo, fileMap) {
    var all = [];

    function scan(mo){
        var requiredModuleName = mo.modules.reduce(function(out, item){
            return out.concat(item.requires);
        }, []);

        var subModules = requiredModuleName.
            map(function(name){
                return fileMap[tools.resolveModuleName(name, mo)];
            }).
            filter(function(mo){
                return mo && !mo.isEntry && (all.indexOf(mo) === -1);
            });
        all = all.concat(subModules);

        return subModules.forEach(function(mo) {
            scan(mo);
        });
    }

    scan(mo);

    return all;


}


/**
 * after CompileFile a File
 *  - File concat
 *  - Remove no entry module in requires
 * @param {Object} mo
 * @param {String} mo.modules requires of module
 * @param {String} mo.genCode generated Code
 * @param {Object} fileMap
 * @param {Object} pkg
 * @return {Object}
 */
function afterCompileFile(mo, fileMap, pkg) {

    if (mo.isEntry && mo.isKISSY) {
        var appendList = findAllNOEntryModule(mo, fileMap);

        // 合并 require 的非entry文件
        if (appendList.length) {
            appendList.push(mo);
            mo.genCode  = appendList.map(function(mo){
                return mo.genCode;
            }).join(os.EOL);
        }
        // 合并require的非entry文件的require, 到入口模块的map
        var submoduleRequires = [];
        appendList.forEach(function(mo){
            mo.modules.forEach(function(module){
                submoduleRequires = submoduleRequires.concat(module.requires.map(function(moduleName){
                    return tools.resolveModuleName(moduleName, mo);
                }));
            });
        });

        mo.modules[0].requires = _.uniq(mo.modules[0].requires.concat(submoduleRequires));

        // remove no entry module from map

    }




    return mo;
}

/**
 * Generate unique module name
 */
var generateModuleName = (function(prefix) {
    prefix = prefix || '_';
    var index = 0;
    return function() {
        var name = prefix + index.toString(32);
        index += 1;
        return name;
    }
});

/**
 * Compile a KISSY Package
 * @param {Object} pkg
 * @param {String} pkg.name Name of Package
 * @param {String} pkg.path Package path in filesystem
 * @param {String} pkg.flatten Package path in filesystem
 * @param {Array} files optional files to analytic
 * @return {Object} The compile result of package
 */
function compile(pkg, files) {

    var ret = {};

    var flatten = pkg.flatten;
    var genName = generateModuleName('_');
    var genName2 = generateModuleName('__');

    var pkgPath = pkg.path;
    var ignoredFiles = [];

    var entry;

    if (pkg.entry) {
        if (_.isString(pkg.entry)) {
            entry = [pkg.entry];
        } else if(!_.isArray(pkg.entry)) {
            throw new Error('pkg.entry is not an array or string');
        }
    }

    files = resolveFiles(files, path.join(pkgPath, '**/*')).
        map(function(file){
            return path.relative(pkgPath, file);
        }).
        filter(function(filename){
            var isPkgFile = !(/^\.\./).test(filename);
            if (!isPkgFile) {
                ignoredFiles.push({
                    filename: filename,
                    srcFile: path.join(pkgPath, filename)
                });
            }
            return isPkgFile;
        });


    // preCompile
    ret.files = files.
        map(function(filename) {
            try {
                var mo = preCompileFile(filename, pkg);
            } catch (e) {
                e.filename = filename;
                throw(e);
            }

            if (flatten && mo.isKISSY) {
                mo.mapFilename = (mo.isEntry ? genName() : genName2()) + '.js';
                mo.mapModuleName = tools.getModuleName(pkg, mo.mapFilename);
            }

            return mo;
        });

    pkg.alias = ret.files.reduce(function(prev, mo){
        if (mo.mapModuleName) {
            prev[mo.moduleName] = mo.mapModuleName;
        }
        return prev;
    }, {});

    // compile
    ret.files = ret.files.map(function (mo) {
        if (!mo.isKISSY) {
            return mo;
        }

        try {
            return compileFile(mo, pkg);
        } catch(e) {
            e.filename = mo.realFilename;
            throw(e);
        }

    });

    // afterCompile
    var moduleMap = ret.files.reduce(function(prev, mo) {
        prev[mo.mapModuleName || mo.moduleName] = mo;
        return prev;
    }, {});

    ret.files = ret.files.map(function(mo) {
        return afterCompileFile(mo, moduleMap, pkg);
    }).filter(function(mo){
        return mo.isEntry;
    }).
        map(function(mo) {
            if (mo.modules) {
                mo.modules = mo.modules.
                    map(function(module) {
                        module.requires = module.requires.filter(function(name){
                            name = tools.resolveModuleName(name, mo);
                            return !moduleMap[name] || moduleMap[name].isEntry;
                        });

                        return module;
                    });
            }
            return mo
        })


    ret.ignoredFiles = ignoredFiles;

    var modules = {};

    //generate Modules' require
    ret.files.
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
                requires: m.requires,
            }
        });

    //generate Modules' alias

    ret.files.forEach(function(mo){
        if (mo.mapModuleName) {
            modules[mo.moduleName] = {
                alias: mo.mapModuleName
            };
        }
    });

    ret.modules = modules;

    return ret;
}

/**
 * Generate dep map file from modules;
 * @param {Array} modules Array of all module dependence
 */
function  generateDepFile(modules) {

    var codeBase = "KISSY.config('modules');";
    var modulesAst = esprima.parse(codeBase);

    modulesAst.body[0].expression.arguments.push(tools.toAst(modules));

    return "/** Generated by node-kpc **/" + os.EOL +
        escodegen.generate(modulesAst, genOptions);
}


/**
 * Build a KISSY Package
 * @param {Object} options
 * @param {Object} options.pkg Config Package
 * @param {String} options.dest Package path in filesystem
 * @param {String} options.depFile filename for dep file
 * @param {String} options.entry entry point
 * @param {Array|String}  files Files to compile
 * @return {Object} the package compiled
 */
function build(options, files) {

    var dest = options.dest;

    if (!dest) {
        throw new Error('No dest in options');
    }

    files = resolveFiles(files);

    var pkgData = compile(options.pkg, files);


    pkgData.files.forEach(function(file) {
        var destFile = path.join(dest, file.filename);

        var code = file.genCode || file.srcCode || null;

        mkdirp.sync(path.dirname(destFile));

        if (code) {
            fs.writeFileSync(destFile, code);
        } else {
            fs.writeFileSync(destFile, fs.readFileSync(file.srcFile));
        }
    });


    if (pkgData.modules && options.depFile) {
        var depFileCnt = generateDepFile(pkgData.modules);
        mkdirp.sync(path.dirname(options.depFile));
        fs.writeFileSync(options.depFile, depFileCnt);
    }

    return pkgData;
}