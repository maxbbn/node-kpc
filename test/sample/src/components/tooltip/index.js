KISSY.add(function( S, Node, Mod ){
    return {
        run: function(){
            Node.all('.tooltip').addClass('success');
            Mod.log();
        }
    }
}, { requires: [
    'node',
    './mod'
]});