/** Generated by node-kpc **/
KISSY.config('modules', {
    '_/_0': {
        'requires': [
            'base',
            'node',
            'gallery/button/1.0/index'
        ]
    },
    '_/_1': {
        'requires': [
            '_/_0',
            'node'
        ]
    },
    '_/_2': { 'requires': ['_/_1'] },
    '_/_3': {
        'requires': [
            '_/_1',
            'node'
        ]
    },
    '_/components/button/index': { 'alias': '_/_0' },
    '_/components/sidebar/index': { 'alias': '_/_1' },
    '_/pages/home/index-m': { 'alias': '_/_2' },
    '_/pages/home/index': { 'alias': '_/_3' }
});