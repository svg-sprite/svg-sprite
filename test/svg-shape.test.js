'use strict';

const { Buffer } = require('buffer');
const path = require('path');
const fs = require('fs');
const File = require('vinyl');
const glob = require('glob');
const getShape = require('../lib/svg-sprite/shape.js');
const SVGSpriter = require('../lib/svg-sprite.js');
const fixXMLString = require('../lib/svg-sprite/utils/fix-xml-string.js');
const ArgumentError = require('../lib/svg-sprite/errors/argument-error.js');

jest.mock('../lib/svg-sprite/utils/fix-xml-string.js', () => jest.fn());

const TEST_SVG = `<svg viewBox="0 0
                                16 16"></svg>`;
const FIXED_TEST_SVG = '<svg viewBox="0 0 16 16"></svg>';

describe('testing SVGShape initialization', () => {
    let spriter;

    beforeEach(() => {
        spriter = new SVGSpriter({
            shape: {
                dest: 'svg'
            }
        });
    });

    it('should not throw an error and should call fixXMLString if fixXMLString is not throwing error', () => {
        expect.hasAssertions();

        fixXMLString.mockReturnValueOnce(FIXED_TEST_SVG);

        expect(() => {
            getShape(new File({
                path: __dirname,
                contents: Buffer.from(TEST_SVG)
            }), spriter);
        }).not.toThrow(ArgumentError);
        expect(fixXMLString).toHaveBeenCalledWith(TEST_SVG);
    });

    it('should throw error and should call fixXMLString if fixXMLString is throwing error', () => {
        expect.hasAssertions();

        fixXMLString.mockImplementation(() => {
            throw new Error('some error');
        });

        expect(() => {
            getShape(new File({
                path: __dirname,
                contents: Buffer.from(TEST_SVG)
            }), spriter);
        }).toThrow(new ArgumentError('Invalid SVG file'));
        expect(fixXMLString).toHaveBeenCalledWith(TEST_SVG);
    });

    it('should throw an error and should call fixXMLString on non-svg files', () => {
        expect.hasAssertions();

        const TEST_NON_SVG = '<div class="test">123</div>';

        expect(() => {
            getShape(new File({
                path: __dirname,
                contents: Buffer.from(TEST_NON_SVG)
            }), spriter);
        }).toThrow(ArgumentError);
        expect(fixXMLString).toHaveBeenCalledWith(TEST_NON_SVG);
    });

    it('should not throw an error and should not call fixXMLString on actual valid svg files', () => {
        expect.hasAssertions();

        const cwd = path.join(__dirname, 'fixture/svg/single');
        const weatherFiles = glob.sync('**/weather*.svg', { cwd });

        expect.assertions(weatherFiles.length * 2);

        for (const weatherFile of weatherFiles) {
            const svgFileBuffer = fs.readFileSync(path.join(cwd, weatherFile));

            expect(() => {
                getShape(new File({
                    path: __dirname,
                    contents: svgFileBuffer
                }), spriter);
            }).not.toThrow(ArgumentError);
            expect(fixXMLString).not.toHaveBeenCalled();
        }
    });
});
