'use strict';

/* eslint-disable max-nested-callbacks, jest/prefer-expect-assertions */
const fs = require('fs');
const path = require('path');
const { Buffer } = require('buffer');
const File = require('vinyl');
const SVGSpriter = require('../lib/svg-sprite.js');

const TEST_SVG = 'fixture/svg/single/weather-clear.svg';
const TEST_EMPTY_SVG = '<svg></svg>';

describe('testing SVGSpriter', () => {
    let spriter;

    beforeEach(() => {
        spriter = new SVGSpriter({
            shape: {
                dest: 'svg'
            }
        });
    });

    describe('testing add()', () => {
        describe('testing adding vinyl file', () => {
            it('should transform file.base of Vinyl file with path.resolve and add to _queue as vinyl file', () => {
                const TEST_FILE = new File({
                    base: path.dirname(TEST_SVG),
                    path: TEST_SVG,
                    contents: fs.readFileSync(path.join(__dirname, TEST_SVG))
                });

                spriter._queue = {
                    add: jest.fn()
                };

                spriter.add(TEST_FILE);

                expect(TEST_FILE.base).toStrictEqual(path.resolve(TEST_FILE.base));
                expect(spriter._queue.add).toHaveBeenCalledWith(TEST_FILE);
            });
        });

        describe('testing adding non-vinyl file', () => {
            it('should raise an error when passing name with an absolute path', () => {
                expect(() => {
                    spriter.add(TEST_SVG, path.resolve(TEST_SVG), TEST_EMPTY_SVG);
                }).toThrow(Error);
            });

            it('should raise an error when passing less than 3 arguments', () => {
                expect(() => {
                    spriter.add(TEST_SVG);
                }).toThrow(Error);
                expect(() => {
                    spriter.add(TEST_SVG, null);
                }).toThrow(Error);
            });

            it('should throw an error if passed file arg is empty', () => {
                expect(() => {
                    spriter.add('', null, TEST_EMPTY_SVG);
                }).toThrow(Error);
            });

            it('should throw an error if passed name arg is empty and file path is not valid', () => {
                expect(() => {
                    spriter.add(' ', '../', TEST_EMPTY_SVG);
                }).toThrow(Error);
            });

            it('should throw an error if passed svg arg is empty', () => {
                expect(() => {
                    spriter.add(TEST_SVG, null, '');
                }).toThrow(Error);
                expect(() => {
                    spriter.add(TEST_SVG, null, ' ');
                }).toThrow(Error);
            });

            it('should throw an error if passed name differs from the ending of passed file path', () => {
                expect(() => {
                    spriter.add(TEST_SVG, 'absolutely-random-string', TEST_EMPTY_SVG);
                }).toThrow(Error);
            });

            it('should create vinyl file from passed relative file and add it to _queue', () => {
                spriter._queue = {
                    add: jest.fn()
                };
                spriter.add(TEST_SVG, 'weather-clear.svg', TEST_EMPTY_SVG);

                expect(spriter._queue.add).toHaveBeenCalledWith(new File({
                    base: path.dirname(path.resolve(TEST_SVG)),
                    path: path.resolve(TEST_SVG),
                    contents: Buffer.from(TEST_EMPTY_SVG)
                }));
            });

            it('should create vinyl file from passed absolute file and add it to _queue', () => {
                spriter._queue = {
                    add: jest.fn()
                };
                spriter.add(path.resolve(TEST_SVG), 'weather-clear.svg', TEST_EMPTY_SVG);

                expect(spriter._queue.add).toHaveBeenCalledWith(new File({
                    base: path.dirname(path.resolve(TEST_SVG)),
                    path: path.resolve(TEST_SVG),
                    contents: Buffer.from(TEST_EMPTY_SVG)
                }));
            });
        });
    });
});
