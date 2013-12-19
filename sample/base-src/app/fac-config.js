/**
 * With factory and config
 */
KISSY.add(function( S, Node){
    var $ = Node.all;
    return {
        log: function(){
            S.log( 'common mod' );
        }
    }
}, {
    requires: ['node']
});