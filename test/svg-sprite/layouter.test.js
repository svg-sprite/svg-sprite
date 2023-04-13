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

    it.each(['css', 'defs', 'stack', 'symbol', 'view'])(
        'should require %p mode, construct addressed layouter, and call "layout method" and change passed files',
        mode => {
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
        }
    );

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
            expect.objectContaining(TEST_CONFIG),
            expect.any(Object),
            expect.any(String)
        );
    });

    it('should merge data with config variables', () => {
        expect.hasAssertions();

        const TEST_CONFIG = {
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

describe('testing constructor', () => {
    let spriter;

    beforeEach(() => {
        spriter = new SVGSpriter({ dest: '.' });
    });

    it('should set expected initial data', () => {
        expect.hasAssertions();

        const TEST_CONFIG = {};
        const layouter = new SVGSpriteLayouter(spriter, TEST_CONFIG);

        expect(layouter._spriter).toBe(spriter);
        expect(layouter.config).toBe(TEST_CONFIG);
        expect(layouter.mode).toBeNull();
        expect(layouter.files).toStrictEqual({});
        expect(layouter.data).toStrictEqual({});
    });

    it('should debug info', () => {
        expect.hasAssertions();

        jest.spyOn(spriter, 'debug');
        // eslint-disable-next-line no-new
        new SVGSpriteLayouter(spriter, {});

        expect(spriter.debug).toHaveBeenCalledWith('Created layouter instance');
    });

    it('should set _commonData according to spriter.config.variables', () => {
        expect.hasAssertions();

        const TEST_VARIABLES_CONFIG = {
            TEST: 1
        };
        spriter.config.variables = TEST_VARIABLES_CONFIG;
        const layouter = new SVGSpriteLayouter(spriter, {});

        expect(layouter._commonData).toStrictEqual({
            shapes: [],
            classname: expect.any(Function),
            date: expect.stringMatching(/\w+, \d{2} \w+ \d{4} \d{2}:\d{2}:\d{2} GMT/),
            encodeHashSign: expect.any(Function),
            escape: expect.any(Function),
            invert: expect.any(Function),
            ...TEST_VARIABLES_CONFIG
        });
    });

    it('should fill up shapes with file sizes if config.example is true', () => {
        expect.hasAssertions();

        const TEST_SHAPE = {
            id: 'master',
            base: 'base',
            master: { id: 'master' },
            getDimensions: jest.fn().mockReturnValueOnce({}),
            config: { spacing: { padding: {} } },
            source: {
                contents: 'test'
            }
        };

        spriter._shapes = [TEST_SHAPE];
        const layouter = new SVGSpriteLayouter(spriter, {
            example: true
        });

        expect(layouter._commonData.shapes[0]).toStrictEqual(
            expect.objectContaining({
                fileSize: '4 Bytes'
            })
        );
    });

    it('should fill up shapes accordingly to spriter shapes with proper data and proper width/height calculation', () => {
        expect.hasAssertions();

        const TEST_DIMENSIONS = {
            '100x100': {
                width: 100,
                height: 100
            },
            '200x200': {
                width: 200,
                height: 200
            },
            '300x300': {
                width: 300,
                height: 300
            }
        };
        const TEST_PADDINGS = {
            0: {
                top: 0,
                left: 0,
                right: 0,
                bottom: 0
            },
            5: {
                top: 5,
                left: 5,
                right: 5,
                bottom: 5
            },
            10: {
                top: 10,
                left: 10,
                right: 10,
                bottom: 10
            }
        };
        const TEST_MASTER_SHAPE = {
            id: 'master',
            base: 'base',
            master: { id: 'master' },
            getDimensions: jest.fn().mockReturnValueOnce(TEST_DIMENSIONS['100x100']),
            config: { spacing: { padding: TEST_PADDINGS['0'] } }
        };
        const TEST_SECOND = {
            id: '2',
            base: 'base',
            master: null,
            getDimensions: jest.fn().mockReturnValueOnce(TEST_DIMENSIONS['100x100']),
            config: { spacing: { padding: TEST_PADDINGS['5'] } }
        };
        const TEST_THIRD = {
            id: '3',
            base: 'base',
            master: null,
            getDimensions: jest.fn().mockReturnValueOnce(TEST_DIMENSIONS['100x100']),
            config: { spacing: { padding: TEST_PADDINGS['10'] } }
        };
        const TEST_FOURTH = {
            id: '4',
            base: 'base',
            master: null,
            getDimensions: jest.fn().mockReturnValueOnce(TEST_DIMENSIONS['200x200']),
            config: { spacing: { padding: TEST_PADDINGS['0'] } }
        };
        const TEST_FIFTH = {
            id: '5',
            base: 'base',
            master: null,
            getDimensions: jest.fn().mockReturnValueOnce(TEST_DIMENSIONS['200x200']),
            config: { spacing: { padding: TEST_PADDINGS['5'] } }
        };
        const TEST_SIXTH = {
            id: '6',
            base: 'base',
            master: null,
            getDimensions: jest.fn().mockReturnValueOnce(TEST_DIMENSIONS['200x200']),
            config: { spacing: { padding: TEST_PADDINGS['10'] } }
        };
        const TEST_SEVENTH = {
            id: '4',
            base: 'base',
            master: null,
            getDimensions: jest.fn().mockReturnValueOnce(TEST_DIMENSIONS['300x300']),
            config: { spacing: { padding: TEST_PADDINGS['0'] } }
        };
        const TEST_EIGHT = {
            id: '5',
            base: 'base',
            master: null,
            getDimensions: jest.fn().mockReturnValueOnce(TEST_DIMENSIONS['300x300']),
            config: { spacing: { padding: TEST_PADDINGS['5'] } }
        };
        const TEST_NINTH = {
            id: '6',
            base: 'base',
            master: null,
            getDimensions: jest.fn().mockReturnValueOnce(TEST_DIMENSIONS['300x300']),
            config: { spacing: { padding: TEST_PADDINGS['10'] } }
        };
        spriter._shapes = [
            TEST_MASTER_SHAPE,
            TEST_SECOND,
            TEST_THIRD,
            TEST_FOURTH,
            TEST_FIFTH,
            TEST_SIXTH,
            TEST_SEVENTH,
            TEST_EIGHT,
            TEST_NINTH
        ];
        const layouter = new SVGSpriteLayouter(spriter, {});

        expect(layouter._commonData.shapes).toHaveLength(9);
        expect(layouter._commonData.shapes[0]).toStrictEqual({
            name: TEST_MASTER_SHAPE.id,
            base: TEST_MASTER_SHAPE.base,
            master: TEST_MASTER_SHAPE.master.id,
            width: {
                inner: 100,
                outer: 100
            },
            height: {
                inner: 100,
                outer: 100
            },
            first: true,
            last: false,
            fileSize: null
        });
        expect(layouter._commonData.shapes[1]).toStrictEqual({
            name: TEST_SECOND.id,
            base: TEST_SECOND.base,
            master: null,
            width: {
                inner: 90,
                outer: 100
            },
            height: {
                inner: 90,
                outer: 100
            },
            first: false,
            last: false,
            fileSize: null
        });
        expect(layouter._commonData.shapes[2]).toStrictEqual({
            name: TEST_THIRD.id,
            base: TEST_THIRD.base,
            master: null,
            width: {
                inner: 80,
                outer: 100
            },
            height: {
                inner: 80,
                outer: 100
            },
            first: false,
            last: false,
            fileSize: null
        });
        expect(layouter._commonData.shapes[3]).toStrictEqual({
            name: TEST_FOURTH.id,
            base: TEST_FOURTH.base,
            master: null,
            width: {
                inner: 200,
                outer: 200
            },
            height: {
                inner: 200,
                outer: 200
            },
            first: false,
            last: false,
            fileSize: null
        });
        expect(layouter._commonData.shapes[3]).toStrictEqual({
            name: TEST_FOURTH.id,
            base: TEST_FOURTH.base,
            master: null,
            width: {
                inner: 200,
                outer: 200
            },
            height: {
                inner: 200,
                outer: 200
            },
            first: false,
            last: false,
            fileSize: null
        });
        expect(layouter._commonData.shapes[4]).toStrictEqual({
            name: TEST_FIFTH.id,
            base: TEST_FIFTH.base,
            master: null,
            width: {
                inner: 190,
                outer: 200
            },
            height: {
                inner: 190,
                outer: 200
            },
            first: false,
            last: false,
            fileSize: null
        });
        expect(layouter._commonData.shapes[5]).toStrictEqual({
            name: TEST_SIXTH.id,
            base: TEST_SIXTH.base,
            master: null,
            width: {
                inner: 180,
                outer: 200
            },
            height: {
                inner: 180,
                outer: 200
            },
            first: false,
            last: false,
            fileSize: null
        });
        expect(layouter._commonData.shapes[6]).toStrictEqual({
            name: TEST_SEVENTH.id,
            base: TEST_SEVENTH.base,
            master: null,
            width: {
                inner: 300,
                outer: 300
            },
            height: {
                inner: 300,
                outer: 300
            },
            first: false,
            last: false,
            fileSize: null
        });
        expect(layouter._commonData.shapes[7]).toStrictEqual({
            name: TEST_EIGHT.id,
            base: TEST_EIGHT.base,
            master: null,
            width: {
                inner: 290,
                outer: 300
            },
            height: {
                inner: 290,
                outer: 300
            },
            first: false,
            last: false,
            fileSize: null
        });
        expect(layouter._commonData.shapes[8]).toStrictEqual({
            name: TEST_NINTH.id,
            base: TEST_NINTH.base,
            master: null,
            width: {
                inner: 280,
                outer: 300
            },
            height: {
                inner: 280,
                outer: 300
            },
            first: false,
            last: true,
            fileSize: null
        });
    });
});

describe('testing defaultVariables', () => {
    let layouter;

    beforeEach(() => {
        layouter = new SVGSpriteLayouter(new SVGSpriter({ dest: '.' }), {});
    });

    describe('testing invert', () => {
        it('should be a function', () => {
            expect.hasAssertions();
            expect(layouter._commonData.invert).toBeInstanceOf(Function);
        });

        it('should return a function', () => {
            expect.hasAssertions();
            expect(layouter._commonData.invert()).toBeInstanceOf(Function);
        });

        it('should revert number as a mustache function', () => {
            expect.hasAssertions();

            const TEST_NUMBER = 5;
            const MOCK_RENDER_FN = jest.fn().mockReturnValueOnce(TEST_NUMBER);

            expect(layouter._commonData.invert()(TEST_NUMBER, MOCK_RENDER_FN)).toBe(-5);
            expect(MOCK_RENDER_FN).toHaveBeenCalledWith(TEST_NUMBER);
        });
    });

    describe('testing classname', () => {
        it('should be a function', () => {
            expect.hasAssertions();
            expect(layouter._commonData.classname).toBeInstanceOf(Function);
        });

        it('should return a function', () => {
            expect.hasAssertions();
            expect(layouter._commonData.classname()).toBeInstanceOf(Function);
        });

        it('should call render as a mustache function', () => {
            expect.hasAssertions();

            const TEST_STR = 'test';
            const MOCK_RENDER_FN = jest.fn().mockReturnValueOnce(TEST_STR);

            layouter._commonData.classname()(TEST_STR, MOCK_RENDER_FN);

            expect(MOCK_RENDER_FN).toHaveBeenCalledWith(TEST_STR);
        });

        describe('testing function', () => {
            it('should replace all last class if string includes spaces', () => {
                expect.hasAssertions();

                const TEST_STR = 'test1 test2  test3 test4';

                expect(layouter._commonData.classname()(TEST_STR, jest.fn().mockReturnValueOnce(TEST_STR))).toBe(
                    'test4'
                );
            });

            it('should remove the dot', () => {
                expect.hasAssertions();

                const TEST_STR = '.classname';

                expect(layouter._commonData.classname()(TEST_STR, jest.fn().mockReturnValueOnce(TEST_STR))).toBe(
                    'classname'
                );
            });

            it('should return initial string if it is not started with dot', () => {
                expect.hasAssertions();

                const TEST_STR = 'class';

                expect(layouter._commonData.classname()(TEST_STR, jest.fn().mockReturnValueOnce(TEST_STR))).toBe(
                    'class'
                );
            });
        });
    });

    describe('testing escape', () => {
        it('should be a function', () => {
            expect.hasAssertions();
            expect(layouter._commonData.escape).toBeInstanceOf(Function);
        });

        it('should return a function', () => {
            expect.hasAssertions();
            expect(layouter._commonData.escape()).toBeInstanceOf(Function);
        });

        it('should revert number replace \\ with \\\\ as a mustache fn', () => {
            expect.hasAssertions();

            const TEST_STR = '\\1\\2\\3\\4';
            const MOCK_RENDER_FN = jest.fn().mockReturnValueOnce(TEST_STR);

            expect(layouter._commonData.escape()(TEST_STR, MOCK_RENDER_FN)).toBe('\\\\1\\\\2\\\\3\\\\4');
            expect(MOCK_RENDER_FN).toHaveBeenCalledWith(TEST_STR);
        });
    });

    describe('testing encodeHashSign', () => {
        it('should be a function', () => {
            expect.hasAssertions();
            expect(layouter._commonData.encodeHashSign).toBeInstanceOf(Function);
        });

        it('should return a function', () => {
            expect.hasAssertions();
            expect(layouter._commonData.encodeHashSign()).toBeInstanceOf(Function);
        });

        it('should revert number replace # with %23 as a mustache fn', () => {
            expect.hasAssertions();

            const TEST_STR = '#1#2#3#4';
            const MOCK_RENDER_FN = jest.fn().mockReturnValueOnce(TEST_STR);

            expect(layouter._commonData.encodeHashSign()(TEST_STR, MOCK_RENDER_FN)).toBe('%231%232%233%234');
            expect(MOCK_RENDER_FN).toHaveBeenCalledWith(TEST_STR);
        });
    });
});
