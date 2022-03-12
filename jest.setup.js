'use strict';

const path = require('path');
const looksSame = require('looks-same');
const compareSvg2PngHelper = require('./test/helpers/compare-svg-2-png-helper.js');
const capturePuppeteer = require('./test/helpers/capture-puppeteer.js');

const compareSvg2PngAsync = async(receivedSVGPath, resultPNGPath, expectedPNGPath) => {
    return new Promise((resolve, reject) => {
        const ext = path.extname(resultPNGPath);
        const diffPath = resultPNGPath.replace(`.${ext}`, `.diff.${ext}`);
        compareSvg2PngHelper(receivedSVGPath, resultPNGPath, expectedPNGPath, diffPath, (err, result) => {
            if (err) {
                return reject(err);
            }

            resolve({ isEqual: result.equal, difference: JSON.stringify(result.diffClusters) });
        });
    });
};

const capturePuppeteerAsync = async(previewHTML, previewImage, expectedPNGPath) => {
    return new Promise((resolve, reject) => {
        capturePuppeteer(previewHTML, previewImage, async error => {
            if (error) {
                return reject(error);
            }

            await looksSame(previewImage, expectedPNGPath, (error, result) => {
                if (error) {
                    return reject(error);
                }

                resolve({ isEqual: result.equal, difference: JSON.stringify(result.diffClusters) });
            });
        });
    });
};

// eslint-disable-next-line jest/require-hook
expect.extend({
    async toBeVisuallyEqual(receivedSVGPath, expectedPNGPath) {
        const options = {
            comment: 'SVG is equal to expected PNG',
            isNot: this.isNot,
            promise: this.promise
        };

        const resultPNGPath = path.join(path.dirname(receivedSVGPath), receivedSVGPath.replace('.svg', '.svg.png'));
        const { isEqual, difference } = await compareSvg2PngAsync(receivedSVGPath, resultPNGPath, expectedPNGPath);

        const expected = path.basename(receivedSVGPath);
        const received = path.basename(expectedPNGPath);

        const message = isEqual ?
            () => `${this.utils.matcherHint('toBeVisuallyEqual', undefined, undefined, options)
            }\n\n` +
                `Expected: not ${this.utils.printExpected(expected)}\n` +
                `Received: ${this.utils.printReceived(received)}` :
            () => `${this.utils.matcherHint('toBeVisuallyEqual', undefined, undefined, options)
            }\n\n` +
                `${this.utils.printReceived('Difference:')} ${difference}\n` +
                `Expected: ${this.utils.printExpected(expected)}\n` +
                `Received: ${this.utils.printReceived(received)}`;

        return {
            pass: isEqual,
            message
        };
    },

    async toBeVisuallyCorrectAsHTML(receivedHTMLPath, expectedPNGPath) {
        const options = {
            comment: 'HTML is equal to expected PNG',
            isNot: this.isNot,
            promise: this.promise
        };

        const previewImagePath = path.join(path.dirname(receivedHTMLPath), `${path.basename(receivedHTMLPath)}.png`);
        const { isEqual, difference } = await capturePuppeteerAsync(receivedHTMLPath, previewImagePath, expectedPNGPath);

        const expected = path.basename(receivedHTMLPath);
        const received = path.basename(expectedPNGPath);

        const message = isEqual ?
            () => `${this.utils.matcherHint('toBeVisuallyCorrectAsHTML', undefined, undefined, options)
            }\n\n` +
                `Expected: not ${this.utils.printExpected(expected)}\n` +
                `Received: ${this.utils.printReceived(received)}` :
            () => `${this.utils.matcherHint('toBeVisuallyCorrectAsHTML', undefined, undefined, options)
            }\n\n` +
                `${this.utils.printReceived('Difference:')} ${difference}\n` +
                `Expected: ${this.utils.printExpected(expected)}\n` +
                `Received: ${this.utils.printReceived(received)}`;

        return {
            pass: isEqual,
            message
        };
    }
});
