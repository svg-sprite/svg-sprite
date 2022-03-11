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

            resolve(result.equal);
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

                resolve(result.equal);
            });
        });
    });
};

// eslint-disable-next-line jest/require-hook
expect.extend({
    async toBeVisuallyEqual(receivedSVGPath, resultPNGPath, expectedPNGPath) {
        const isEqual = await compareSvg2PngAsync(receivedSVGPath, resultPNGPath, expectedPNGPath);

        return {
            pass: isEqual,
            message: () => `expected ${receivedSVGPath} ${isEqual ? '' : 'not'} to be visually correct to ${expectedPNGPath}`
        };
    },

    async toBeVisuallyCorrectAsHTML(receivedHTMLPath, expectedPNGPath) {
        const previewImagePath = path.join(path.dirname(receivedHTMLPath), `${path.basename(receivedHTMLPath)}.png`);
        const isEqual = await capturePuppeteerAsync(receivedHTMLPath, previewImagePath, expectedPNGPath);

        return {
            pass: isEqual,
            message: () => `expected html ${receivedHTMLPath} ${isEqual ? '' : 'not'} to be visually correct to ${expectedPNGPath}`
        };
    }
});
