const puppeteer = require('puppeteer');
const {login} = require('../res/UtilityFunctions');
const {username, password} = require('../../../logins/sogive-app/puppeteer.credentials');

// Report catastrophic "the page doesn't even load" type failures
test('Load the campaign page', async () => {
    const browser = await window.__BROWSER__;
    const page = await browser.newPage();

    // Now need to be logged in to view the campaign menu
    await page.goto(window.location.href);
    await login({page, username, password});

    await page.goto(window.location.href + '/#campaign/');
    // Click on first item in list of pages
    await page.waitForSelector('#campaign > div > div.ListLoad.DefaultListLoad > div:nth-child(2) > a');
    await page.click('#campaign > div > div.ListLoad.DefaultListLoad > div:nth-child(2) > a');

    await page.waitForSelector('.CampaignPage');
}, 15000);
