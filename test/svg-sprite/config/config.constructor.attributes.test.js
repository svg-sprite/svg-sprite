'use strict';

const path = require('path');
const SVGSpriterConfig = require('../../../lib/svg-sprite/config.js');
const { paths } = require('../../helpers/constants.js');

describe('testing initial attributes', () => {
    it('should set dest from config.dest', () => {
        expect.hasAssertions();

        const config = new SVGSpriterConfig({
            dest: paths.tmp
        });

        expect(config.dest).toBe(path.resolve(paths.tmp));
    });

    it('should set dest as current directory if not provided', () => {
        expect.hasAssertions();

        const config = new SVGSpriterConfig({});

        expect(config.dest).toBe(path.resolve('.'));
    });

    it('should set variables accordingly to config.variables', () => {
        expect.hasAssertions();

        const TEST_VARIABLES = { TEST_1: 1, TEST_2: 2 };
        const config = new SVGSpriterConfig({ variables: TEST_VARIABLES });

        expect(config.variables).toStrictEqual(TEST_VARIABLES);
        expect(config.variables).not.toBe(TEST_VARIABLES);
    });
});
