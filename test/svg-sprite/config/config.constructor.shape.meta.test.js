'use strict';

const fs = require('fs');
const path = require('path');
const { Buffer } = require('buffer');
const yaml = require('js-yaml');
const SVGSpriterConfig = require('../../../lib/svg-sprite/config.js');

jest.mock('fs');
jest.mock('yaml');

describe('testing SVGSpriterConfig shape.meta', () => {
    it('should copy fields from config.shape', () => {
        expect.hasAssertions();

        const TEST_SHAPE = { TEST_1: 1, TEST_2: 2 };
        const config = new SVGSpriterConfig({ shape: TEST_SHAPE });

        expect(config.shape).toStrictEqual(expect.objectContaining(TEST_SHAPE));
    });

    it('should set empty meta if shape is not passed', () => {
        expect.hasAssertions();

        const config = new SVGSpriterConfig({});

        expect(config.shape.meta).toStrictEqual({});
    });

    it('should set empty meta if shape.meta is not passed', () => {
        expect.hasAssertions();

        const config = new SVGSpriterConfig({ shape: {} });

        expect(config.shape.meta).toStrictEqual({});
    });

    it('should set empty meta if plain object is passed', () => {
        expect.hasAssertions();

        const config = new SVGSpriterConfig({ shapa: { meta: { TEST: 1 } } });

        expect(config.shape.meta).toStrictEqual({});
    });

    it('should set empty meta if passed anything but string', () => {
        expect.hasAssertions();

        const config = new SVGSpriterConfig({ shape: { meta: true } });

        expect(config.shape.meta).toStrictEqual({});
    });

    describe('if string passed', () => {
        it('should check stat if passed path to the file', () => {
            expect.hasAssertions();

            jest.spyOn(fs, 'lstatSync');
            // eslint-disable-next-line no-new
            new SVGSpriterConfig({ shape: { meta: '.' } });

            expect(fs.lstatSync).toHaveBeenCalledWith(path.resolve('.'));
        });

        it('should set empty object if stat is not a file', () => {
            expect.hasAssertions();

            jest.spyOn(fs, 'lstatSync').mockReturnValueOnce({
                isSymbolicLink: jest.fn().mockReturnValueOnce(false),
                isFile: jest.fn().mockReturnValueOnce(false)
            });

            const config = new SVGSpriterConfig({ shape: { meta: '.' } });

            expect(config.shape.meta).toStrictEqual({});
        });

        it('should set object read from correct yaml if stat is a file', () => {
            expect.hasAssertions();

            const TEST_FILE_NAME = './TEST_FILE_NAME.svg';
            const TEST_FILE_CONTENTS = Buffer.from('some kind of file');
            const TEST_META = {
                [TEST_FILE_NAME]: {
                    title: 'test',
                    description: 'test'
                }
            };

            jest.spyOn(fs, 'lstatSync').mockReturnValueOnce({
                isSymbolicLink: jest.fn().mockReturnValueOnce(false),
                isFile: jest.fn().mockReturnValueOnce(true)
            });
            jest.spyOn(fs, 'readFileSync').mockReturnValueOnce(TEST_FILE_CONTENTS);
            jest.spyOn(yaml, 'load').mockReturnValueOnce(TEST_META);

            const config = new SVGSpriterConfig({ shape: { meta: '.' } });

            expect(yaml.load).toHaveBeenCalledWith(TEST_FILE_CONTENTS);
            expect(config.shape.meta).toStrictEqual({
                [path.join(path.dirname(TEST_FILE_NAME), path.basename(TEST_FILE_NAME, '.svg'))]: TEST_META[TEST_FILE_NAME]
            });
        });

        it('should set empty object if data from correct yaml contains non-object values and if stat is a file', () => {
            expect.hasAssertions();

            const TEST_FILE_NAME = './TEST_FILE_NAME.svg';
            const TEST_FILE_CONTENTS = Buffer.from('some kind of file');
            const TEST_META = {
                [TEST_FILE_NAME]: false
            };

            jest.spyOn(fs, 'lstatSync').mockReturnValueOnce({
                isSymbolicLink: jest.fn().mockReturnValueOnce(false),
                isFile: jest.fn().mockReturnValueOnce(true)
            });
            jest.spyOn(fs, 'readFileSync').mockReturnValueOnce(TEST_FILE_CONTENTS);
            jest.spyOn(yaml, 'load').mockReturnValueOnce(TEST_META);

            const config = new SVGSpriterConfig({ shape: { meta: '.' } });

            expect(config.shape.meta).toStrictEqual({});
        });

        it('should follow symlink', () => {
            expect.hasAssertions();

            const TEST_DEST = '.';

            jest.spyOn(fs, 'readlinkSync').mockReturnValueOnce(TEST_DEST);
            jest.spyOn(fs, 'statSync').mockReturnValueOnce({
                isFile: jest.fn().mockReturnValueOnce(false)
            });

            jest.spyOn(fs, 'lstatSync').mockReturnValueOnce({
                isSymbolicLink: jest.fn().mockReturnValueOnce(true)
            });

            // eslint-disable-next-line no-new
            new SVGSpriterConfig({ shape: { meta: '.' } });

            expect(fs.readlinkSync).toHaveBeenCalledWith(path.resolve('.'));
            expect(fs.statSync).toHaveBeenCalledWith(TEST_DEST);
        });
    });
});
