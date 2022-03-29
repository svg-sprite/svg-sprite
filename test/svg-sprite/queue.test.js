'use strict';

const { EventEmitter } = require('events');
const path = require('path');
const SVGSpriterQueue = require('../../lib/svg-sprite/queue.js');
const Shape = require('../../lib/svg-sprite/shape.js');

jest.mock('../../lib/svg-sprite/shape.js');
jest.mock('events');

describe('testing Queue', () => {
    describe('testing constructor()', () => {
        it('should be instance of EventEmitter', () => {
            expect.hasAssertions();

            const queue = new SVGSpriterQueue({ debug: jest.fn() });

            expect(queue).toBeInstanceOf(EventEmitter);
        });

        it('should set initial values and debug to console', () => {
            expect.hasAssertions();

            const spriter = { debug: jest.fn() };
            const queue = new SVGSpriterQueue(spriter);

            expect(queue._spriter).toBe(spriter);
            expect(queue._files).toStrictEqual([]);
            expect(queue.active).toBe(0);
            expect(spriter.debug).toHaveBeenCalledWith('Created processing queue instance');
        });

        it('should add events', () => {
            expect.hasAssertions();

            const testFn = jest.fn();

            /**
             * @returns {object} mock result
             */
            const testEventEmitter = function() {
                return {
                    on(...args) {
                        testFn(...args);
                    },
                    process: jest.fn()
                };
            };

            EventEmitter.mockImplementation(testEventEmitter);
            // eslint-disable-next-line no-new
            new SVGSpriterQueue({ debug: jest.fn() });

            expect(testFn).toHaveBeenCalledTimes(2);
            expect(testFn.mock.calls[0][0]).toBe('add');
            expect(testFn.mock.calls[1][0]).toBe('remove');
        });
    });

    describe('testing add()', () => {
        it('should debug info, add file to _files and emit "add" event', () => {
            expect.hasAssertions();

            const spriter = { debug: jest.fn() };
            const TEST_FILE_NAME = 'test.svg';
            const TEST_FILE = {
                path: TEST_FILE_NAME
            };
            const queue = new SVGSpriterQueue(spriter);

            jest.spyOn(queue, 'emit');

            queue.add(TEST_FILE);

            expect(spriter.debug).toHaveBeenLastCalledWith('Added "%s" to processing queue', path.basename(TEST_FILE_NAME));
            expect(queue._files).toStrictEqual([TEST_FILE]);
            expect(queue.emit).toHaveBeenCalledWith('add');
        });
    });

    describe('testing remove()', () => {
        let spriter;
        let queue;

        const TEST_DISTRIBUTE = [{ TEST: 'distribute' }];
        const TEST_SHAPE = { distribute: () => ([...TEST_DISTRIBUTE]) };

        beforeEach(() => {
            spriter = { debug: jest.fn(), _shapes: [] };
            queue = new SVGSpriterQueue(spriter);
        });

        it('should add shape to spriter', () => {
            expect.hasAssertions();

            queue.remove(null, TEST_SHAPE);

            expect(spriter._shapes).toStrictEqual(TEST_DISTRIBUTE);
        });

        it('should emit "remove" if active count is more than 1', () => {
            expect.hasAssertions();

            queue.active = 2;
            jest.spyOn(queue, 'emit');
            queue.remove(null, TEST_SHAPE);

            expect(queue.emit).toHaveBeenCalledWith('remove');
        });

        it('should emit "empty" if active count is 1', () => {
            expect.hasAssertions();

            queue.active = 1;
            jest.spyOn(queue, 'emit');
            queue.remove(null, TEST_SHAPE);

            expect(queue.emit).toHaveBeenCalledWith('empty');
        });
    });

    describe('testing process()', () => {
        let spriter;
        let queue;

        beforeEach(() => {
            spriter = {
                debug: jest.fn(),
                _limit: 10,
                error: jest.fn(),
                _transformShape: jest.fn().mockImplementation((shape, cb) => {
                    return cb(null);
                })
            };
            queue = new SVGSpriterQueue(spriter);
        });

        it('should not do anything if files is empty', () => {
            expect.hasAssertions();

            queue._files = [];
            jest.spyOn(queue._files, 'shift');
            queue.process();

            expect(queue._files.shift).not.toHaveBeenCalled();
        });

        it('should not do anything if active is exceeding limit', () => {
            expect.hasAssertions();

            queue._files = [1];
            queue.active = 11;
            jest.spyOn(queue._files, 'shift');
            queue.process();

            expect(queue._files.shift).not.toHaveBeenCalled();
        });

        describe('testing positive case', () => {
            it('should increase active count call spriter._transformShape and shape.complement and then', async() => {
                expect.hasAssertions();

                const TEST_FILE = 'file';
                const TEST_SHAPE = {
                    complement: jest.fn().mockImplementation(fn => {
                        fn(TEST_SHAPE);
                    })
                };
                const testFn = jest.fn();
                queue._files = [1];
                queue.active = 2;
                jest.spyOn(queue._files, 'shift').mockReturnValueOnce(TEST_FILE);
                Shape.mockImplementation(() => {
                    return TEST_SHAPE;
                });

                jest.spyOn(queue, 'remove').mockImplementation(() => {
                    testFn();
                });

                queue.process();
                await new Promise(setImmediate); // await all async code to finish (async.waterfall)

                expect(queue.active).toBe(3);
                expect(spriter._transformShape).toHaveBeenCalledWith(TEST_SHAPE, expect.any(Function));
                expect(TEST_SHAPE.complement).toHaveBeenCalledWith(expect.any(Function));
                expect(testFn).toHaveBeenCalledWith();
            });

            it('should not increase active call _spriter.error and emit "remove" event if error occured', async() => {
                expect.hasAssertions();

                const TEST_FILE = { path: 'file' };
                const TEST_ERROR_MESSAGE = 'error';
                queue._files = [1];
                queue.active = 2;
                jest.spyOn(queue._files, 'shift').mockReturnValueOnce(TEST_FILE);
                jest.spyOn(queue, 'emit');
                Shape.mockImplementation(() => {
                    throw new Error(TEST_ERROR_MESSAGE);
                });

                queue.process();
                await new Promise(setImmediate); // await all async code to finish (async.waterfall)

                expect(queue.active).toBe(2);
                expect(spriter.error).toHaveBeenCalledWith('Skipping "%s" (%s)', 'file', TEST_ERROR_MESSAGE);
                expect(queue.emit).toHaveBeenCalledWith('remove');
            });

            it('should not increase active call _spriter.error and emit "remove" event if error occured and active is zero', async() => {
                expect.hasAssertions();

                const TEST_FILE = { path: 'file' };
                queue._files = [1];
                queue.active = 0;
                jest.spyOn(queue._files, 'shift').mockReturnValueOnce(TEST_FILE);
                jest.spyOn(queue, 'emit');
                Shape.mockImplementation(() => {
                    throw new Error('test');
                });

                queue.process();
                await new Promise(setImmediate); // await all async code to finish (async.waterfall)

                expect(queue.active).toBe(0);
                expect(queue.emit).toHaveBeenCalledWith('empty');
            });
        });
    });
});
