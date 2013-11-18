var expect = require('expect.js'),
    nodeKpc = require('..');

describe('node-kpc', function() {
  it('Run without errors', function(done) {

    nodeKpc.buildPackage({
        'package': {
            name: 'xcake',
            path: 'sample/src',
            ignorePackageNameInUri: true
        },
        dest: 'sample/build'
    });

    done();
  });
});
