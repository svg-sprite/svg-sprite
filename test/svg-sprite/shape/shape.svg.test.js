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

describe('testing _setDimensions()', () => {
    it('should set viewbox and call cb', () => {
        expect.hasAssertions();

        const TEST_WIDTH = 300;
        const TEST_HEIGHT = 100;
        const shape = new SVGShape(TEST_FILE, TEST_SPRITER);
        shape.width = TEST_WIDTH;
        shape.height = TEST_HEIGHT;

        const cb = jest.fn();
        jest.spyOn(shape, 'getViewbox').mockReturnValueOnce(null);
        shape._setDimensions(cb);

        expect(shape.getViewbox).toHaveBeenCalledWith(TEST_WIDTH, TEST_HEIGHT);
        expect(cb).toHaveBeenCalledWith(null);
    });

    it('should set attributes for all dimensions', () => {
        expect.hasAssertions();

        const shape = new SVGShape(TEST_FILE, TEST_SPRITER);
        const TEST_WIDTH = 300;
        const TEST_HEIGHT = 100;
        jest.spyOn(shape.dom.documentElement, 'setAttribute').mockImplementation();
        jest.spyOn(shape, 'getViewbox').mockReturnValueOnce(null);
        jest.spyOn(shape, 'getDimensions').mockReturnValueOnce({ height: TEST_HEIGHT, width: TEST_WIDTH });
        shape._setDimensions(jest.fn());

        expect(shape.dom.documentElement.setAttribute).toHaveBeenCalledTimes(2);
        expect(shape.dom.documentElement.setAttribute.mock.calls[0]).toStrictEqual(expect.arrayContaining(['height', TEST_HEIGHT]));
        expect(shape.dom.documentElement.setAttribute.mock.calls[1]).toStrictEqual(expect.arrayContaining(['width', TEST_WIDTH]));
    });

    describe('shape need to be scaled', () => {
        it('should scale if width is more than maxWidth', () => {
            expect.hasAssertions();

            const TEST_WIDTH = 400;
            const TEST_HEIGHT = 100;
            const shape = new SVGShape(TEST_FILE, TEST_SPRITER);
            shape.width = TEST_WIDTH;
            shape.height = TEST_HEIGHT;
            shape.config.spacing.box = 'padding';
            shape.config.spacing.padding.right = 10;
            shape.config.spacing.padding.left = 10;
            shape.config.dimension.maxWidth = TEST_WIDTH;

            shape._setDimensions(jest.fn());

            expect(shape._scale).toBe(380 / 400);
            expect(shape.width).toBe(380);
            expect(shape.height).toBe(100 * 380 / 400);
        });

        it('should scale if height is more than maxHeight', () => {
            expect.hasAssertions();

            const TEST_WIDTH = 300;
            const TEST_HEIGHT = 100;
            const shape = new SVGShape(TEST_FILE, TEST_SPRITER);
            shape.width = TEST_WIDTH;
            shape.height = TEST_HEIGHT;
            shape.config.spacing.box = 'padding';
            shape.config.spacing.padding.top = 10;
            shape.config.spacing.padding.bottom = 10;
            shape.config.dimension.maxHeight = TEST_HEIGHT;

            shape._setDimensions(jest.fn());

            expect(shape.height).toBe(80);
            expect(shape.width).toBe(300 * 80 / 100);
            expect(shape._scale).toBe(0.8);
        });

        it('should scale if height is less than maxHeight and width is less than maxWidth nad spacing is icon', () => {
            expect.hasAssertions();

            const TEST_WIDTH = 300;
            const TEST_HEIGHT = 100;
            const shape = new SVGShape(TEST_FILE, TEST_SPRITER);
            shape.width = TEST_WIDTH / 2;
            shape.height = TEST_HEIGHT / 2;
            shape.config.spacing.box = 'icon';
            shape.config.dimension.maxHeight = TEST_HEIGHT;
            shape.config.dimension.maxWidth = TEST_WIDTH;

            shape._setDimensions(jest.fn());

            expect(shape._scale).toBe(2);
            expect(shape.height).toBe(100);
            expect(shape.width).toBe(150 * 2);
        });
    });

    describe('with icon box size', () => {
        it('should set expected spacing', () => {
            expect.hasAssertions();

            const TEST_WIDTH = 300;
            const TEST_HEIGHT = 100;
            const shape = new SVGShape(TEST_FILE, TEST_SPRITER);
            shape.width = TEST_WIDTH * 2;
            shape.height = TEST_HEIGHT;
            shape.config.spacing.box = 'icon';
            shape.config.dimension.maxHeight = TEST_HEIGHT;
            shape.config.dimension.maxWidth = TEST_WIDTH;

            shape._setDimensions(jest.fn());

            expect(shape.config.spacing.padding.left).toBe(0);
            expect(shape.config.spacing.padding.right).toBe(0);
            expect(shape.config.spacing.padding.top).toBe(25);
            expect(shape.config.spacing.padding.bottom).toBe(25);
        });
    });
});
