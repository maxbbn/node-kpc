/**
 * Generate by node-kpc
 * map from app/cjs.js
 */
KISSY.add('xcake/_1', [
    'node',
    'xcake/_8',
    'xcake/_0',
    'xcake/app/example.css'
], function (S, require) {
    var Node = require('node');
    var Header = require('xcake/_8');
    require('xcake/_0');
    require('xcake/app/example.css');
    var App = {};
    function init(config) {
        Node.all('.app').addClass('success');
        Header.run(config);
        S.log('app init done');
    }
    App.init = init;
    return App;
});