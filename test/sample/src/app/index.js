KISSY.add(function( S, Node, Header ){

    var App = {};

    function init(config) {
        Node.all('.app').addClass('success');
        Header.run(config);
        S.log( 'app init done' );
    }

    App.init = init;

    return App;

}, { requires: [
    'node',
    '../components/header/',
    './mod',
    './example.css'
]});
