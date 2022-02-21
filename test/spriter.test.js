const assert = require('assert').strict;
const fs = require('fs');
const path = require('path');
const { Buffer } = require('buffer');
const File = require('vinyl');
const sinon = require('sinon');
const SVGSpriter = require('../lib/svg-sprite.js');

describe('testing SVGSpriter', () => {
    let spriter;
    const TEST_SVG = 'fixture/svg/single/weather-clear.svg';
    const TEST_EMPTY_SVG = '<svg></svg>';

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
                const TEST_SVG = 'fixture/svg/single/weather-clear.svg';
                const TEST_FILE = new File({
                    base: path.dirname(TEST_SVG),
                    path: TEST_SVG,
                    contents: fs.readFileSync(path.join(__dirname, TEST_SVG))
                });

                spriter._queue = {
                    add: sinon.stub()
                };

                spriter.add(TEST_FILE);
                assert.equal(TEST_FILE.base, path.resolve(TEST_FILE.base));

                const addedFile = spriter._queue.add.getCall(0).args[0];
                assert.deepEqual(addedFile, TEST_FILE);
            });
        });

        describe('testing adding non-vinyl file', () => {
            it('should raise an error when passing name with an absolute path', () => {
                assert.throws(() => {
                    spriter.add(TEST_SVG, path.resolve(TEST_SVG), TEST_EMPTY_SVG);
                }, Error);
            });

            it('should raise an error when passing less than 3 arguments', () => {
                assert.throws(() => {
                    spriter.add(TEST_SVG);
                }, Error);
                assert.throws(() => {
                    spriter.add(TEST_SVG, null);
                });
            });

            it('should throw an error if passed file arg is empty', () => {
                assert.throws(() => {
                    spriter.add('', null, TEST_EMPTY_SVG);
                }, Error);
            });

            it('should throw an error if passed name arg is empty and file path is not valid', () => {
                assert.throws(() => {
                    spriter.add(' ', '../', TEST_EMPTY_SVG);
                }, Error);
            });

            it('should throw an error if passed svg arg is empty', () => {
                assert.throws(() => {
                    spriter.add(TEST_SVG, null, '');
                }, Error);
                assert.throws(() => {
                    spriter.add(TEST_SVG, null, ' ');
                }, Error);
            });

            it('should throw an error if passed name differs from the ending of passed file path', () => {
                assert.throws(() => {
                    spriter.add(TEST_SVG, 'absolutely-random-string', TEST_EMPTY_SVG);
                }, Error);
            });

            it('should create vinyl file and add it to _queue', () => {
                spriter._queue = {
                    add: sinon.stub()
                };
                spriter.add(TEST_SVG, 'weather-clear.svg', TEST_EMPTY_SVG);

                const addedFile = spriter._queue.add.getCall(0).args[0];
                assert.deepEqual(addedFile, new File({
                    base: path.dirname(path.resolve(TEST_SVG)),
                    path: TEST_SVG,
                    contents: Buffer.from(TEST_EMPTY_SVG)
                }));
            });
        });
    });
});
