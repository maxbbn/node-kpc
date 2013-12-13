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

describe('kpc.build', function () {

    before(function(done) {
        rimraf('sample/build', function() {
            nodeKpc.build({
                'pkg': {
                    name: 'xcake',
                    path: 'sample/src',
                    ipn: true
                },
                dest: 'sample/build',
                depFile: 'sample/build/map.js'
            }, 'sample/src/**/*.js');
            done();
        });
    });

    it('should kissy module with name and factory', function () {
        fileEql('sample/build/map.js', 'sample/expect/map.js');
    });

    it('should build dep file', function () {
        fileEql('sample/build/app/name-fac.js', 'sample/expect/app/name-fac.js');
    });


    it('should build cjs style module (app/cjs.js)', function () {
        fileEql('sample/build/app/cjs.js', 'sample/expect/app/cjs.js');
    });

    it('should build compiled cjs style module (app/cjs-full.js)', function () {
        fileEql('sample/build/app/cjs-full.js', 'sample/expect/app/cjs-full.js');
    });

    it('should build kissy module with factory and config (app/fac-config.js)', function () {
        fileEql('sample/build/app/fac-config.js', 'sample/expect/app/fac-config.js');
    });

    it('should build kissy module with name, factory and config (app/name-fac-config.js)', function () {
        fileEql('sample/build/app/name-fac-config.js', 'sample/expect/app/name-fac-config.js');
    });

    it('should build no kissy module (app/no-kissy.js)', function () {
        fileEql('sample/build/app/no-kissy.js', 'sample/expect/app/no-kissy.js');
    });

    it('should build object kissy module (app/object.js)', function () {
        fileEql('sample/build/app/object.js', 'sample/expect/app/object.js');
    });

    it('should build string kissy module (app/string.js)', function () {
        fileEql('sample/build/app/string.js', 'sample/expect/app/string.js');
    });

    it('should build kissy-module in deeper directory (pages/home/)', function () {
        fileEql('sample/build/pages/home/index.js', 'sample/expect/pages/home/index.js');
        fileEql('sample/build/pages/home/mod.js', 'sample/expect/pages/home/mod.js');
    });

});
