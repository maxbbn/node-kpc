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
    var expectEql = getFileEql('sample/build', 'sample/expect');

    describe('default', function() {
        before(function(done) {
            rimraf('sample/build', function() {
                nodeKpc.build({
                    'pkg': {
                        name: 'xcake',
                        path: 'sample/src'
                    },
                    dest: 'sample/build',
                    depFile: 'sample/build/map.js'
                }, 'sample/src/**/*.js');
                done();
            });
        });

        it('should build dep file', function () {
            expectEql('map.js');
        });

        it('should kissy module with name and factory (app/name-fac.js)', function () {
            expectEql('app/name-fac.js');
        });

        it('should file with multi modules (app/multi-module.js)', function () {
            expectEql('app/multi-module.js');
        });


        it('should build cjs style module (app/cjs.js)', function () {
            expectEql('app/cjs.js');
        });

        it('should build compiled cjs style module (app/cjs-full.js)', function () {
            expectEql('app/cjs-full.js');
        });

        it('should build kissy module with factory and config (app/fac-config.js)', function () {
            expectEql('app/fac-config.js');
        });

        it('should build kissy module with name, factory and config (app/name-fac-config.js)', function () {
            expectEql('app/name-fac-config.js');
        });

        it('should build no kissy module (app/no-kissy.js)', function () {
            expectEql('app/no-kissy.js');
        });

        it('should build object kissy module (app/object.js)', function () {
            expectEql('app/object.js');
        });

        it('should build string kissy module (app/string.js)', function () {
            expectEql('app/string.js');
        });

        it('should build kissy-module in deeper directory (pages/home/)', function () {
            expectEql('pages/home/index.js');
            expectEql('pages/home/mod.js');
        });
    });

    describe('flatten modules', function() {
        var fileCheck = getFileEql('sample/build', 'sample/expect-flatten');
        before(function(done) {
            rimraf('sample/build', function() {
                nodeKpc.build({
                    'pkg': {
                        flatten: true,
                        name: 'xcake',
                        path: 'sample/src'
                    },
                    dest: 'sample/build',
                    depFile: 'sample/build/map.js'
                }, 'sample/src/**/*.js');
                done();
            });
        });

        it('should build dep file', function () {
            fileCheck('map.js');
        });
//


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

        it('should build string kissy module (app/string.js)', function () {
            fileCheck('_7.js');
        });

        it('should build kissy-module in deeper directory (pages/home/)', function () {
            fileCheck('_8.js');
            fileCheck('_9.js');
        });
        it('should build no kissy module (app/no-kissy.js)', function () {
            fileCheck('app/no-kissy.js');
        });
    });

});
