const puppeteer = require('puppeteer');

// Report catastrophic "the page doesn't even load" type failures
test('Load the campaign page', async () => {
    const browser = await window.__BROWSER__;
    const page = await browser.newPage();
    
    await page.goto(window.location.href + '/#campaign/');
    // Click on first item in list of pages
    await page.waitForSelector('div.ListLoad.DefaultListLoad > div:nth-child(2)');
    await page.click('div.ListLoad.DefaultListLoad > div:nth-child(2)');

    await page.waitForSelector('.nav-bar');
}, 30000);
