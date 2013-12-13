# KPC

Build a KISSY package, for KISSY 1.3+.

[![build status](https://secure.travis-ci.org/abc-team/node-kpc.png)](http://travis-ci.org/abc-team/node-kpc)

## Features

- Simple
- For KISSY 1.3 or 1.4 only
- For Online Combo Only

## Installation

This module is installed via npm:

``` bash
$ npm install node-kpc
```

## Example Usage

#### Build a Package!

``` js
var kpc = require('node-kpc');

// build a package
kpc.build({
    pkg: {
        name: 'xcake',
        path: 'sample/src'
    },
    dest: 'sample/build', // where the package is build to
    depFile: 'sample/build/map.js'
});

```

#### Specify Files to build

``` js
var kpc = require('node-kpc');

// build a package
kpc.build({
    pkg: {
        name: 'xcake',
        path: 'sample/src'
    },
    dest: 'sample/build', // where the package is build to
    depFile: 'sample/build/map.js' //
}, [
    'sample/src/app/*.js',
    'sample/src/pages/*.js'
]);

```



#### Compile a package (all file in package path)

````js
var kpc = require('node-kpc');

var pkg = kpc.compile({
    name: 'xcake',
    path: 'sample/src'
});

console.log(pkg);

```

the pkg look like this

```json
{
    "files": [
        {
            "srcCode": "/**\n * @fi...",
            "isKISSY": true,
            "modules": [
                {
                    "name": "xcake/app/cjs",
                    "requires": [
                        "node",
                        "../components/header/",
                        "./mod/",
                        "./example.css"
                    ]
                }
            ],
            "genCode": "/**\n * @fi...",
            "filename": "app/cjs.js",
            "srcFile": "sample/src/app/cjs.js"
        }
    ],
    "ignoredFiles": [],
    "modules": {
        "xcake/app/cjs": {
            "requires": [
                "node",
                "../components/header/",
                "./mod/",
                "./example.css"
            ]
        }
    }
}
```

#### Specify files to compile

````js
var kpc = require('node-kpc');

var pkg = kpc.compile({
    name: 'xcake',
    path: 'sample/src'
}, ['sample/src/app/*']);

console.log(pkg);

```