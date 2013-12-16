/**
 * Generate by node-kpc
 * map from pages/home/index.js
 */
KISSY.add('xcake/_8', function (S, Node, App, Mod) {
    var $ = Node.all;
    function init() {
        App.init();
        S.log('Page init done');
        $('.page').addClass('success');
        Slide.run();
        $('.load').on('click', function (ev) {
            ev.preventDefault();
            S.use('xcake/components/tooltip/', function (S, T) {
                T.run();
            });
        });
    }
    return { init: init };
}, {
    'requires': [
        'node',
        'xcake/_1',
        'xcake/_9',
        'xcake/pages/home/page.css'
    ]
});