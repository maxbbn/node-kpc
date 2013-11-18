KISSY.add(function( S, Node, App, Slide){
    var $ = Node.all;
    function init() {
        App.init();
        S.log( 'Page init done');
        $('.page').addClass('success');
        Slide.run();

        $('.load').on('click', function(ev){
            ev.preventDefault();
            S.use('xcake/components/tooltip/', function(S, T){
                T.run();
            })
        });
    }

    return {
        init: init
    }

}, { requires: [
    'node',
    'xcake/app/',
    './page.css',
    'xcake/components/slide/'
]});
