# KPC

Build a KISSY package, for KISSY 1.3+.

[![build status](https://secure.travis-ci.org/abc-team/node-kpc.png)](http://travis-ci.org/abc-team/node-kpc)

## Features

- Simple Config
- For KISSY 1.3 or 1.4 only
- For Online Combo

## Installation

This module is installed via npm:

``` bash
$ npm install node-kpc
```

## Example Usage

build.js

``` js
var kpc = require('node-kpc');

// build a package
kpc.buildPackage({
    pkg: {
        name: 'xcake',
        path: 'sample/src',
        ignorePackageNameInUri: true // or use 'ipn'
    },
    dest: 'sample/build',
    depFilename: 'deps.js'
});

```