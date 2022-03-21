'use strict';

const winston = require('winston');
const SVGSpriterConfig = require('../../lib/svg-sprite/config.js');

describe('testing constructor', () => {
    describe('testing log', () => {
        it('should set winston logger', () => {
            expect.hasAssertions();

            const TEST_LOGGER = winston.createLogger({
                transports: [
                    new winston.transports.Console({
                        level: 'info'
                    })
                ],
                level: 'info'
            });
            const config = new SVGSpriterConfig({
                log: TEST_LOGGER
            });

            expect(config.log).toStrictEqual(TEST_LOGGER);
        });
    });
});
