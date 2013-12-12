var expect = require('expect.js');
var nodeKpc = require('..');
var rimraf = require('rimraf');
var glob = require('glob');

var path = require('path');
var fs = require('fs');

function readFile(file) {
    return fs.readFileSync(file, 'utf8');
}

describe('buildPackage', function () {

    before(function(done){
        rimraf('sample/build', function() {
            nodeKpc.buildPackage({
                'pkg': {
                    name: 'xcake',
                    path: 'sample/src',
                    ipn: true
                },
                dest: 'sample/build'
            }, '**/*.js');
            done();
        });

    });

    it('should build all file expect', function (done) {
        glob('**/*.js', {
            cwd: 'sample/expect'
        }, function(err, files){
            files.forEach(function(file){
                var fileBuild = path.join('sample/build', file);
                var fileExpect = path.join('sample/expect', file);
                expect(readFile(fileBuild)).to.be(readFile(fileExpect));
            });
        });
        done();
    });
});
