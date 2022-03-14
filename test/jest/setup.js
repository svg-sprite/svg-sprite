'use strict';

const path = require('path');
const looksSame = require('looks-same');
const compareSvg2PngHelper = require('../helpers/compare-svg-2-png-helper.js');
const capturePuppeteer = require('../helpers/capture-puppeteer.js');

const compareSvg2PngAsync = async(receivedSVGPath, resultPNGPath, expectedPNGPath) => {
    return new Promise((resolve, reject) => {
        const ext = path.extname(resultPNGPath);
        const diffPath = resultPNGPath.replace(`.${ext}`, `.diff.${ext}`);
        compareSvg2PngHelper(receivedSVGPath, resultPNGPath, expectedPNGPath, diffPath, (error, result) => {
            if (error) {
                return reject(error);
            }

            resolve({ isEqual: result.equal, difference: JSON.stringify(result.diffClusters) });
        });
    });
};

const capturePuppeteerAsync = (previewHTML, previewImage, expectedPNGPath) => {
    return new Promise((resolve, reject) => {
        capturePuppeteer(previewHTML, previewImage, error => {
            if (error) {
                return reject(error);
            }

            looksSame(previewImage, expectedPNGPath, (error, result) => {
                if (error) {
                    return reject(error);
                }

                if (!result.equal) {
                    looksSame.createDiff({
                        reference: expectedPNGPath,
                        current: previewImage,
                        diff: path.join(path.dirname(previewImage), path.basename(previewImage).replace('.png', '.diff.png')),
                        highlightColor: '#ff00ff'
                    }, () => {});
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

        const resultPNGPath = path.join(path.dirname(receivedSVGPath), path.basename(receivedSVGPath).replace('.svg', '.svg.png'));
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
