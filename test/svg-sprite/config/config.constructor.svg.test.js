'use strict';

const SVGSpriterConfig = require('../../../lib/svg-sprite/config.js');

describe('testing svg SVGSpriterConfig.constructor', () => {
    it('should merge config.svg', () => {
        expect.hasAssertions();

        const TEST_SVG = { TEST: 1, TEST_2: 2 };
        const config = new SVGSpriterConfig({ svg: TEST_SVG });

        expect(config.svg).toStrictEqual(expect.objectContaining(TEST_SVG));
    });

    it('should set default object if provided falsy value', () => {
        expect.hasAssertions();

        const DEFAULT_SVG_CONFIG = {
            doctypeDeclaration: true,
            xmlDeclaration: true,
            namespaceIDs: true,
            namespaceIDPrefix: '',
            namespaceClassnames: true,
            dimensionAttributes: true,
            rootAttributes: {},
            precision: -1
        };

        const config = new SVGSpriterConfig({ svg: false });

        expect(config.svg).toStrictEqual(expect.objectContaining(DEFAULT_SVG_CONFIG));
    });

    describe.each(['xmlDeclaration', 'doctypeDeclaration', 'dimensionAttributes'])('testing %p attr', field => {
        it('should set te passed value', () => {
            expect.hasAssertions();

            const TEST_VAR = 'test-var';
            const config = new SVGSpriterConfig({ svg: { [field]: TEST_VAR } });

            expect(config.svg[field]).toBe(TEST_VAR);
        });

        it('should set to true if not provided', () => {
            expect.hasAssertions();

            const config = new SVGSpriterConfig({});

            expect(config.svg[field]).toBe(true);
        });

        it('should set to false if falsy value provided', () => {
            expect.hasAssertions();

            const config = new SVGSpriterConfig({ svg: { [field]: false } });

            expect(config.svg[field]).toBe(false);
        });
    });

    it('should set rootAttributes with passed value', () => {
        expect.hasAssertions();

        const TEST_VAR = 'test-var';
        const config = new SVGSpriterConfig({ svg: { rootAttributes: TEST_VAR } });

        expect(config.svg.rootAttributes).toBe(TEST_VAR);
    });

    it('should set rootAttributes to {} if not provided', () => {
        expect.hasAssertions();

        const config = new SVGSpriterConfig({});

        expect(config.svg.rootAttributes).toStrictEqual({});
    });

    it('should set rootAttributes to {} if falsy value provided', () => {
        expect.hasAssertions();

        const config = new SVGSpriterConfig({ svg: { rootAttributes: false } });

        expect(config.svg.rootAttributes).toStrictEqual({});
    });

    it('should set precision to -1 if not provided', () => {
        expect.hasAssertions();

        const config = new SVGSpriterConfig();

        expect(config.svg.precision).toBe(-1);
    });

    it('should set precision to -1 if provided falsy value', () => {
        expect.hasAssertions();

        const config = new SVGSpriterConfig({ svg: { precision: false } });

        expect(config.svg.precision).toBe(-1);
    });

    it('should set precision to provided value', () => {
        expect.hasAssertions();

        const config = new SVGSpriterConfig({ svg: { precision: 10 } });

        expect(config.svg.precision).toBe(10);
    });

    it('should set precision to -1 if provided value less than -1', () => {
        expect.hasAssertions();

        const config = new SVGSpriterConfig({ svg: { precision: -10 } });

        expect(config.svg.precision).toBe(-1);
    });

    describe('testing svg.transform', () => {
        it('should set empty array if not provided', () => {
            expect.hasAssertions();

            const config = new SVGSpriterConfig({});

            expect(config.svg.transform).toStrictEqual([]);
        });

        it('should fill with functions if provided', () => {
            expect.hasAssertions();

            const TEST_TRANSFORMS = [jest.fn(), jest.fn()];
            const config = new SVGSpriterConfig({ svg: { transform: TEST_TRANSFORMS } });

            expect(config.svg.transform).toStrictEqual(TEST_TRANSFORMS);
        });

        it('should set empty array if incorrect config provided', () => {
            expect.hasAssertions();

            const TEST_TRANSFORMS = [1, 'test'];
            const config = new SVGSpriterConfig({ svg: { transform: TEST_TRANSFORMS } });

            expect(config.svg.transform).toStrictEqual([]);
        });

        it('should set array of provided function', () => {
            expect.hasAssertions();

            const TEST_TRANSFORM = jest.fn();
            const config = new SVGSpriterConfig({ svg: { transform: TEST_TRANSFORM } });

            expect(config.svg.transform).toStrictEqual([TEST_TRANSFORM]);
        });
    });
});
