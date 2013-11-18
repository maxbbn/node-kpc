# node-kpc

Build a KISSY package, for KISSY 1.3+.

[![build status](https://secure.travis-ci.org/abc-team/node-kpc.png)](http://travis-ci.org/abc-team/node-kpc)

## Installation

This module is installed via npm:

``` bash
$ npm install node-kpc
```

## Example Usage

``` js
var kpc = require('node-kpc');

// build a package
kpc.buildPackage({
    package: {
        name: 'xcake',
        path: 'sample/src',
        ignorePackageNameInUri: true
    },
    dest: 'sample/build'
});

```
=======
kpc
===

KISSY Package Compiler
