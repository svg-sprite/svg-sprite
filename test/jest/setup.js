'use strict';

const path = require('path');
const compareSvg2Png = require('../helpers/compare-svg-2-png.js');
const compareHTML2Png = require('../helpers/compare-html-2-png.js');
const { launchBrowser, closeBrowser } = require('../helpers/capture-browser.js');
const { isObject } = require('../../lib/svg-sprite/utils/index.js');

expect.extend({
    async toBeVisuallyEqualTo(receivedSVGPath, expectedPNGPath) {
        const options = {
            comment: 'SVG is equal to expected PNG',
            isNot: this.isNot,
            promise: this.promise
        };

        const resultPNGPath = path.join(path.dirname(receivedSVGPath), path.basename(receivedSVGPath).replace('.svg', '.svg.png'));
        const { isEqual, matched } = await compareSvg2Png(receivedSVGPath, resultPNGPath, expectedPNGPath);

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

        return { pass: isEqual, message };
    },

    async toBeVisuallyCorrectAsHTMLTo(receivedHTMLPath, expectedPNGPath) {
        const options = {
            comment: 'HTML is equal to expected PNG',
            isNot: this.isNot,
            promise: this.promise
        };

        const { isEqual, matched } = await compareHTML2Png(receivedHTMLPath, expectedPNGPath);

        const expected = path.basename(receivedHTMLPath);
        const received = path.basename(expectedPNGPath);

        const message = isEqual ?
            () => `${this.utils.matcherHint('toBeVisuallyCorrectAsHTMLTo', undefined, undefined, options)}\n\n` +
                `Expected: not ${this.utils.printExpected(expected)}\n` +
                `Received: ${this.utils.printReceived(received)}` :
            () => `${this.utils.matcherHint('toBeVisuallyCorrectAsHTMLTo', undefined, undefined, options)}\n\n` +
                `${this.utils.printReceived('Difference:')} ${expected} -> ${received}\n` +
                `Expected: ${this.utils.printExpected('no difference')}\n` +
                `Received: ${this.utils.printReceived(matched)} mismatches`;

        return { pass: isEqual, message };
    },

    toBeDefaultWinstonLogger(received) {
        const options = {
            comment: 'Object is default winson logger created by SVGSpriterConfig',
            isNot: this.isNot,
            promise: this.promise
        };
        const pass = (
            isObject(received) &&
            Array.isArray(received.transports) &&
            received.transports.length === 1
        );
        return {
            pass,
            message: pass ? () => 'Is winston logger, all OK' : () => `${this.utils.matcherHint('toBeDefaultWinsonLogger', undefined, undefined, options)}\n\n` +
                `Expected: ${this.utils.printExpected('winston logger')}\n` +
                `Received: ${this.utils.printReceived(received)}`
        };
    }
});

// eslint-disable-next-line jest/require-top-level-describe
beforeAll(launchBrowser);
// eslint-disable-next-line jest/require-top-level-describe
afterAll(closeBrowser);
