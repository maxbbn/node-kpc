/** Generated by node-kpc **/
KISSY.config('modules', {
    'xcake/_0': {
        'requires': [
            'node',
            'xcake/_8',
            'xcake/_1',
            'xcake/app/example.css'
        ]
    },
    'xcake/_1': {
        'requires': [
            'node',
            'xcake/_8',
            'xcake/_0',
            'xcake/app/example.css'
        ]
    },
    'xcake/_2': { 'requires': ['node'] },
    'xcake/_4': {
        'requires': [
            'node',
            'xcake/_0'
        ]
    },
    'xcake/_8': {
        'requires': [
            'node',
            'xcake/_1',
            'xcake/_9',
            'xcake/pages/home/page.css'
        ]
    },
    'xcake/app/cjs-full': { 'alias': 'xcake/_0' },
    'xcake/app/cjs': { 'alias': 'xcake/_1' },
    'xcake/app/fac-config': { 'alias': 'xcake/_2' },
    'xcake/app/multi-module': { 'alias': 'xcake/_3' },
    'xcake/app/name-fac-config': { 'alias': 'xcake/_4' },
    'xcake/app/name-fac': { 'alias': 'xcake/_5' },
    'xcake/app/object': { 'alias': 'xcake/_6' },
    'xcake/app/string': { 'alias': 'xcake/_7' },
    'xcake/pages/home/index': { 'alias': 'xcake/_8' },
    'xcake/pages/home/mod': { 'alias': 'xcake/_9' }
});