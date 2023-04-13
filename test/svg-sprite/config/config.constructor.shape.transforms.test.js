'use strict';

const SVGSpriterConfig = require('../../../lib/svg-sprite/config.js');

describe('testing SVGSpriterConfig shape.transforms', () => {
    const DEFAULT_TRANSFORMS = [['svgo', {}]];

    it('should set exact array passed', () => {
        expect.hasAssertions();

        const TEST_TRANSFORMS = [];
        const config = new SVGSpriterConfig({ shape: { transform: TEST_TRANSFORMS } });

        expect(config.shape.transform).toStrictEqual(TEST_TRANSFORMS);
    });

    it('should set default transforms if not provided', () => {
        expect.hasAssertions();

        const config = new SVGSpriterConfig({ shape: {} });

        expect(config.shape.transform).toStrictEqual(DEFAULT_TRANSFORMS);
    });

    it('should set default transforms if provided transform is null', () => {
        expect.hasAssertions();

        const config = new SVGSpriterConfig({ shape: { transform: null } });

        expect(config.shape.transform).toStrictEqual(DEFAULT_TRANSFORMS);
    });

    it('should set empty array if passed transforms is not correct', () => {
        expect.hasAssertions();

        const config = new SVGSpriterConfig({ shape: { transform: [true] } });

        expect(config.shape.transform).toStrictEqual([]);
    });

    it('should set expected array if transforms is an array of strings', () => {
        expect.hasAssertions();

        const TEST_TRANSFORMS = ['test', 'test_2'];
        const TEST_TRANSFORMS_COPY = [...TEST_TRANSFORMS];
        const config = new SVGSpriterConfig({ shape: { transform: TEST_TRANSFORMS } });

        expect(config.shape.transform).toStrictEqual([
            [TEST_TRANSFORMS_COPY[0], {}],
            [TEST_TRANSFORMS_COPY[1], {}]
        ]);
    });

    it('should set expected custom array of transforms if transforms is an array of functions', () => {
        expect.hasAssertions();

        const TEST_TRANSFORMS = [jest.fn(), jest.fn()];
        const TEST_TRANSFORMS_COPY = [...TEST_TRANSFORMS];
        const config = new SVGSpriterConfig({ shape: { transform: TEST_TRANSFORMS } });

        expect(config.shape.transform).toStrictEqual([
            ['custom', TEST_TRANSFORMS_COPY[0]],
            ['custom', TEST_TRANSFORMS_COPY[1]]
        ]);
    });

    it('should set expected array of transforms if transforms is an object', () => {
        expect.hasAssertions();

        const TEST_TRANSFORM_CONFIG = { TEST: 2 };
        const TEST_TRANSFORMS = [
            {
                TEST: jest.fn(),
                TEST_THAT_SHOULD_NOT_INCLUDED: jest.fn()
            },
            {
                TEST_2: TEST_TRANSFORM_CONFIG
            }
        ];
        const TEST_TRANSFORMS_COPY = [...TEST_TRANSFORMS];
        const config = new SVGSpriterConfig({ shape: { transform: TEST_TRANSFORMS } });

        expect(config.shape.transform).toStrictEqual([
            ['TEST', TEST_TRANSFORMS_COPY[0].TEST],
            ['TEST_2', TEST_TRANSFORM_CONFIG]
        ]);
    });
});
