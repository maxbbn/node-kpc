var expect = require('expect.js');
var nodeKpc = require('..');
var glob = require('glob');

describe('compilePackage', function () {


    describe('compile without files param', function(){
        var pkg;

        before(function(){
            pkg = nodeKpc.compilePackage({
                name: 'xcake',
                path: 'sample/src',
                ipn: true
            });
        });

        it('should return the right object', function () {
            expect(pkg).to.be.a('object');

            expect(pkg.files).to.be.an('array');
            expect(pkg.files.length).to.be(9);

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

            expect(pkg.modules).to.be.an('object');

            expect(pkg.ignoredFiles).to.be.an('array');
            expect(pkg.ignoredFiles.length).to.be(0);

            expect(Object.keys(pkg.modules).length).to.be(5);
        });
    });

//    describe('compile without files param', function(){
//        var pkg;
//
//        before(function(){
//            pkg = nodeKpc.compilePackage({
//                name: 'xcake',
//                path: 'sample/src',
//                ipn: true
//            });
//        });
//
//        it('should return the right object', function () {
//            expect(pkg).to.be.a('object');
//
//            expect(pkg.files).to.be.an('array');
//            expect(pkg.modules).to.be.an('object');
//
//            expect(pkg.ignoredFiles).to.be.an('array');
//            expect(pkg.ignoredFiles.length).to.be(0);
//        });
//    });

});
