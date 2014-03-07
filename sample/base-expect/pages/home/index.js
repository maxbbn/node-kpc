/**
 * Generate by node-kpc
 */
KISSY.add('xcake/pages/home/index', function (S, Node, App, Mod) {
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
    requires: [
        'node',
        'xcake/app/cjs',
        './mod',
        './page.css'
    ]
});