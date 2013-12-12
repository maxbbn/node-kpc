KISSY.add(function( S, require){

    var Node = require('node');
    var Header = require('../components/header/');
    require('./mod/');
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
