'use strict';

const svgo = require('svgo');
const svgoTransform = require('../../../lib/svg-sprite/transform/svgo.js');

const TEST_SVG = '<svg></svg>';

jest.mock('svgo');

describe('testing transforms.svgo', () => {
    let noop;

    beforeEach(() => {
        noop = jest.fn();
    });

    it('should set default config with expected params if not provided 1', () => {
        expect.hasAssertions();

        const spriter = {
            config: {
                svg: {
                    xmlDeclaration: false,
                    doctypeDeclaration: false
                }
            },
            error: jest.fn()
        };
        const shape = {
            setSVG: jest.fn(),
            getSVG: jest.fn().mockReturnValue(TEST_SVG)
        };
        const TEST_RESULT = 'test result';

        jest.spyOn(svgo, 'optimize').mockReturnValueOnce(TEST_RESULT);
        svgoTransform(shape, {}, spriter, noop);

        expect(svgo.optimize).toHaveBeenCalledWith(TEST_SVG, { plugins: ['preset-default', {
            active: true,
            name: 'removeXMLProcInst'
        }, {
            active: true,
            name: 'removeDoctype'
        }] });
    });

    it('should set default config with expected params if not provided 2', () => {
        expect.hasAssertions();

        const spriter = {
            config: {
                svg: {
                    xmlDeclaration: true,
                    doctypeDeclaration: true
                }
            },
            error: jest.fn()
        };
        const shape = {
            setSVG: jest.fn(),
            getSVG: jest.fn().mockReturnValue(TEST_SVG)
        };
        const TEST_RESULT = 'test result';

        jest.spyOn(svgo, 'optimize').mockReturnValueOnce(TEST_RESULT);
        svgoTransform(shape, {}, spriter, noop);

        expect(svgo.optimize).toHaveBeenCalledWith(TEST_SVG, { plugins: ['preset-default', {
            active: false,
            name: 'removeXMLProcInst'
        }, {
            active: false,
            name: 'removeDoctype'
        }] });
    });

    it('should add provided config', () => {
        expect.hasAssertions();

        const TEST_PLUGINS = [{
            name: 'preset-default',
            params: {
                overrides: {
                    removeTitle: false,
                    removeDesc: false
                }
            }
        }];
        const spriter = {
            config: {
                svg: {
                    xmlDeclaration: true,
                    doctypeDeclaration: true
                }
            },
            error: jest.fn()
        };
        const shape = {
            setSVG: jest.fn(),
            getSVG: jest.fn().mockReturnValue(TEST_SVG)
        };
        const TEST_RESULT = 'test result';

        jest.spyOn(svgo, 'optimize').mockReturnValueOnce(TEST_RESULT);
        svgoTransform(shape, { plugins: TEST_PLUGINS }, spriter, noop);

        expect(svgo.optimize).toHaveBeenCalledWith(TEST_SVG, { plugins: expect.arrayContaining(TEST_PLUGINS) });
    });

    it('should log about optimizations', () => {
        expect.hasAssertions();

        const MOCKED_ORIGINAL_SVG = 'svgsvg';
        const MOCKED_OPTIMIZED_SVG = 'svg';
        const spriter = {
            config: {
                svg: {},
                log: {
                    transports: [{
                        level: 'debug'
                    }, {
                        level: 'debug'
                    }]
                }
            },
            error: jest.fn(),
            debug: jest.fn()
        };
        const shape = {
            name: 'name',
            setSVG: jest.fn(),
            getSVG: jest.fn().mockReturnValueOnce(MOCKED_ORIGINAL_SVG).mockReturnValueOnce(MOCKED_OPTIMIZED_SVG)
        };

        jest.spyOn(svgo, 'optimize').mockReturnValueOnce({});
        svgoTransform(shape, {}, spriter, noop);

        expect(spriter.debug).toHaveBeenCalledTimes(2);
        expect(spriter.debug).toHaveBeenCalledWith('Optimized "%s" with SVGO (saved %s / %s%%)', 'name', '3 Bytes', 50);
    });

    it('should not log about optimizations', () => {
        expect.hasAssertions();

        const spriter = {
            config: {
                svg: {},
                log: {
                    transports: [{
                        level: 'info'
                    }]
                }
            },
            error: jest.fn(),
            debug: jest.fn()
        };
        const shape = {
            name: 'name',
            setSVG: jest.fn(),
            getSVG: jest.fn().mockReturnValue(TEST_SVG)
        };

        jest.spyOn(svgo, 'optimize').mockReturnValueOnce({});
        svgoTransform(shape, {}, spriter, noop);

        expect(spriter.debug).not.toHaveBeenCalled();
    });

    it('should call callback', () => {
        expect.hasAssertions();

        const spriter = {
            config: {
                svg: {},
                log: {
                    transports: []
                }
            },
            error: jest.fn(),
            debug: jest.fn()
        };
        const shape = {
            name: 'name',
            setSVG: jest.fn(),
            getSVG: jest.fn().mockReturnValue(TEST_SVG)
        };

        jest.spyOn(svgo, 'optimize').mockReturnValueOnce({});
        svgoTransform(shape, {}, spriter, noop);

        expect(noop).toHaveBeenCalledWith(null);
    });

    it('should call callback with error and call spriter.error if error raised', () => {
        expect.hasAssertions();

        const TEST_ERROR = new Error('test');

        const spriter = {
            config: {
                svg: {}
            },
            error: jest.fn(),
            debug: jest.fn()
        };
        const shape = {
            name: 'name',
            setSVG: jest.fn(),
            getSVG: jest.fn().mockReturnValue(TEST_SVG)
        };

        jest.spyOn(svgo, 'optimize').mockImplementationOnce(() => {
            throw TEST_ERROR;
        });
        svgoTransform(shape, {}, spriter, noop);

        expect(noop).toHaveBeenCalledWith(TEST_ERROR);
        expect(spriter.error).toHaveBeenCalledWith('Optimizing "%s" with SVGO failed with error "%s"', 'name', TEST_ERROR);
    });
});
