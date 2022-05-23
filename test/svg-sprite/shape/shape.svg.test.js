'use strict';

const TEST_SPRITER = {
    config: {
        shape: {
            meta: {},
            align: {}
        },
        svg: {
            doctypeDeclaration: ''
        }
    },
    verbose: jest.fn()
};
const TEST_FILE = {
    contents: '<svg></svg>',
    path: 'test_path',
    relative: 'test_relative'
};

const { XMLSerializer } = require('@xmldom/xmldom');
const SVGShape = require('../../../lib/svg-sprite/shape.js');

describe('testing getSVG()', () => {
    it('should clone node if shape is not master', () => {
        expect.hasAssertions();

        const shape = new SVGShape(TEST_FILE, TEST_SPRITER);
        shape.master = false;
        jest.spyOn(shape.dom.documentElement, 'cloneNode');

        shape.getSVG();

        expect(shape.dom.documentElement.cloneNode).toHaveBeenCalledWith(true);
    });

    it('should wrap node if shape is master', () => {
        expect.hasAssertions();

        const TEST_ID = 'TEST_ID';
        const shape = new SVGShape(TEST_FILE, TEST_SPRITER);
        shape.master = {
            id: TEST_ID
        };
        const TEST_SVG = {
            setAttribute: jest.fn()
        };
        jest.spyOn(shape, '_stripInlineNamespaceDeclarations').mockReturnValueOnce('');
        jest.spyOn(shape.dom, 'createElementNS').mockReturnValueOnce(TEST_SVG);

        shape.getSVG();

        expect(shape.dom.createElementNS).toHaveBeenCalledWith('http://www.w3.org/2000/svg', 'use');
        expect(TEST_SVG.setAttribute).toHaveBeenCalledWith('xlink:href', `#${TEST_ID}`);
    });

    it('should return serialized string with declarations if inline is true', () => {
        expect.hasAssertions();

        const shape = new SVGShape(TEST_FILE, TEST_SPRITER);
        jest.spyOn(shape, '_stripInlineNamespaceDeclarations').mockReturnValueOnce(TEST_FILE.contents);

        expect(shape.getSVG(true)).toBe(new XMLSerializer().serializeToString(TEST_FILE.contents));
    });

    it('should call transform if it is a function', () => {
        expect.hasAssertions();

        const shape = new SVGShape(TEST_FILE, TEST_SPRITER);
        const testFn = jest.fn();

        shape.getSVG(false, testFn);

        expect(testFn).toHaveBeenCalledWith(expect.any(Object));
    });

    it('should return serialized xml if inline is true', () => {
        expect.hasAssertions();

        const shape = new SVGShape(TEST_FILE, TEST_SPRITER);
        jest.spyOn(shape, '_stripInlineNamespaceDeclarations').mockReturnValueOnce(TEST_FILE.contents);

        expect(shape.getSVG(true)).toBe(new XMLSerializer().serializeToString(TEST_FILE.contents));
    });

    it('should return serialized xml if shape is master', () => {
        expect.hasAssertions();

        const shape = new SVGShape(TEST_FILE, TEST_SPRITER);
        shape.master = {
            id: 2
        };
        jest.spyOn(shape, '_stripInlineNamespaceDeclarations').mockReturnValueOnce(TEST_FILE.contents);

        expect(shape.getSVG(false)).toBe(new XMLSerializer().serializeToString(TEST_FILE.contents));
    });

    it('should add declarations if provided', () => {
        expect.hasAssertions();

        const TEST_XML_DECLARATION = 'TEST XML DECLARATION';
        const TEST_DOCTYPE_DECLARATION = 'TEST DOCTYPE DECLARATION';
        const shape = new SVGShape(TEST_FILE, {
            config: {
                shape: {
                    meta: {},
                    align: {}
                },
                svg: {
                    doctypeDeclaration: true,
                    xmlDeclaration: true
                }
            },
            verbose: jest.fn()
        });
        shape.doctypeDeclaration = TEST_DOCTYPE_DECLARATION;
        shape.xmlDeclaration = TEST_XML_DECLARATION;

        expect(shape.getSVG()).toContain(TEST_DOCTYPE_DECLARATION);
        expect(shape.getSVG()).toContain(TEST_XML_DECLARATION);
    });

    it('should substitute ID references in href attributes', () => {
        expect.hasAssertions();

        const shape = new SVGShape({
            ...TEST_FILE,
            contents: '<svg xmlns="http://www.w3.org/2000/svg" id="abc" height="0" width="0"><use href="#abc"/></svg>'
        }, {
            config: {
                shape: {
                    meta: {},
                    align: {}
                },
                svg: {
                    doctypeDeclaration: '',
                    namespaceIDPrefix: 'someprefix-',
                    namespaceClassnames: false,
                    namespaceIDs: true
                },
                mode: {
                    view: true
                }
            },
            verbose: jest.fn()
        });
        shape.complement(jest.fn);
        shape.setNamespace('ns-');

        expect(shape.getSVG()).toBe('<svg xmlns="http://www.w3.org/2000/svg" id="someprefix-ns-abc" height="0" width="0" viewBox="0 0 0 0"><use href="#someprefix-ns-abc"/></svg>');
    });

    it('should substitute ID references in xlink:href attributes', () => {
        expect.hasAssertions();

        const shape = new SVGShape({
            ...TEST_FILE,
            contents: '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" id="abc" height="0" width="0"><use xlink:href="#abc"/></svg>'
        }, {
            config: {
                shape: {
                    meta: {},
                    align: {}
                },
                svg: {
                    doctypeDeclaration: '',
                    namespaceIDPrefix: 'someprefix-',
                    namespaceClassnames: false,
                    namespaceIDs: true
                },
                mode: {
                    view: true
                }
            },
            verbose: jest.fn()
        });
        shape.complement(jest.fn);
        shape.setNamespace('ns-');

        expect(shape.getSVG()).toBe('<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" id="someprefix-ns-abc" height="0" width="0" viewBox="0 0 0 0"><use xlink:href="#someprefix-ns-abc"/></svg>');
    });
});

describe('testing _stripInlineNamespaceDeclarations()', () => {
    it('should deal with nsMap if passed', () => {
        expect.hasAssertions();

        const shape = new SVGShape(TEST_FILE, TEST_SPRITER);
        const TEST_ELEMENT = {
            childNodes: []
        };
        const testFn = jest.fn().mockReturnValue(false);
        const MOCK_NS_MAP = {
            '': {},
            xlink: {}
        };

        Object.defineProperty(MOCK_NS_MAP, '', {
            get: testFn
        });
        Object.defineProperty(MOCK_NS_MAP, 'xlink', {
            get: testFn
        });

        shape._stripInlineNamespaceDeclarations(TEST_ELEMENT, MOCK_NS_MAP);

        expect(testFn).toHaveBeenCalledTimes(2);
    });

    it('should remove xmlns if it exists', () => {
        expect.hasAssertions();

        const shape = new SVGShape(TEST_FILE, TEST_SPRITER);
        const TEST_ELEMENT = {
            attributes: {
                getNamedItem: jest.fn().mockReturnValueOnce({ value: shape.DEFAULT_SVG_NAMESPACE }),
                removeNamedItem: jest.fn()
            },
            childNodes: []
        };

        expect(shape._stripInlineNamespaceDeclarations(TEST_ELEMENT)).toBe(TEST_ELEMENT);
        expect(TEST_ELEMENT.attributes.getNamedItem).toHaveBeenCalledWith('xmlns');
        expect(TEST_ELEMENT.attributes.removeNamedItem).toHaveBeenCalledWith('xmlns');
    });

    it('should remove xmlns:xlink if it not exists in nsMap', () => {
        expect.hasAssertions();

        const shape = new SVGShape(TEST_FILE, TEST_SPRITER);
        const TEST_ELEMENT = {
            attributes: {
                getNamedItem: jest.fn().mockReturnValueOnce({ value: shape.XLINK_NAMESPACE }),
                removeNamedItem: jest.fn()
            },
            childNodes: []
        };

        expect(shape._stripInlineNamespaceDeclarations(TEST_ELEMENT, {})).toBe(TEST_ELEMENT);
        expect(TEST_ELEMENT.attributes.getNamedItem).toHaveBeenCalledWith('xmlns:xlink');
        expect(TEST_ELEMENT.attributes.removeNamedItem).toHaveBeenCalledWith('xmlns:xlink');
    });

    it('should remove xmlns:xlink if it exists in nsMap', () => {
        expect.hasAssertions();

        const shape = new SVGShape(TEST_FILE, TEST_SPRITER);
        const TEST_ELEMENT = {
            attributes: {
                getNamedItem: jest.fn().mockReturnValueOnce({ value: shape.XLINK_NAMESPACE }),
                removeNamedItem: jest.fn()
            },
            childNodes: []
        };

        expect(shape._stripInlineNamespaceDeclarations(TEST_ELEMENT, { xlink: shape.XLINK_NAMESPACE })).toBe(TEST_ELEMENT);
        expect(TEST_ELEMENT.attributes.getNamedItem).toHaveBeenCalledWith('xmlns:xlink');
        expect(TEST_ELEMENT.attributes.removeNamedItem).toHaveBeenCalledWith('xmlns:xlink');
    });

    it('should call _stripInlineNamespaceDeclarations() for each child element', () => {
        expect.hasAssertions();

        let isMethodMocked = false;
        const shape = new SVGShape(TEST_FILE, TEST_SPRITER);
        const TEST_CHILD_1 = { nodeType: 1 };
        const TEST_CHILD_2 = { nodeType: 1 };
        const TEST_CHILD_3 = { nodeType: 666 };
        const TEST_ELEMENT = {
            _nsMap: { TEST_NS_MAP: true },
            attributes: {
                getNamedItem: jest.fn().mockReturnValueOnce({ value: shape.XLINK_NAMESPACE }),
                removeNamedItem: jest.fn()
            },
            childNodes: {
                0: TEST_CHILD_1,
                1: TEST_CHILD_2,
                2: TEST_CHILD_3,
                length: 3,
                item(i) {
                    // eslint-disable-next-line jest/no-conditional-in-test
                    if (!isMethodMocked) {
                        isMethodMocked = true; // mocking the other calls
                        jest.spyOn(shape, '_stripInlineNamespaceDeclarations').mockImplementation();
                    }

                    return this[i];
                }
            }
        };

        shape._stripInlineNamespaceDeclarations(TEST_ELEMENT, false);

        expect(shape._stripInlineNamespaceDeclarations).toHaveBeenCalledTimes(2);
        expect(shape._stripInlineNamespaceDeclarations.mock.calls[0][0]).toStrictEqual(TEST_CHILD_1);
        expect(shape._stripInlineNamespaceDeclarations.mock.calls[0][1]).toStrictEqual(expect.objectContaining(TEST_ELEMENT._nsMap));
        expect(shape._stripInlineNamespaceDeclarations.mock.calls[1][0]).toStrictEqual(TEST_CHILD_1);
        expect(shape._stripInlineNamespaceDeclarations.mock.calls[1][1]).toStrictEqual(expect.objectContaining(TEST_ELEMENT._nsMap));
    });
});

describe('testing setSVG()', () => {
    it('should set attributes to svg and call _initSVG()', () => {
        expect.hasAssertions();

        const shape = new SVGShape(TEST_FILE, TEST_SPRITER);
        const TEST_SVG = 'TEST_svg';
        const TEST_RESULT = { TEST: 'result' };

        jest.spyOn(shape, '_initSVG').mockReturnValueOnce(TEST_RESULT);

        expect(shape.setSVG(TEST_SVG)).toBe(TEST_RESULT);
        expect(shape.svg.current).toBe(TEST_SVG);
        expect(shape.svg.ready).toBeNull();
        expect(shape._initSVG).toHaveBeenCalledWith();
    });
});

describe('testing _round()', () => {
    it('should return expected result', () => {
        expect.hasAssertions();

        const shape = new SVGShape(TEST_FILE, TEST_SPRITER);

        shape._precision = 0.1;

        expect(shape._round(99.99)).toBe(100);

        shape._precision = 0.01;

        expect(shape._round(90)).toBe(100);

        shape._precision = 100;

        expect(shape._round(99.9)).toBe(99.9);
    });
});
