/**
 * Generate by node-kpc
 */
KISSY.add('_/components/sidebar/mods/sidebar-mod', [
    '_/components/button/index',
    './sidebar-mod2'
], function (S, require) {
    require('_/components/button/index');
    require('./sidebar-mod2');
});
/**
 * Generate by node-kpc
 */
KISSY.add('_/components/sidebar/mods/sidebar-mod2', ['./sidebar-mod3'], function (S, require) {
    require('./sidebar-mod3');
});
/**
 * Generate by node-kpc
 */
KISSY.add('_/components/sidebar/mods/sidebar-mod3', ['node'], function (S, require) {
    require('node');
});
/**
 * Generate by node-kpc
 */
KISSY.add('_/components/sidebar/index', ['./mods/sidebar-mod.js'], function (S, require) {
    require('./mods/sidebar-mod.js');
});