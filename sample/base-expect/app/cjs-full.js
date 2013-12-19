/**
 * Generate by node-kpc
 */
KISSY.add('xcake/app/cjs-full', [
    'node',
    '../pages/home/',
    './cjs',
    './example.css'
], function (S, require) {
    var Node = require('node');
    var Header = require('../pages/home/');
    require('./cjs');
    require('./example.css');
    var App = {};
    function init(config) {
        Node.all('.app').addClass('success');
        Header.run(config);
        S.log('app init done');
    }
    App.init = init;
    return App;
});