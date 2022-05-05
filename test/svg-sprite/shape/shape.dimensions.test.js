'use strict';

const SVGShape = require('../../../lib/svg-sprite/shape.js');

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

describe('testing getDimensions()', () => {
    it('should return expected width, height', () => {
        expect.hasAssertions();

        const shape = new SVGShape(TEST_FILE, TEST_SPRITER);
        shape.width = 100;
        shape.height = 200;

        expect(shape.getDimensions()).toStrictEqual({
            width: 100,
            height: 200
        });
    });
});

describe('testing setDimensions()', () => {
    it('should set expected width, height', () => {
        expect.hasAssertions();

        const TEST_WIDTH = 200;
        const TEST_HEIGHT = 100;
        const TEST_FILE = {
            contents: '<svg></svg>',
            path: 'test_path',
            relative: 'test_relative'
        };
        const shape = new SVGShape(TEST_FILE, TEST_SPRITER);

        shape.setDimensions(TEST_WIDTH, TEST_HEIGHT);

        expect(shape.width).toBe(TEST_WIDTH);
        expect(shape.height).toBe(TEST_HEIGHT);
        expect(shape.dom.documentElement.getAttribute('width')).toBe(TEST_WIDTH.toString());
        expect(shape.dom.documentElement.getAttribute('height')).toBe(TEST_HEIGHT.toString());
    });
});

describe('testing getViewbox()', () => {
    it('should set viewbox if it has not', () => {
        expect.hasAssertions();

        const shape = new SVGShape(TEST_FILE, TEST_SPRITER);
        shape.viewBox = null;
        shape.width = null;
        shape.height = null;

        jest.spyOn(shape, 'setViewbox').mockReturnValueOnce('TEST');

        shape.getViewbox();

        expect(shape.setViewbox).toHaveBeenCalledWith(0, 0, null, null);
    });

    it('should set viewbox with provided values', () => {
        expect.hasAssertions();

        const shape = new SVGShape(TEST_FILE, TEST_SPRITER);
        shape.viewBox = null;
        shape.width = null;
        shape.height = null;

        jest.spyOn(shape, 'setViewbox').mockReturnValueOnce('TEST');

        shape.getViewbox(10, 200);

        expect(shape.setViewbox).toHaveBeenCalledWith(0, 0, 10, 200);
    });

    it('should should return viewBox', () => {
        expect.hasAssertions();

        const TEST_VIEWBOX = 'test viewbox';
        const shape = new SVGShape(TEST_FILE, TEST_SPRITER);
        shape.viewBox = TEST_VIEWBOX;

        expect(shape.getViewbox()).toBe(TEST_VIEWBOX);
    });
});

describe('testing setViewbox()', () => {
    it('should set accordingly if first param is array', () => {
        expect.hasAssertions();

        const shape = new SVGShape(TEST_FILE, TEST_SPRITER);
        const expected = [0, 1, 2, 3, 4, 23, Number.NaN];

        expect(shape.setViewbox([0, 1, 2, 3, 4, '23', 'string'])).toStrictEqual(expected);
        expect(shape.viewBox).toStrictEqual(expected);
        expect(shape.dom.documentElement.getAttribute('viewBox')).toBe(expected.join(' '));
    });

    it('should fill with zeros if first param is empty array', () => {
        expect.hasAssertions();

        const shape = new SVGShape(TEST_FILE, TEST_SPRITER);
        const expected = [0, 0, 0, 0];

        expect(shape.setViewbox([])).toStrictEqual(expected);
        expect(shape.viewBox).toStrictEqual(expected);
        expect(shape.dom.documentElement.getAttribute('viewBox')).toBe(expected.join(' '));
    });

    it('should accordingly to passed params', () => {
        expect.hasAssertions();

        const shape = new SVGShape(TEST_FILE, TEST_SPRITER);
        const expected = [0, 1, 2, 3];

        expect(shape.setViewbox(...expected)).toStrictEqual(expected);
        expect(shape.viewBox).toStrictEqual(expected);
        expect(shape.dom.documentElement.getAttribute('viewBox')).toBe(expected.join(' '));
    });
});
