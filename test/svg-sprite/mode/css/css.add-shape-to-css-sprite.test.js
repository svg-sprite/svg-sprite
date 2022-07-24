'use strict';
/* eslint-disable max-nested-callbacks */

const SVGSpriteCss = require('../../../../lib/svg-sprite/mode/css.js');
const SVGSprite = require('../../../../lib/svg-sprite/sprite.js');

jest.mock('../../../../lib/svg-sprite/sprite.js');

describe('testing CSSSvgSprite._addShapeToCSSSprite', () => {
    const testConstructor = jest.fn();

    beforeEach(() => {
        SVGSprite.mockImplementationOnce((...args) => {
            testConstructor(...args);
        });
    });

    describe('testing common features', () => {
        it('should set _svg as innumerable and writable', () => {
            expect.hasAssertions();

            const mockedSprite = {
                config: {
                    prefix: ''
                },
                data: {
                    shapes: []
                },
                _addUnit: jest.fn()
            };

            SVGSpriteCss.prototype._addShapeToCSSSprite.call(mockedSprite, {}, false, 0, 0, {}, 0, 0);

            expect(
                // eslint-disable-next-line no-prototype-builtins
                mockedSprite.data.shapes[0].propertyIsEnumerable('_svg')
            ).toBe(false);
            expect(() => {
                mockedSprite.data.shapes[0]._svg = false;
            }
            ).not.toThrow();
            expect(mockedSprite.data.shapes[0]._svg).toBe(false);
        });

        describe('test `svg` property getter', () => {
            it('should get shape._svg if defined', () => {
                expect.hasAssertions();

                const TEST_SVG = { TEST: 'svg' };
                const mockedSprite = {
                    config: {
                        prefix: ''
                    },
                    data: {
                        shapes: [{
                            _svg: TEST_SVG
                        }]
                    },
                    _addUnit: jest.fn()
                };

                SVGSpriteCss.prototype._addShapeToCSSSprite.call(mockedSprite, {}, false, 0, 0, {}, 0, 0);

                expect(mockedSprite.data.shapes[0].svg).toBe(TEST_SVG);
            });

            it('should call shape.getSvg with expected transform callback if `shape._svg` property is not defined', () => {
                expect.hasAssertions();

                const TEST_SHAPE_DOM = { setAttribute: jest.fn() };
                const TEST_GET_SVG = jest.fn().mockImplementationOnce((inline, cb) => {
                    cb(TEST_SHAPE_DOM);
                });
                const TEST_ROOT_ATTRS = {
                    root: 'attribute',
                    another: 'test'
                };
                const mockedSprite = {
                    config: {
                        prefix: ''
                    },
                    data: {
                        shapes: []
                    },
                    _addUnit: jest.fn()
                };

                SVGSpriteCss.prototype._addShapeToCSSSprite.call(mockedSprite, {
                    getSVG: TEST_GET_SVG
                }, false, 0, 0, TEST_ROOT_ATTRS, 0, 0);

                jest.fn()(mockedSprite.data.shapes[0].svg);

                expect(TEST_GET_SVG).toHaveBeenCalledWith(true, expect.any(Function));

                expect(TEST_SHAPE_DOM.setAttribute).toHaveBeenCalledTimes(2);
                // eslint-disable-next-line jest/prefer-strict-equal
                expect(TEST_SHAPE_DOM.setAttribute.mock.calls[0]).toEqual([Object.keys(TEST_ROOT_ATTRS)[0], TEST_ROOT_ATTRS.root]);
                // eslint-disable-next-line jest/prefer-strict-equal
                expect(TEST_SHAPE_DOM.setAttribute.mock.calls[1]).toEqual([Object.keys(TEST_ROOT_ATTRS)[1], TEST_ROOT_ATTRS.another]);
            });
        });

        describe('test `svg` property setter', () => {
            it('should save to `_svg` property', () => {
                expect.hasAssertions();

                const TEST_SVG = { TEST: 'svg' };
                const mockedSprite = {
                    config: {
                        prefix: ''
                    },
                    data: {
                        shapes: []
                    },
                    _addUnit: jest.fn()
                };

                SVGSpriteCss.prototype._addShapeToCSSSprite.call(mockedSprite, {}, false, 0, 0, {}, 0, 0);

                mockedSprite.data.shapes[0].svg = TEST_SVG;

                expect(mockedSprite.data.shapes[0]._svg).toBe(TEST_SVG);
            });
        });

        describe('updating shape object', () => {
            it('should update shape with expected object', () => {
                expect.hasAssertions();

                const mockedSprite = {
                    config: {
                        prefix: ''
                    },
                    data: {
                        shapes: []
                    },
                    _addUnit: jest.fn()
                };

                SVGSpriteCss.prototype._addShapeToCSSSprite.call(mockedSprite, {
                    getSVG: jest.fn()
                }, false, 0, 0, {}, 0, 0);

                expect(mockedSprite.data.shapes[0]).toStrictEqual(expect.objectContaining({
                    first: false,
                    last: false,
                    position: {
                        absolute: {
                            x: 0,
                            y: 0,
                            xy: expect.any(String)
                        }
                    }
                }));
            });

            it('should set dimensions.inline to true if config.dimensions is true', () => {
                expect.hasAssertions();

                const mockedSprite = {
                    config: {
                        prefix: '',
                        dimensions: true
                    },
                    data: {
                        shapes: []
                    },
                    _addUnit: jest.fn()
                };

                SVGSpriteCss.prototype._addShapeToCSSSprite.call(mockedSprite, {
                    getSVG: jest.fn()
                }, false, 0, 0, {}, 0, 0);

                expect(mockedSprite.data.shapes[0].dimensions.inline).toBe(true);
            });

            it('should set dimensions.inline to false if config.dimensions is not true', () => {
                expect.hasAssertions();

                const mockedSprite = {
                    config: {
                        prefix: '',
                        dimensions: false
                    },
                    data: {
                        shapes: []
                    },
                    _addUnit: jest.fn()
                };

                SVGSpriteCss.prototype._addShapeToCSSSprite.call(mockedSprite, {
                    getSVG: jest.fn()
                }, false, 0, 0, {}, 0, 0);

                expect(mockedSprite.data.shapes[0].dimensions.inline).toBe(false);
            });
        });
    });

    describe('testing variants', () => {
        describe('setting selector.shape', () => {
            it('should set expected array if needsRegular is passed', () => {
                expect.hasAssertions();

                const mockedSprite = {
                    config: {
                        prefix: 'prefix'
                    },
                    data: {
                        shapes: []
                    },
                    _addUnit: jest.fn()
                };

                SVGSpriteCss.prototype._addShapeToCSSSprite.call(mockedSprite, {
                    base: 'base'
                }, true, 0, 0, {}, 0, 0);

                expect(mockedSprite.data.shapes[0].selector.shape).toStrictEqual([
                    {
                        expression: 'prefix base',
                        raw: 'prefix base',
                        first: true,
                        last: false
                    }, {
                        expression: 'prefix base\\:regular',
                        raw: 'prefix base:regular',
                        first: false,
                        last: true
                    }
                ]);
            });

            it('should set expected array if needsRegular is passed and shape has state', () => {
                expect.hasAssertions();

                const mockedSprite = {
                    config: {
                        prefix: 'prefix'
                    },
                    data: {
                        shapes: []
                    },
                    _addUnit: jest.fn()
                };

                SVGSpriteCss.prototype._addShapeToCSSSprite.call(mockedSprite, {
                    base: 'base',
                    state: 'state'
                }, true, 0, 0, {}, 0, 0);

                expect(mockedSprite.data.shapes[0].selector.shape).toStrictEqual([
                    {
                        expression: 'prefix base:state',
                        raw: 'prefix base:state',
                        first: true,
                        last: false
                    }, {
                        expression: 'prefix base\\:state',
                        raw: 'prefix base:state',
                        first: false,
                        last: true
                    }
                ]);
            });

            it('should set expected array if needsRegular is false and shape has no state', () => {
                expect.hasAssertions();

                const mockedSprite = {
                    config: {
                        prefix: 'prefix',
                        dimensions: '%dims'
                    },
                    data: {
                        shapes: []
                    },
                    _addUnit: jest.fn()
                };

                SVGSpriteCss.prototype._addShapeToCSSSprite.call(mockedSprite, {
                    base: 'base'
                }, false, 0, 0, {}, 0, 0);

                expect(mockedSprite.data.shapes[0].selector.shape).toStrictEqual([
                    {
                        expression: 'prefix base',
                        raw: 'prefix base',
                        first: true,
                        last: true
                    }
                ]);
            });

            it('should set expected array if needsRegular is false and shape has state', () => {
                expect.hasAssertions();

                const mockedSprite = {
                    config: {
                        prefix: 'prefix'
                    },
                    data: {
                        shapes: []
                    },
                    _addUnit: jest.fn()
                };

                SVGSpriteCss.prototype._addShapeToCSSSprite.call(mockedSprite, {
                    base: 'base',
                    state: 'test'
                }, false, 0, 0, {}, 0, 0);

                expect(mockedSprite.data.shapes[0].selector.shape).toStrictEqual([
                    {
                        expression: 'prefix base:test',
                        raw: 'prefix base:test',
                        first: true,
                        last: false
                    },
                    {
                        expression: 'prefix base\\:test',
                        raw: 'prefix base:test',
                        first: false,
                        last: true
                    }
                ]);
            });
        });
    });
});
