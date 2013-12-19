var expect = require('expect.js');
var nodeKpc = require('..');

describe('kpc.compile', function () {


    describe('compile all', function(){
        var pkg;

        before(function(){
            pkg = nodeKpc.compile({
                name: 'xcake',
                path: 'sample/base-src',
                ipn: true
            });
        });

        it('should compile all files', function(){
            expect(pkg.files.length).to.be(11);

            pkg.files.forEach(function(file) {

                expect(file.srcCode).to.be.a('string');
                expect(file.isKISSY).to.be.a('boolean');

                if (file.isKISSY) {
                    expect(file.modules).to.be.an(Array);
                    expect(file.genCode).to.be.an('string');
                }

                expect(file.filename).to.be.a('string');
                expect(file.srcFile).to.be.a('string');
            });
        });

        it('should has ignoreFiles array in pkg', function () {
            expect(pkg.ignoredFiles).to.be.an('array');
            expect(pkg.ignoredFiles.length).to.be(0);
        });

        it('should contain modules in pkg object', function(){
            expect(Object.keys(pkg.modules).length).to.be(5);
        });

        it('should exports requires in module', function(){
            Object.keys(pkg.modules).forEach(function(key) {
                var module = pkg.modules[key];
                expect(module.requires).to.be.an(Array);
                expect(module.requires.length).to.above(0);
            });
        });
    });

    describe('compile specific file', function(){
        var pkg;

        before(function(){
            pkg = nodeKpc.compile({
                name: 'xcake',
                path: 'sample/base-src',
                ipn: true
            }, 'sample/base-src/app/*');
        });

        it('should compile 9 files', function(){
            expect(pkg.files.length).to.be(9);
        });
    });


});
