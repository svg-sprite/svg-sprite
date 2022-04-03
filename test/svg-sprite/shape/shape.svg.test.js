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
