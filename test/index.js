var expect = require('expect.js'),
    nodeKpc = require('..');

var fs = require('fs');

describe('node-kpc', function () {
    before(function(){
        "use strict";
        nodeKpc.buildPackage({
            'package': {
                name: 'xcake',
                path: 'sample/src',
                ignorePackageNameInUri: true
            },
            dest: 'sample/build'
        });
    });

    it('build all files', function (done) {

        expect(fs.existsSync('sample/build/deps.js')).to.be(true);

        expect(fs.existsSync('sample/build/app/example.css')).to.be(true);
        expect(fs.existsSync('sample/build/app/index.js')).to.be(true);
        expect(fs.existsSync('sample/build/app/mod.js')).to.be(true);
        expect(fs.existsSync('sample/build/app/namedMod.js')).to.be(true);

        expect(fs.existsSync('sample/build/components/header/index.js')).to.be(true);
        expect(fs.existsSync('sample/build/components/header/mod.js')).to.be(true);

        expect(fs.existsSync('sample/build/components/package-config/index.js')).to.be(true);

        expect(fs.existsSync('sample/build/components/slide/index.js')).to.be(true);
        expect(fs.existsSync('sample/build/components/slide/mod.js')).to.be(true);

        expect(fs.existsSync('sample/build/components/tooltip/index.js')).to.be(true);
        expect(fs.existsSync('sample/build/components/tooltip/mod.js')).to.be(true);

        expect(fs.existsSync('sample/build/pages/home/index.js')).to.be(true);
        expect(fs.existsSync('sample/build/pages/home/mod.js')).to.be(true);
        expect(fs.existsSync('sample/build/pages/home/page.css')).to.be(true);
        done();
    });
});
