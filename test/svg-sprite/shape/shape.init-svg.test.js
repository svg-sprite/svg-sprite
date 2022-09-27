'use strict';

/* eslint-disable no-new */

const fixXMLString = require('../../../lib/svg-sprite/utils/fix-xml-string.js');
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

jest.mock('../../../lib/svg-sprite/utils/fix-xml-string.js', () => jest.fn());

describe('testing _initSVG()', () => {
    it('should call fixXMLString if passed svg is not normal', () => {
        expect.hasAssertions();

        const TEST_FILE = {
            contents: 's',
            path: 'test_path',
            relative: 'test_relative'
        };
        const TEST_SPRITER = {
            config: {
                shape: {
                    meta: {},
                    align: {}
                }
            },
            verbose: jest.fn()
        };

        fixXMLString.mockReturnValueOnce('<svg></svg>');

        new SVGShape(TEST_FILE, TEST_SPRITER);

        expect(fixXMLString).toHaveBeenCalledWith('s');
    });

    it('should call fixXMLString and throw error if passed svg is not normal', () => {
        expect.hasAssertions();

        const TEST_FILE = {
            contents: 's',
            path: 'test_path',
            relative: 'test_relative'
        };
        const TEST_SPRITER = {
            config: {
                shape: {
                    meta: {},
                    align: {}
                }
            },
            verbose: jest.fn()
        };

        fixXMLString.mockReturnValueOnce('<');

        expect(() => {
            new SVGShape(TEST_FILE, TEST_SPRITER);
        }).toThrow(new Error('Invalid SVG file'));

        expect(fixXMLString).toHaveBeenCalledWith('s');
    });

    it('should call fixXMLString and throw error if passed svg is not normal and fixXMLString thrown error', () => {
        expect.hasAssertions();

        const TEST_FILE = {
            contents: 's',
            path: 'test_path',
            relative: 'test_relative'
        };
        const TEST_SPRITER = {
            config: {
                shape: {
                    meta: {},
                    align: {}
                }
            },
            verbose: jest.fn()
        };

        fixXMLString.mockImplementation(() => {
            throw new Error('error');
        });

        expect(() => {
            new SVGShape(TEST_FILE, TEST_SPRITER);
        }).toThrow(new Error('Invalid SVG file'));
        expect(fixXMLString).toHaveBeenCalledWith('s');
    });

    it('should not call fixXMLString if passed svg is normal', () => {
        expect.hasAssertions();

        const TEST_FILE = {
            contents: '<svg></svg>',
            path: 'test_path',
            relative: 'test_relative'
        };
        const TEST_SPRITER = {
            config: {
                shape: {
                    meta: {},
                    align: {}
                }
            },
            verbose: jest.fn()
        };

        new SVGShape(TEST_FILE, TEST_SPRITER);

        expect(fixXMLString).not.toHaveBeenCalled();
    });

    it('should fill entities', () => {
        expect.hasAssertions();

        const TEST_ENTITIES = [
            '<!ENTITY name1 "value1">',
            '<!ENTITY name2 "value2">'
        ];
        const TEST_FILE = {
            contents: `<svg><!DOCTYPE ${TEST_ENTITIES.join('\n')}>&name1;</svg>`,
            path: 'test_path',
            relative: 'test_relative'
        };
        const TEST_SPRITER = {
            config: {
                shape: {
                    meta: {},
                    align: {}
                }
            },
            verbose: jest.fn()
        };

        const shape = new SVGShape(TEST_FILE, TEST_SPRITER);

        expect(shape.svg.current.replace('\n', '')).toBe('<svg><!DOCTYPE <!ENTITY name1 "value1"><!ENTITY name2 "value2">>value1</svg>');
    });

    it('should throw error if bad svg parsed', () => {
        expect.hasAssertions();

        const TEST_FILE = {
            contents: {
                toString() {
                    return {
                        substr() {
                            return '<<ddfasdfasdf>>';
                        },
                        match() {
                            return 1;
                        }
                    };
                }
            }, path: 'test_path',
            relative: 'test_relative'
        };
        const TEST_SPRITER = {
            config: {
                shape: {
                    meta: {},
                    align: {}
                }
            },
            verbose: jest.fn()
        };

        expect(() => {
            new SVGShape(TEST_FILE, TEST_SPRITER);
        }).toThrow(/Invalid SVG file \(\[xmldom error]/);
    });

    it('should set width and height', () => {
        expect.hasAssertions();

        const TEST_WIDTH = 200;
        const TEST_HEIGHT = 100;

        const TEST_FILE = {
            contents: `<svg width="${TEST_WIDTH}" height="${TEST_HEIGHT}"></svg>`,
            path: 'test_path',
            relative: 'test_relative'
        };
        const TEST_SPRITER = {
            config: {
                shape: {
                    meta: {},
                    align: {}
                }
            },
            verbose: jest.fn()
        };

        const shape = new SVGShape(TEST_FILE, TEST_SPRITER);

        expect(shape.width).toBe(TEST_WIDTH);
        expect(shape.height).toBe(TEST_HEIGHT);
    });

    it('should set width, height and viewBox to false', () => {
        expect.hasAssertions();

        const TEST_FILE = {
            contents: '<svg></svg>',
            path: 'test_path',
            relative: 'test_relative'
        };
        const TEST_SPRITER = {
            config: {
                shape: {
                    meta: {},
                    align: {}
                }
            },
            verbose: jest.fn()
        };

        const shape = new SVGShape(TEST_FILE, TEST_SPRITER);

        expect(shape.width).toBe(false);
        expect(shape.height).toBe(false);
        expect(shape.viewBox).toBe(false);
    });

    it('should set expected viewBox', () => {
        expect.hasAssertions();

        const TEST_FILE = {
            contents: '<svg viewBox="0 1 2 3 4 5 20d ten"></svg>',
            path: 'test_path',
            relative: 'test_relative'
        };
        const TEST_SPRITER = {
            config: {
                shape: {
                    meta: {},
                    align: {}
                }
            },
            verbose: jest.fn()
        };

        const shape = new SVGShape(TEST_FILE, TEST_SPRITER);

        expect(shape.viewBox).toStrictEqual([0, 1, 2, 3, 4, 5, 20, Number.NaN]);
    });

    it('should fill viewBox', () => {
        expect.hasAssertions();

        const TEST_FILE = {
            contents: '<svg viewBox="0 1"></svg>',
            path: 'test_path',
            relative: 'test_relative'
        };
        const TEST_SPRITER = {
            config: {
                shape: {
                    meta: {},
                    align: {}
                }
            },
            verbose: jest.fn()
        };

        const shape = new SVGShape(TEST_FILE, TEST_SPRITER);

        expect(shape.viewBox).toStrictEqual([0, 1, 0, 0]);
    });

    it('should set title and description to null', () => {
        expect.hasAssertions();

        const TEST_FILE = {
            contents: '<svg></svg>',
            path: 'test_path',
            relative: 'test_relative'
        };

        const shape = new SVGShape(TEST_FILE, TEST_SPRITER);

        expect(shape.title).toBeNull();
        expect(shape.description).toBeNull();
    });

    it('should set title and description accordingly to svg', () => {
        expect.hasAssertions();

        const TEST_FILE = {
            contents: '<svg><title>test title</title><desc>test description</desc></svg>',
            path: 'test_path',
            relative: 'test_relative'
        };
        const shape = new SVGShape(TEST_FILE, TEST_SPRITER);

        expect(shape.title.toString()).toBe('<title>test title</title>');
        expect(shape.description.toString()).toBe('<desc>test description</desc>');
    });
});
