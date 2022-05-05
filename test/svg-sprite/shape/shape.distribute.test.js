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

describe('testing distribute()', () => {
    it('should update attributes', () => {
        expect.hasAssertions();

        const shape = new SVGShape(TEST_FILE, TEST_SPRITER);
        shape.align = [['TEST_1', 1]];
        shape.distribute();

        expect(shape.base).toBe(`TEST_1 ${TEST_FILE.path}`);
        expect(shape.id).toBe(`TEST_1 ${TEST_FILE.path}`);
        expect(shape.align).toBe(1);
        expect(shape.copies).toBe(0);
    });

    it('should update id with state', () => {
        expect.hasAssertions();

        const shape = new SVGShape(TEST_FILE, TEST_SPRITER);
        shape.align = [['TEST_1', 1]];
        shape.state = 'test_state';
        shape.distribute();

        expect(shape.id).toBe(`TEST_1 ${TEST_FILE.path}~test_state`);
    });

    it('should create copies', () => {
        expect.hasAssertions();

        const shape = new SVGShape(TEST_FILE, TEST_SPRITER);
        shape.align = [['TEST_1', 1], ['TEST_2', 2], ['TEST_3', 3]];

        const copies = shape.distribute();

        expect(copies).toBeInstanceOf(Array);
        expect(copies).toHaveLength(3); // self + two alignment copies;

        const [firstCopy, secondCopy, thirdCopy] = copies;

        expect(firstCopy).toBe(shape);

        expect(secondCopy.base).toBe(`TEST_2 ${TEST_FILE.path}`);
        expect(secondCopy.id).toBe(`TEST_2 ${TEST_FILE.path}`);
        expect(secondCopy.align).toBe(2);
        expect(secondCopy.master).toBe(shape);

        expect(thirdCopy.base).toBe(`TEST_3 ${TEST_FILE.path}`);
        expect(thirdCopy.id).toBe(`TEST_3 ${TEST_FILE.path}`);
        expect(thirdCopy.align).toBe(3);
        expect(thirdCopy.master).toBe(shape);

        expect(shape.copies).toBe(2);
    });
});
