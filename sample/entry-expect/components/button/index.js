/**
 * Generate by node-kpc
 */
KISSY.add('_/components/button/mods/button-mod', [
    'node',
    'base',
    'gallery/button/1.0/'
], function (S, require) {
    require('node');
    require('base');
    require('gallery/button/1.0/');
});
/**
 * Generate by node-kpc
 */
KISSY.add('_/components/button/index', [
    './mods/button-mod.js',
    'base'
], function (S, require) {
    require('./mods/button-mod.js');
    require('base');
});