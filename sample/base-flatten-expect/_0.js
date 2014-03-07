/**
 * Generate by node-kpc
 * map from app/cjs-full.js
 */
KISSY.add('xcake/_0', [
    'node',
    'xcake/_9',
    'xcake/_1',
    'xcake/app/example.css'
], function (S, require) {
    var Node = require('node');
    var Header = require('xcake/_9');
    require('xcake/_1');
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