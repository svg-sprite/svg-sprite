'use strict';

const assert = require('assert').strict;
const BrowserManager = require('../lib/browser-mananger.js');

describe('BrowserManager', () => {
    it('should handle multiple instances creation', async() => {
        const browserManager = new BrowserManager();
        const [instance1, instance2] = await Promise.all([
            browserManager.getBrowser(),
            browserManager.getBrowser()
        ]);

        assert.ok(instance1);
        assert.ok(instance2);
        assert.deepEqual(instance1, instance2);

        await browserManager.closeBrowser();
    });

    it('should not throw an exception when the instance does not exist but calls closeBrowser', () => {
        const browserManager = new BrowserManager();

        return browserManager.closeBrowser();
    });

    it('should not throw an exception when the instance does not exist but calls closeBrowser multiple times', async() => {
        const browserManager = new BrowserManager();

        await browserManager.getBrowser();
        await browserManager.closeBrowser();
        await browserManager.closeBrowser();
    });

    it('should create a separate browser instance/manager', async() => {
        const browserManager1 = new BrowserManager();
        const browserManager2 = new BrowserManager();

        assert.notDeepEqual(await browserManager1.getBrowser(), await browserManager2.getBrowser());

        await browserManager1.closeBrowser();
        await browserManager2.closeBrowser();
    });
});
