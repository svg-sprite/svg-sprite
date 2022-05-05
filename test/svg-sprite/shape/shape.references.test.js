'use strict';

const SVGShape = require('../../../lib/svg-sprite/shape.js');

jest.mock('cssom', () => {
    return {
        parse() {
            return {
                cssRules: ''
            };
        }
    };
});

const TEST_SPRITER = {
    config: {
        shape: {
            meta: {},
            align: {}
        }
    },
    verbose: jest.fn()
};
const TEST_FILE = {
    contents: '<svg></svg>',
    path: 'test_path',
    relative: 'test_relative'
};

describe('testing _replaceIdAndClassnameReferences()', () => {
    it('should replace ids if subs ids passed', () => {
        expect.hasAssertions();

        const shape = new SVGShape(TEST_FILE, TEST_SPRITER);
        const TEST_STRING = 'url(id1) url(id2)';
        const TEST_SUBS_IDS = {
            id1: 'NEW ID 1'
        };

        expect(shape._replaceIdAndClassnameReferences(TEST_STRING, TEST_SUBS_IDS, {}, false)).toBe('url(#NEW ID 1) url(id2)');
    });

    it('should not change string if subs ids is null', () => {
        expect.hasAssertions();

        const shape = new SVGShape(TEST_FILE, TEST_SPRITER);
        const TEST_STRING = 'url(id1) url(id2)';

        expect(shape._replaceIdAndClassnameReferences(TEST_STRING, null, {}, false)).toBe(TEST_STRING);
    });

    it('should return value of _replaceIdAndClassnameReferencesInCssSelectors() if selectors passed', () => {
        expect.hasAssertions();

        const shape = new SVGShape(TEST_FILE, TEST_SPRITER);
        const TEST_RESULT = 'test result';
        const TEST_STR = 'test str';
        const TEST_SUBS_IDS = { a: '1' };
        const TEST_SUBST_CLASSNAMES = { b: 2 };
        jest.spyOn(shape, '_replaceIdAndClassnameReferencesInCssSelectors').mockReturnValueOnce(TEST_RESULT);

        expect(shape._replaceIdAndClassnameReferences(TEST_STR, TEST_SUBS_IDS, TEST_SUBST_CLASSNAMES, true)).toBe(TEST_RESULT);
        expect(shape._replaceIdAndClassnameReferencesInCssSelectors).toHaveBeenCalledWith(TEST_STR, '', TEST_SUBS_IDS, TEST_SUBST_CLASSNAMES);
    });
});

describe('testing _replaceIdAndClassnameReferencesInCssSelectors()', () => {
    it('should follow keyText or cssRules if selectorText of passed rule is undefined', () => {
        expect.hasAssertions();

        const shape = new SVGShape(TEST_FILE, TEST_SPRITER);
        const TEST_RULES = [{
            keyText: '2',
            __starts: 0,
            __ends: 2
        }, {
            cssRules: [{
                __starts: 0,
                __ends: 3
            }, {
                __starts: 4,
                __ends: 7
            }]
        }];
        const TEST_STRING = '0123456789';

        const expected = shape._replaceIdAndClassnameReferencesInCssSelectors(TEST_STRING, TEST_RULES, {}, {});

        expect(expected).toBe('01789');
    });

    it('should follow selectors', () => {
        expect.hasAssertions();

        const shape = new SVGShape(TEST_FILE, TEST_SPRITER);
        const TEST_ID = 'test-id';
        const TEST_RULES = [{
            selectorText: `div.cls1:has(div),#${TEST_ID}`
        }, {
            selectorText: '.cls2,.x,.xx'
        }, {
            selectorText: 'a#a[href="test"]'
        }];
        const TEST_SUBS_IDS = {
            [`#${TEST_ID}`]: 'NO',
            '#a': 'b'
        };
        const TEST_CLASS_SUBS = {
            '.cls2': 'NOCLS',
            '.x': 'y',
            '.xx': 'yy'
        };
        const TEST_STRING = 'str';
        const expected = shape._replaceIdAndClassnameReferencesInCssSelectors(TEST_STRING, TEST_RULES, TEST_SUBS_IDS, TEST_CLASS_SUBS);

        expect(expected).toBe(`div.cls1:has(div),#NO${TEST_STRING}.NOCLS,.y,.yy${TEST_STRING}a#b[href="test"]str`);
    });
});
