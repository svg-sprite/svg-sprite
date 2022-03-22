'use strict';

const SVGSpriter = require('../../lib/svg-sprite.js');
const SVGSpriteLayouter = require('../../lib/svg-sprite/layouter.js');
const CSSLayouter = require('../../lib/svg-sprite/mode/css.js');
const DefsLayouter = require('../../lib/svg-sprite/mode/defs.js');
const StackLayouter = require('../../lib/svg-sprite/mode/stack.js');
const SymbolLayouter = require('../../lib/svg-sprite/mode/symbol.js');
const ViewLayouter = require('../../lib/svg-sprite/mode/view.js');

jest.mock('../../lib/svg-sprite/mode/css.js');
jest.mock('../../lib/svg-sprite/mode/defs.js');
jest.mock('../../lib/svg-sprite/mode/stack.js');
jest.mock('../../lib/svg-sprite/mode/symbol.js');
jest.mock('../../lib/svg-sprite/mode/view.js');

describe('testing layout()', () => {
    let spriter;
    const noop = jest.fn();

    const layouters = {
        css: CSSLayouter,
        defs: DefsLayouter,
        stack: StackLayouter,
        symbol: SymbolLayouter,
        view: ViewLayouter
    };

    beforeEach(() => {
        spriter = new SVGSpriter({ dest: '.' });
    });

    it('should log info', () => {
        expect.hasAssertions();

        jest.spyOn(spriter, 'info');

        const layouter = new SVGSpriteLayouter(spriter, {});
        layouter.layout({}, 'css', 'css', noop);

        expect(spriter.info).toHaveBeenCalledWith('Laying out «%s» sprite («%s» mode)', 'css', 'css');
    });

    it.each([
        'css',
        'defs',
        'stack',
        'symbol',
        'view'
    ])('should require %p mode, construct addressed layouter, and call "layout method" and change passed files', mode => {
        expect.hasAssertions();

        const TEST_FN = jest.fn();
        const layout = layouters[mode].mockImplementation(() => {
            return {
                layout: TEST_FN
            };
        });
        const TEST_KEY = `TEST_${mode}`;
        const TEST_FILES = {};

        const layouter = new SVGSpriteLayouter(spriter, {});
        layouter.layout(TEST_FILES, TEST_KEY, mode, noop);

        expect(layout).toHaveBeenCalledWith(spriter, expect.any(Object), expect.any(Object), TEST_KEY);
        expect(TEST_FN).toHaveBeenCalledWith({}, noop);
        expect(TEST_FILES).toHaveProperty(TEST_KEY);
        expect(TEST_FILES[TEST_KEY]).toStrictEqual({});
    });

    it('should pass expected config and data to layout', () => {
        expect.hasAssertions();

        const layout = layouters.css;
        const layouter = new SVGSpriteLayouter(spriter, {});
        layouter.layout({}, 'css', 'css', noop);

        expect(layout).toHaveBeenCalledWith(
            expect.any(Object),
            {
                dest: 'css',
                layout: 'packed',
                common: null,
                mixin: null,
                prefix: '.svg-%s',
                dimensions: '-dims',
                sprite: 'svg/sprite.css.svg',
                bust: true,
                svg: spriter.config.svg
            },
            {
                classname: expect.any(Function),
                date: expect.stringMatching(/\w+, \d{2} \w+ \d{4} \d{2}:\d{2}:\d{2} GMT/),
                encodeHashSign: expect.any(Function),
                escape: expect.any(Function),
                invert: expect.any(Function),
                shapes: []
            },
            expect.any(String)
        );
    });

    it('should merge config', () => {
        expect.hasAssertions();

        const TEST_CONFIG = {
            dest: 'TEST_DEST',
            layout: 'TEST_LAYOUT',
            common: 'TEST_COMMON',
            mixin: 'TEST_MIXIN',
            prefix: 'TEST_PREFIX',
            dimensions: 'TEST_DIMENSIONS',
            sprite: 'TEST_SPRITE',
            bust: 'TEST_BUST',
            svg: 'TEST_SVG'
        };

        const TEST_KEY = 'test key';
        const layout = layouters.css;
        const layouter = new SVGSpriteLayouter(spriter, { [TEST_KEY]: TEST_CONFIG });
        layouter.layout({}, TEST_KEY, 'css', noop);

        expect(layout).toHaveBeenCalledWith(
            expect.any(Object),
            expect.objectContaining(
                TEST_CONFIG
            ),
            expect.any(Object),
            expect.any(String)
        );
    });

    it('should merge data with config variables', () => {
        expect.hasAssertions();

        const TEST_CONFIG = {
            dest: 'TEST_DEST',
            layout: 'TEST_LAYOUT',
            common: 'TEST_COMMON',
            mixin: 'TEST_MIXIN',
            prefix: 'TEST_PREFIX',
            dimensions: 'TEST_DIMENSIONS',
            sprite: 'TEST_SPRITE',
            bust: 'TEST_BUST',
            svg: 'TEST_SVG',
            variables: {
                TEST_1: 'TEST_1',
                TEST_2: 'TEST_2'
            }
        };

        const TEST_KEY = 'test key';
        const layout = layouters.css;
        const layouter = new SVGSpriteLayouter(spriter, { [TEST_KEY]: TEST_CONFIG });
        layouter.layout({}, TEST_KEY, 'css', noop);

        expect(layout).toHaveBeenCalledWith(
            expect.any(Object),
            expect.any(Object),
            expect.objectContaining(TEST_CONFIG.variables),
            expect.any(String)
        );
    });

    it('should merge data with spriter`s config.variables', () => {
        expect.hasAssertions();

        spriter.config.variables = {
            TEST_1: 'TEST_1',
            TEST_2: 'TEST_2'
        };
        const layout = layouters.css;
        const layouter = new SVGSpriteLayouter(spriter, {});
        layouter.layout({}, 'css', 'css', noop);

        expect(layout).toHaveBeenCalledWith(
            expect.any(Object),
            expect.any(Object),
            expect.objectContaining(spriter.config.variables),
            expect.any(String)
        );
    });
});
