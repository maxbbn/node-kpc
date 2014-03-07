var expect = require('expect.js');
var nodeKpc = require('..');
var rimraf = require('rimraf');
var glob = require('glob');

var path = require('path');
var fs = require('fs');

function readFile(file, label) {
    return label? (label + require('os').EOL) : '' + fs.readFileSync(file, 'utf8');
}

function fileEql(file1, file2) {
    expect(readFile(file1)).to.be.eql(readFile(file2));
}

function getFileEql(src, dest){
    return function(name){
        var srcFile = path.join(src, name);
        var destFile = path.join(dest, name);
        fileEql(srcFile, destFile);
    };
}

describe('kpc.build', function () {


    describe('default', function() {
        var buildBase = 'sample/base-build';
        var srcBase = 'sample/base-src';
        var expected = 'sample/base-expect';


        var fileCheck = getFileEql(buildBase, expected);

        before(function(done) {
            rimraf(buildBase, function() {
                nodeKpc.build({
                    'pkg': {
                        name: 'xcake',
                        path: srcBase
                    },
                    dest: buildBase,
                    depFile: path.join(buildBase, 'map.js')
                }, path.join(srcBase, '**/*.js'));
                done();
            });
        });

        it('should build dep file', function () {
            fileCheck('map.js');
        });

        it('should kissy module with name and factory (app/name-fac.js)', function () {
            fileCheck('app/name-fac.js');
        });

        it('should file with multi modules (app/multi-module.js)', function () {
            fileCheck('app/multi-module.js');
        });


        it('should build cjs style module (app/cjs.js)', function () {
            fileCheck('app/cjs.js');
        });

        it('should build compiled cjs style module (app/cjs-full.js)', function () {
            fileCheck('app/cjs-full.js');
        });

        it('should build kissy module with factory and config (app/fac-config.js)', function () {
            fileCheck('app/fac-config.js');
        });

        it('should build kissy module with name, factory and config (app/name-fac-config.js)', function () {
            fileCheck('app/name-fac-config.js');
        });

        it('should build no kissy module (app/no-kissy.js)', function () {
            fileCheck('app/no-kissy.js');
        });

        it('should build object kissy module (app/object.js)', function () {
            fileCheck('app/object.js');
        });

        it('should build string kissy module (app/string.js)', function () {
            fileCheck('app/string.js');
        });

        it('should build kissy-module in deeper directory (pages/home/)', function () {
            fileCheck('pages/home/index.js');
            fileCheck('pages/home/mod.js');
        });
    });

    describe('flatten', function() {

        var buildBase = 'sample/base-flatten-build';
        var srcBase = 'sample/base-src';
        var expected = 'sample/base-flatten-expect';


        var fileCheck = getFileEql(buildBase, expected);

        before(function(done) {
            rimraf(buildBase, function() {
                nodeKpc.build({
                    'pkg': {
                        flatten: true,
                        name: 'xcake',
                        path: srcBase
                    },
                    dest: buildBase,
                    depFile: path.join(buildBase, 'map.js')
                }, path.join(srcBase, '**/*.js'));
                done();
            });
        });

        it('should build dep file', function () {
            fileCheck('map.js');
        });


        it('should file with multi modules (app/multi-module.js)', function () {
            fileCheck('_3.js');
        });


        it('should build cjs style module (app/cjs.js)', function () {
            fileCheck('_1.js');
        });

        it('should build compiled cjs style module (app/cjs-full.js)', function () {
            fileCheck('_0.js');
        });

        it('should build kissy module with factory and config (app/fac-config.js)', function () {
            fileCheck('_2.js');
        });

        it('should build kissy module with name, factory and config (app/name-fac-config.js)', function () {
            fileCheck('_4.js');
        });
        it('should kissy module with name and factory (app/name-fac.js)', function () {
            fileCheck('_5.js');
        });


        it('should build object kissy module (app/object.js)', function () {
            fileCheck('_6.js');
        });

        it('should build string kissy module (app/require-is-function.js)', function () {
            fileCheck('_7.js');
        });

        it('should build string kissy module (app/string.js)', function () {
            fileCheck('_8.js');
        });

        it('should build kissy-module in deeper directory (pages/home/)', function () {
            fileCheck('_8.js');
            fileCheck('_9.js');
        });
        it('should build no kissy module (app/no-kissy.js)', function () {
            fileCheck('app/no-kissy.js');
        });
    });

    describe('entry', function() {
        var buildBase = 'sample/entry-build';
        var srcBase = 'sample/entry-src';
        var expected = 'sample/entry-expect';
        var fileCheck = getFileEql(buildBase, expected);
        before(function(done) {
            rimraf(buildBase, function() {
                nodeKpc.build({
                    'pkg': {
                        flatten: false,
                        name: '_',
                        path: srcBase,
                        entry: ['components/*/*.js', 'pages/*/*.js']
                    },
                    dest: buildBase,
                    depFile: path.join(buildBase, 'map.js')
                }, path.join(srcBase, '**/*.js'));
                done();
            });
        });

        it('should build dep file', function () {
            fileCheck('map.js');
        });
        it('should build components/button/index file', function () {
            fileCheck('components/button/index.js');
        });
        it('should build components/sidebar/index file', function () {
            fileCheck('components/sidebar/index.js');
        });

        it('should build pages/home/index', function () {
            fileCheck('pages/home/index.js');
        });
        it('should build pages/home/index-m', function () {
            fileCheck('pages/home/index.js');
        });
        it('should build pages/home/no-kissy', function () {
            fileCheck('pages/home/no-kissy.js');
        });
    });

    describe('entry-flatten', function() {
        var buildBase = 'sample/entry-flatten-build';
        var srcBase = 'sample/entry-src';
        var expected = 'sample/entry-flatten-expect';
        var fileCheck = getFileEql(buildBase, expected);
        before(function(done) {
            rimraf(buildBase, function() {
                nodeKpc.build({
                    'pkg': {
                        flatten: true,
                        name: '_',
                        path: srcBase,
                        entry: ['components/*/*.js', 'pages/*/*.js']
                    },
                    dest: buildBase,
                    depFile: path.join(buildBase, 'map.js')
                }, path.join(srcBase, '**/*.js'));
                done();
            });
        });

        it('should build dep file', function () {
            fileCheck('map.js');
        });

        it('should build _0 kissy file', function () {
            fileCheck('_0.js');
        });
        it('should build _0 kissy file', function () {
            fileCheck('_1.js');
        });
        it('should build _0 kissy file', function () {
            fileCheck('_2.js');
        });
        it('should build _0 kissy file', function () {
            fileCheck('_3.js');
        });

        it('should build no-kissy file', function () {
            fileCheck('pages/home/no-kissy.js');
        });
    });

});
