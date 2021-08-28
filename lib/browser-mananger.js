'use strict';

const puppeteer = require('puppeteer-core');
const asyncInit = require('./async-init.js');

const CHROMIUM_REVISION = '901912';

class BrowserManager {
    constructor() {
        this._closing = false;
        this._browser = undefined;
        this._asyncIniter = undefined;
    }

    /**
     * Properly close the browser and release the singleton.
     *
     * @returns {Promise<void>}
     */
    async closeBrowser() {
        if (this._browser && !this._closing) {
            this._asyncIniter = undefined;
            this._closing = true;
            await this._browser.close();
            this._browser = undefined;
            this._closing = false;
        }
    }

    /**
     * Create a browser. Every BrowserManager creates only 1 browser.
     * Use the closeBrowser() function the properly close and release the browser.
     *
     * @returns {Promise<puppeteer.Browser>}
     */
    async getBrowser() {
        if (this._browser) {
            return this._browser;
        }

        if (!this._asyncIniter) {
            this._asyncIniter = asyncInit();
        }

        this._browser = await this._asyncIniter(async() => {
            const browserFetcher = puppeteer.createBrowserFetcher();
            let revisionInfo = await browserFetcher.revisionInfo(CHROMIUM_REVISION);
            if (!revisionInfo.local) {
                console.log(`Downloading Chromium: ${CHROMIUM_REVISION}`);
                revisionInfo = await browserFetcher.download(CHROMIUM_REVISION);
            }

            return puppeteer.launch({
                executablePath: revisionInfo.executablePath
            });
        });

        return this._browser;
    }
}

module.exports = BrowserManager;
