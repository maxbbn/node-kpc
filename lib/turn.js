var esprima = require('esprima');

var escodegen = require('escodegen');
var tools = require('./tools');

function doTurn(astAdd) {
    return astAdd;
}

function turn(code){
    console.log(code);

    var ast = esprima.parse(code, {
        comment: true,
        loc: true,
        range: true,
        tokens: true
    });

    // console.log(JSON.stringify(ast, null, 4));

    console.log();

    tools.getKISSYAddFunctions(ast).forEach(doTurn)

    ast = escodegen.attachComments(ast, ast.comments, ast.tokens);
    var genCode = escodegen.generate(ast, {
        comment: true
    });

    return genCode;
}



var fs = require('fs');
console.log(turn(fs.readFileSync('test/files/old-module.js', 'utf8')));
