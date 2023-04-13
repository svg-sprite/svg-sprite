'use strict';

const SVGSpriterConfig = require('../../../lib/svg-sprite/config.js');

describe('testing filter', () => {
    let config;
    const modes = ['stack', 'defs', 'view', 'css', 'symbol'];

    beforeEach(() => {
        config = new SVGSpriterConfig({});
    });

    it('should return empty object if empty object passed', () => {
        expect.hasAssertions();
        expect(config.filter({})).toStrictEqual({});
    });

    it.each(modes)('should filter plainObjects and set %p mode if mode is not specified', mode => {
        expect.hasAssertions();
        expect(
            config.filter({
                [mode]: {}
            })
        ).toStrictEqual({ [mode]: { mode } });
        expect(
            config.filter({
                [mode]: true
            })
        ).toStrictEqual({ [mode]: { mode } });
    });

    it.each(modes)('should filter plainObjects and set mode %p if mode is specified', mode => {
        expect.hasAssertions();
        expect(
            config.filter({
                css: {
                    mode
                }
            })
        ).toStrictEqual({ css: { mode } });
    });

    it('should ignore plainObjects with bad config', () => {
        expect.hasAssertions();
        expect(
            config.filter({
                css: {
                    mode: 'nonsense'
                }
            })
        ).toStrictEqual({});
        expect(
            config.filter({
                nonsense: {}
            })
        ).toStrictEqual({});
    });

    it.each(modes)('should ignore if passed value is not object and not true', mode => {
        expect.hasAssertions();
        expect(
            config.filter({
                [mode]: 'nonsense'
            })
        ).toStrictEqual({});
        expect(
            config.filter({
                [mode]: false
            })
        ).toStrictEqual({});
        expect(
            config.filter({
                [mode]: Symbol('test')
            })
        ).toStrictEqual({});
    });
});
