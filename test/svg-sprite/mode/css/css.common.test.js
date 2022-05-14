'use strict';

const SVGSpriteCss = require('../../../../lib/svg-sprite/mode/css.js');
const SVGSpriteBase = require('../../../../lib/svg-sprite/mode/base.js');

jest.mock('../../../../lib/svg-sprite/mode/base.js');

describe('testing SVGSpriteCss', () => {
    it('should have been successfully extended from SVGSpriteBase', () => {
        expect.hasAssertions();
        expect(SVGSpriteCss.prototype.constructor).toBe(SVGSpriteCss);
        expect(SVGSpriteCss.prototype.mode).toBe(SVGSpriteBase.prototype.MODE_CSS);
        expect(SVGSpriteCss.prototype.tmpl).toBe('css');
        expect(SVGSpriteCss.prototype.LAYOUT_VERTICAL).toBe('vertical');
        expect(SVGSpriteCss.prototype.LAYOUT_HORIZONTAL).toBe('horizontal');
        expect(SVGSpriteCss.prototype.LAYOUT_DIAGONAL).toBe('diagonal');
        expect(SVGSpriteCss.prototype.LAYOUT_PACKED).toBe('packed');

        const mockConstructor = jest.fn();
        const [TEST_SPRITER, TEST_CONFIG, TEST_DATA, TEST_KEY] = [{}, {}, {}, {}];

        SVGSpriteBase.mockImplementationOnce((...args) => {
            mockConstructor(...args);
        });

        // eslint-disable-next-line no-new
        new SVGSpriteCss(TEST_SPRITER, TEST_CONFIG, TEST_DATA, TEST_KEY);

        expect(mockConstructor).toHaveBeenLastCalledWith(TEST_SPRITER, TEST_CONFIG, TEST_DATA, TEST_KEY);
    });

    describe('testing _init()', () => {
        describe('processing dimensions', () => {
            it('should concatenate with prefix', () => {
                expect.hasAssertions();

                const mockedSprite = {
                    config: {
                        dimensions: 'test-dims',
                        prefix: 'prefix',
                        svg: {}
                    }
                };
                SVGSpriteCss.prototype._init.call(mockedSprite);

                expect(mockedSprite.config.dimensions).toBe('prefixtest-dims');
            });

            it('should be formatted with prefix', () => {
                expect.hasAssertions();

                const mockedSprite = {
                    config: {
                        dimensions: '%s-test-dims',
                        prefix: 'prefix',
                        svg: {}
                    }
                };
                SVGSpriteCss.prototype._init.call(mockedSprite);

                expect(mockedSprite.config.dimensions).toBe('prefix-test-dims');
            });
        });

        describe('processing mixin', () => {
            it('should trim string', () => {
                expect.hasAssertions();

                const mockedSprite = {
                    config: {
                        svg: {},
                        mixin: ' test-mixin '
                    }
                };
                SVGSpriteCss.prototype._init.call(mockedSprite);

                expect(mockedSprite.config.mixin).toBe('test-mixin');
            });

            it('should be null if string is empty', () => {
                expect.hasAssertions();

                const mockedSprite = {
                    config: {
                        svg: {},
                        mixin: ''
                    }
                };
                SVGSpriteCss.prototype._init.call(mockedSprite);

                expect(mockedSprite.config.mixin).toBeNull();
            });

            it('should be config.common if passed', () => {
                expect.hasAssertions();

                const TEST_COMMON = 'TEST_COMMON';

                const mockedSprite = {
                    config: {
                        svg: {},
                        mixin: false,
                        common: TEST_COMMON
                    }
                };
                SVGSpriteCss.prototype._init.call(mockedSprite);

                expect(mockedSprite.config.mixin).toBe(TEST_COMMON);
            });

            it('should be null if config.common is falsy', () => {
                expect.hasAssertions();

                const mockedSprite = {
                    config: {
                        svg: {},
                        mixin: false,
                        common: false
                    }
                };
                SVGSpriteCss.prototype._init.call(mockedSprite);

                expect(mockedSprite.config.mixin).toBeNull();
            });

            it('should be null if mixin is not passed', () => {
                expect.hasAssertions();

                const mockedSprite = {
                    config: {
                        svg: {}
                    }
                };
                SVGSpriteCss.prototype._init.call(mockedSprite);

                expect(mockedSprite.config.mixin).toBeNull();
            });
        });

        describe('setting data', () => {
            it('should update data respectively', () => {
                expect.hasAssertions();

                const TEST_DATA = { TEST: 'DATA' };
                const mockedSprite = {
                    config: {
                        svg: {},
                        mixin: false,
                        common: false
                    },
                    data: TEST_DATA
                };
                SVGSpriteCss.prototype._init.call(mockedSprite);

                expect(mockedSprite.data).toStrictEqual(expect.objectContaining({
                    ...TEST_DATA,
                    hasCommon: false,
                    common: false,
                    commonName: 'svg-common',
                    hasMixin: false,
                    mixinName: null,
                    includeDimensions: false,
                    spriteWidth: 0,
                    spriteHeight: 0
                }));

                mockedSprite.config.common = 'test-common';

                SVGSpriteCss.prototype._init.call(mockedSprite);

                expect(mockedSprite.data).toStrictEqual(expect.objectContaining({
                    hasCommon: true,
                    common: 'test-common',
                    commonName: 'test-common'
                }));
            });
        });

        it('should set _displaceable respectively', () => {
            expect.hasAssertions();

            const mockedSprite = {
                ...SVGSpriteCss.prototype,
                config: {
                    svg: {},
                    layout: SVGSpriteCss.prototype.LAYOUT_HORIZONTAL
                }
            };
            SVGSpriteCss.prototype._init.call(mockedSprite);

            expect(mockedSprite._displaceable).toBe(true);

            mockedSprite._displaceable = null;
            mockedSprite.config.layout = SVGSpriteCss.prototype.LAYOUT_VERTICAL;
            SVGSpriteCss.prototype._init.call(mockedSprite);

            expect(mockedSprite._displaceable).toBe(true);

            mockedSprite._displaceable = null;
            mockedSprite.config.layout = SVGSpriteCss.prototype.LAYOUT_PACKED;
            SVGSpriteCss.prototype._init.call(mockedSprite);

            expect(mockedSprite._displaceable).toBe(false);
        });

        it('should set _precision respectively', () => {
            expect.hasAssertions();

            const mockedSprite = {
                config: {
                    svg: {
                        precision: 2
                    }
                }
            };
            SVGSpriteCss.prototype._init.call(mockedSprite);

            expect(mockedSprite._precision).toBe(10 ** 2);

            mockedSprite.config.svg.precision = 0;
            SVGSpriteCss.prototype._init.call(mockedSprite);

            expect(mockedSprite._precision).toBe(10 ** 0);

            mockedSprite.config.svg.precision = -1;
            SVGSpriteCss.prototype._init.call(mockedSprite);

            expect(mockedSprite._precision).toBeNull();
        });
    });

    describe('testing layout()', () => {
        it('should layout with expected params', () => {
            expect.hasAssertions();

            const TEST_FILES = {};
            const TEST_CB = jest.fn();
            const TEST_SPRITE = { TEST: 'sprite' };
            const mockedSprite = {
                _layout: jest.fn().mockReturnValueOnce({}),
                _buildSVG: jest.fn().mockReturnValueOnce(TEST_SPRITE),
                _spriter: {
                    verbose: jest.fn()
                },
                _buildCSSResources: jest.fn().mockImplementationOnce((files, cb) => {
                    cb();
                }),
                _buildHTMLExample: jest.fn(),
                key: 'KEY',
                mode: 'MODE'
            };

            SVGSpriteCss.prototype.layout.call(mockedSprite, TEST_FILES, TEST_CB);

            expect(mockedSprite._layout).toHaveBeenCalledWith();
            expect(mockedSprite._buildSVG).toHaveBeenCalledWith('', '');
            expect(mockedSprite._spriter.verbose).toHaveBeenCalledWith('Created «%s» SVG sprite file («%s» mode)', mockedSprite.key, mockedSprite.mode);
            expect(mockedSprite._buildCSSResources).toHaveBeenCalledWith(TEST_FILES, expect.any(Function));
            expect(mockedSprite._buildHTMLExample).toHaveBeenCalledWith(TEST_FILES, TEST_CB);
            expect(TEST_FILES.sprite).toBe(TEST_SPRITE);
        });

        it('should call _buildSVG with expeted params', () => {
            expect.hasAssertions();

            const mockedSprite = {
                _layout: jest.fn().mockReturnValueOnce({ xmlDeclaration: 'test1', doctypeDeclaration: 'test2' }),
                _buildSVG: jest.fn(),
                _spriter: {
                    verbose: jest.fn()
                },
                _buildCSSResources: jest.fn()
            };

            SVGSpriteCss.prototype.layout.call(mockedSprite, {}, jest.fn());

            expect(mockedSprite._buildSVG).toHaveBeenCalledWith('test1', 'test2');
        });

        it('should call cb with error', () => {
            expect.hasAssertions();

            const TEST_CB = jest.fn();
            const TEST_ERROR = new Error('test');
            const mockedSprite = {
                _layout: jest.fn().mockReturnValueOnce({ xmlDeclaration: 'test1', doctypeDeclaration: 'test2' }),
                _buildSVG: jest.fn(),
                _spriter: {
                    verbose: jest.fn()
                },
                _buildCSSResources: jest.fn().mockImplementationOnce((files, cb) => {
                    cb(TEST_ERROR);
                })
            };

            SVGSpriteCss.prototype.layout.call(mockedSprite, {}, TEST_CB);

            expect(TEST_CB).toHaveBeenCalledWith(TEST_ERROR);
        });
    });

    describe('testing _round()', () => {
        it('should round according to precision', () => {
            expect.hasAssertions();

            const mockedSprite = {
                _precision: 10
            };

            expect(SVGSpriteCss.prototype._round.call(mockedSprite, 20.1134)).toBe(20.1);
        });

        it('should return exact value if sprite has no precision', () => {
            expect.hasAssertions();

            const mockedSprite = {};

            expect(SVGSpriteCss.prototype._round.call(mockedSprite, 20.1134)).toBe(20.1134);
        });
    });
});
