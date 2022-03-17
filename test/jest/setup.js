'use strict';

const path = require('path');
const { promises: fs } = require('fs');
const { PNG } = require('pngjs');
const compareSvg2PngHelper = require('../helpers/compare-svg-2-png.js');
const capturePuppeteer = require('../helpers/capture-browser.js');
const isPngsMatched = require('../helpers/is-pngs-matched.js');

const compareSvg2PngAsync = async(receivedSVGPath, resultPNGPath, expectedPNGPath) => {
    const ext = path.extname(resultPNGPath);
    const diffPath = resultPNGPath.replace(`.${ext}`, `.diff.${ext}`);
    return compareSvg2PngHelper(receivedSVGPath, resultPNGPath, expectedPNGPath, diffPath);
};

const capturePuppeteerAsync = async(previewHTML, previewImage, expectedPNGPath) => {
    await capturePuppeteer(previewHTML, previewImage);

    const matchedResult = await isPngsMatched(previewImage, expectedPNGPath);
    const diff = path.join(path.dirname(previewImage), path.basename(previewImage).replace('.png', '.diff.png'));

    if (matchedResult.isEqual) {
        return matchedResult;
    }

    await fs.mkdir(path.dirname(diff), { recursive: true });
    await fs.writeFile(diff, PNG.sync.write(matchedResult.diff));

    return matchedResult;
};

// eslint-disable-next-line jest/require-hook
expect.extend({
    async toBeVisuallyEqualTo(receivedSVGPath, expectedPNGPath) {
        const options = {
            comment: 'SVG is equal to expected PNG',
            isNot: this.isNot,
            promise: this.promise
        };

        const resultPNGPath = path.join(path.dirname(receivedSVGPath), path.basename(receivedSVGPath).replace('.svg', '.svg.png'));
        const { isEqual, matched } = await compareSvg2PngAsync(receivedSVGPath, resultPNGPath, expectedPNGPath);

        const expected = path.basename(receivedSVGPath);
        const received = path.basename(expectedPNGPath);

        const message = isEqual ?
            () => `${this.utils.matcherHint('toBeVisuallyEqualTo', undefined, undefined, options)
            }\n\n` +
                `Expected: not ${this.utils.printExpected(expected)}\n` +
                `Received: ${this.utils.printReceived(received)}` :
            () => `${this.utils.matcherHint('toBeVisuallyEqualTo', undefined, undefined, options)
            }\n\n` +
                `${this.utils.printReceived('Difference:')} ${expected} -> ${received}\n` +
                `Expected: ${this.utils.printExpected('no difference')}\n` +
                `Received: ${this.utils.printReceived(matched)} mismatches`;

        return {
            pass: isEqual,
            message
        };
    },

    async toBeVisuallyCorrectAsHTMLTo(receivedHTMLPath, expectedPNGPath) {
        const options = {
            comment: 'HTML is equal to expected PNG',
            isNot: this.isNot,
            promise: this.promise
        };

        const previewImagePath = path.join(path.dirname(receivedHTMLPath), `${path.basename(receivedHTMLPath)}.png`);
        const { isEqual, matched } = await capturePuppeteerAsync(receivedHTMLPath, previewImagePath, expectedPNGPath);

        const expected = path.basename(receivedHTMLPath);
        const received = path.basename(expectedPNGPath);

        const message = isEqual ?
            () => `${this.utils.matcherHint('toBeVisuallyCorrectAsHTMLTo', undefined, undefined, options)
            }\n\n` +
                `Expected: not ${this.utils.printExpected(expected)}\n` +
                `Received: ${this.utils.printReceived(received)}` :
            () => `${this.utils.matcherHint('toBeVisuallyCorrectAsHTMLTo', undefined, undefined, options)
            }\n\n` +
                `${this.utils.printReceived('Difference:')} ${expected} -> ${received}\n` +
                `Expected: ${this.utils.printExpected('no difference')}\n` +
                `Received: ${this.utils.printReceived(matched)} mismatches`;

        return {
            pass: isEqual,
            message
        };
    }
});
