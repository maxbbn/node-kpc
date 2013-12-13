/**
 * With name factory and config
 */
KISSY.add('xcake/app/namedMod2', function (S) {
    return {
        log: function () {
            S.log('common mod');
        }
    };
}, {});