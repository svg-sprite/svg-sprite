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
});
