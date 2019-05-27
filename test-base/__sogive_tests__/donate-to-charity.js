const puppeteer = require('puppeteer');
const {APIBASE, login, soGiveFailIfPointingAtProduction} = require('../res/UtilityFunctions');
const {username, password} = require('../../../logins/sogive-app/puppeteer.credentials');
const {advanceWizard, donate} = require('../utils/sogive-scripts/donation-form');
const {CommonSelectors, SoGiveSelectors: {Search, General}} = require('../utils/SelectorsMaster');

const Details = {
    'name': 'Human Realman',
    'email': 'mark@winterwell.com',
    'address': '123 Clown Shoes Avenue',
    'postcode': 'CS20AD',
    'consent-checkbox': true,
};

test('Logged-in charity donation', async () => {
    const browser = window.__BROWSER__;
    const page = await browser.newPage();

    await page.goto(APIBASE + '/#search?q=');
    await soGiveFailIfPointingAtProduction({page});
    await login({page, username, password});  

    // Search for charity
    await page.click(Search.Main.SearchField);
    await page.keyboard.type('oxfam');
    await page.click(Search.Main.SearchButton);

    // Click on first link in search results
    await page.waitForSelector(Search.Main.FirstResult);
    await page.click(Search.Main.FirstResult);

    await donate({
        page, 
        Amount: {
            amount: 1
        }, 
        GiftAid: {},
        Details
    });     
}, 20000);

test('Logged-out charity donation', async () => {
    const browser = window.__BROWSER__;
    const page = await browser.newPage();

    await page.goto(APIBASE + '/#search?q=');
    await soGiveFailIfPointingAtProduction({page});
    
    // Search for charity
    await page.click(Search.Main.SearchField);
    await page.keyboard.type('oxfam');
    await page.click(Search.Main.SearchButton);

    // Click on first link in search results
    await page.waitForSelector(Search.Main.FirstResult);
    await page.click(Search.Main.FirstResult);

    await donate({
        page, 
        Amount: {
            amount: 1
        }, 
        GiftAid: {},
        Details
    });       
}, 20000);


test('Test yesno radio buttons', async () => {
    const browser = window.__BROWSER__;
    const page = await browser.newPage();

    await page.goto(APIBASE + '/#search?q=');
    await soGiveFailIfPointingAtProduction({page});
    
    // Search for charity
    await page.click(Search.Main.SearchField);
    await page.keyboard.type('oxfam');
    await page.click(Search.Main.SearchButton);

    // Click on first link in search results
    await page.waitForSelector(Search.Main.FirstResult);
    await page.click(Search.Main.FirstResult);

    await page.waitForSelector(General.CharityPageImpactAndDonate.DonationButton);
    await page.click(General.CharityPageImpactAndDonate.DonationButton);
    await page.waitForSelector(General.CharityPageImpactAndDonate.amount);
    await advanceWizard({page});

    await page.waitForSelector(General.CharityPageImpactAndDonate.giftAidOwnMoney);
    await page.click(General.CharityPageImpactAndDonate.giftAidOwnMoney);
    const checkedValue = await page.$eval(General.CharityPageImpactAndDonate.giftAidOwnMoney, e => e.checked);

    // Paranoia. Has previously been reported that the button will appear to reset itself after about 10 seconds
    await page.waitFor(15000);

    if( !checkedValue ) {
        throw new Error('Radio button value does not appear to have updated');
    }
}, 30000);