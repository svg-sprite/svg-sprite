'use strict';

const winston = require('winston');
const SVGSpriterConfig = require('../../../lib/svg-sprite/config.js');

describe('testing log', () => {
    const getLogger = () => {
        return winston.createLogger({
            transports: [
                new winston.transports.Console({
                    level: 'info'
                })
            ],
            level: 'info'
        });
    };

    it('should set winston logger if it passed as config.log', () => {
        expect.hasAssertions();

        const TEST_LOGGER = getLogger();
        const config = new SVGSpriterConfig({
            log: TEST_LOGGER
        });

        expect(config.log).toStrictEqual(TEST_LOGGER);
    });

    it('should call debug 6 times and verbose 1 time if shape has no meta and align', () => {
        expect.hasAssertions();

        const TEST_LOGGER = getLogger();

        jest.spyOn(TEST_LOGGER, 'debug');
        jest.spyOn(TEST_LOGGER, 'verbose');

        // eslint-disable-next-line no-new
        new SVGSpriterConfig({
            log: TEST_LOGGER
        });

        expect(TEST_LOGGER.debug).toHaveBeenCalledTimes(6);
        expect(TEST_LOGGER.debug.mock.calls[0][0]).toBe('Started logging');
        expect(TEST_LOGGER.debug.mock.calls[1][0]).toBe('Prepared general options');
        expect(TEST_LOGGER.debug.mock.calls[2][0]).toBe('Prepared `shape` options');
        expect(TEST_LOGGER.debug.mock.calls[3][0]).toBe('Prepared `svg` options');
        expect(TEST_LOGGER.debug.mock.calls[4][0]).toBe('Prepared `mode` options');
        expect(TEST_LOGGER.debug.mock.calls[5][0]).toBe('Prepared `variables` options');
        expect(TEST_LOGGER.verbose).toHaveBeenCalledTimes(1);
        expect(TEST_LOGGER.verbose).toHaveBeenCalledWith('Initialized spriter configuration');
    });

    describe('should create winston logger', () => {
        const originalConsole = console;

        beforeAll(() => {
            // suppressing console
            console._stdout = {
                write: jest.fn()
            };
        });

        afterAll(() => {
            global.console = originalConsole;
        });

        it.each(['info', 'verbose', 'debug'])(
            'non-silent with %p log level if passed config.log has %p value',
            logLevel => {
                expect.hasAssertions();

                const config = new SVGSpriterConfig({
                    log: logLevel
                });

                expect(config.log).toBeDefaultWinstonLogger();
                expect(config.log.transports[0].level).toBe(logLevel);
                expect(config.log.transports[0].silent).toBe(false);
            }
        );

        it('non-silent with info level if passed truthy value', () => {
            expect.hasAssertions();

            const config = new SVGSpriterConfig({
                log: true
            });

            expect(config.log).toBeDefaultWinstonLogger();
            expect(config.log.transports[0].level).toBe('info');
            expect(config.log.transports[0].silent).toBe(false);
        });

        it('silent with info level if passed falsy value', () => {
            expect.hasAssertions();

            const config = new SVGSpriterConfig({
                log: false
            });

            expect(config.log).toBeDefaultWinstonLogger();
            expect(config.log.transports[0].level).toBe('info');
            expect(config.log.transports[0].silent).toBe(true);
        });
    });
});
