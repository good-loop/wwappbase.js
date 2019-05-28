const puppeteer = require('puppeteer');

// Report catastrophic "the page doesn't even load" type failures
test('Load the campaign page', async () => {
    const browser = await window.__BROWSER__;
    const page = await browser.newPage();
    
    await page.goto(window.location.href + '/#campaign/');
    // Click on first item in list of pages
    await page.waitForSelector('#campaign > div > div.ListLoad.DefaultListLoad > div:nth-child(2) > a');
    await page.click('#campaign > div > div.ListLoad.DefaultListLoad > div:nth-child(2) > a');

    await page.waitForSelector('.CampaignPage');
}, 15000);
