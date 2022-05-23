'use strict';

const SVGSpriteCss = require('../../../../lib/svg-sprite/mode/css.js');
const SVGSprite = require('../../../../lib/svg-sprite/sprite.js');

jest.mock('../../../../lib/svg-sprite/sprite.js');

describe('testing _buildSVG', () => {
    const testConstructor = jest.fn();

    beforeEach(() => {
        SVGSprite.mockImplementationOnce((...args) => {
            testConstructor(...args);
        });
    });

    it('should include rootAttributes', () => {
        expect.hasAssertions();

        const TEST_ATTRIBUTES = {
            TEST: 1,
            TEST_2: 2
        };
        const mockedSprite = {
            config: {
                svg: {
                    rootAttributes: TEST_ATTRIBUTES
                }
            },
            data: {
                shapes: {}
            },
            declaration: jest.fn(),
            _spriter: {
                config: {}
            },
            _addCacheBusting: jest.fn(),
            transform: []
        };

        SVGSpriteCss.prototype._buildSVG.call(mockedSprite);

        expect(testConstructor).toHaveBeenCalledWith(undefined, undefined, expect.objectContaining(TEST_ATTRIBUTES), true, undefined);
    });

    it('should set width and height', () => {
        expect.hasAssertions();

        const TEST_WIDTH = 200;
        const TEST_HEIGHT = 400;

        const mockedSprite = {
            config: {
                svg: {
                    rootAttributes: {},
                    dimensionAttributes: true
                }
            },
            data: {
                shapes: {},
                spriteWidth: TEST_WIDTH,
                spriteHeight: TEST_HEIGHT
            },
            declaration: jest.fn(),
            _spriter: {
                config: {}
            },
            _addCacheBusting: jest.fn(),
            transform: []
        };

        SVGSpriteCss.prototype._buildSVG.call(mockedSprite);

        expect(testConstructor).toHaveBeenCalledWith(undefined, undefined, {
            height: TEST_HEIGHT,
            viewBox: `0 0 ${TEST_WIDTH} ${TEST_HEIGHT}`,
            width: TEST_WIDTH
        }, true, undefined);
    });

    it('should call declaration with expected params', () => {
        expect.hasAssertions();

        const TEST_XML_DECLARATION = 'test xml declaration';
        const TEST_DOC_DECLARATION = 'test doctype declaration';
        const TEST_FIRST_RESULT = 'first result';
        const TEST_SECOND_RESULT = 'second result';

        const mockedSprite = {
            config: {
                svg: {
                    rootAttributes: {},
                    dimensionAttributes: true,
                    xmlDeclaration: 'xmlDeclaration',
                    doctypeDeclaration: 'doctypeDeclaration'
                }
            },
            data: {
                shapes: {}
            },
            declaration: jest.fn().mockReturnValueOnce(TEST_FIRST_RESULT).mockReturnValueOnce(TEST_SECOND_RESULT),
            _spriter: {
                config: {}
            },
            _addCacheBusting: jest.fn(),
            transform: []
        };

        SVGSpriteCss.prototype._buildSVG.call(mockedSprite, TEST_XML_DECLARATION, TEST_DOC_DECLARATION);

        expect(mockedSprite.declaration).toHaveBeenCalledTimes(2);
        // eslint-disable-next-line jest/prefer-strict-equal
        expect(mockedSprite.declaration.mock.calls[0]).toEqual([mockedSprite.config.svg.xmlDeclaration, TEST_XML_DECLARATION]);
        // eslint-disable-next-line jest/prefer-strict-equal
        expect(mockedSprite.declaration.mock.calls[1]).toEqual([mockedSprite.config.svg.doctypeDeclaration, TEST_DOC_DECLARATION]);
    });

    it('should add files to svg', () => {
        expect.hasAssertions();

        const testAdd = jest.fn();
        const TEST_SHAPE_1 = { TEST: 1 };
        const TEST_SHAPE_2 = { TEST: 2 };
        const mockedSprite = {
            config: {
                svg: {
                    rootAttributes: {}
                }
            },
            data: {
                shapes: {
                    shape1: {
                        svg: TEST_SHAPE_1
                    },
                    shape2: {
                        svg: TEST_SHAPE_2
                    }
                }
            },
            declaration: jest.fn(),
            _spriter: {
                config: {}
            },
            _addCacheBusting: jest.fn(),
            transform: []
        };

        SVGSprite.mockRestore();
        SVGSprite.mockImplementationOnce(() => {
            return {
                add: testAdd,
                toFile: jest.fn()
            };
        });

        SVGSpriteCss.prototype._buildSVG.call(mockedSprite);

        expect(testAdd).toHaveBeenCalledWith([TEST_SHAPE_1, TEST_SHAPE_2]);
    });

    it('should call toFile', () => {
        expect.hasAssertions();

        const testToFile = jest.fn();
        const TEST_CACHE_KEY = 'test cache key';
        const testCacheBusting = jest.fn().mockReturnValueOnce(TEST_CACHE_KEY);
        const mockedSprite = {
            config: {
                svg: {
                    rootAttributes: {}
                }
            },
            data: {
                shapes: {}
            },
            declaration: jest.fn(),
            _spriter: {
                config: {
                    dest: '.'
                }
            },
            _addCacheBusting: testCacheBusting
        };

        const TEST_SVG = {
            add: jest.fn(),
            toFile: testToFile
        };

        SVGSprite.mockRestore();
        SVGSprite.mockImplementationOnce(() => {
            return TEST_SVG;
        });

        SVGSpriteCss.prototype._buildSVG.call(mockedSprite);

        expect(testCacheBusting).toHaveBeenCalledWith(TEST_SVG);

        expect(testToFile).toHaveBeenCalledWith('.', TEST_CACHE_KEY);
    });
});
