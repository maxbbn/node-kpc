var expect = require('expect.js'),
    nodeKpc = require('..');

describe('node-kpc', function() {
  it('should say hello', function(done) {
    expect(nodeKpc()).to.equal('Hello, world');
    done();
  });
});
