KISSY.add(function( S, Node, Mod ){

    return {
        run: function(){
            Node.all('.header').addClass('success');
            Mod.log();
        }
    }
}, { requires: [
    'node',
    './mod'
]});