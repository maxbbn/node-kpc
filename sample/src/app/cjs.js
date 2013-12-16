/**
 * @fileoverview cjs style
 */
KISSY.add(function( S, require){

    var Node = require('node');
    var Header = require('../pages/home/');
    require('./cjs-full');
    require('./example.css');

    var App = {};

    function init(config) {
        Node.all('.app').addClass('success');
        Header.run(config);
        S.log( 'app init done' );
    }

    App.init = init;

    return App;

});
