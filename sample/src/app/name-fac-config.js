/**
 * With name factory and config
 */
KISSY.add('xcake/app/name-fac-config', function(S){
    return {
        log: function(){
            S.log( 'common mod' );
        }
    }
}, {
    requires: ['node', './cjs-full']
});