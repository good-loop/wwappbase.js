// checks functionality of sogive.org/#edit
const puppeteer = require('puppeteer');
const {APIBASE, login, fillInForm, soGiveFailIfPointingAtProduction} = require('../res/UtilityFunctions');
const {username, password} = require('../../../logins/sogive-app/puppeteer.credentials');
const {SoGiveSelectors: {Editor}, CommonSelectors} = require('../utils/MasterSelectors');
const $ = require('jquery');

// the lucky charity to be tested
const lamb = "urras-eaglais-na-h-aoidhe";
const timeStamp = new Date().toISOString();

let browser;
let page;

describe('Edit organisation tests', () => {

    beforeAll(async () => {
        browser = await puppeteer.launch({ headless: false });
        page = await browser.newPage();
    })

    afterAll(async () => {
        browser.close();
    })

    test('Edit and publish field', async () => {
        await page.goto('http://local.sogive.org');

        await page.$('.login-link');
        await page.click('.login-link');
        
        await page.click('[name=email]');
        await page.type('[name=email]', username);
        await page.click('[name=password]');
        await page.type('[name=password]', password);

        await page.keyboard.press('Enter');

        await page.goto(`http://local.sogive.org/#edit?charityId=${lamb}`);

        // await soGiveFailIfPointingAtProduction({page});

        await page.waitForSelector('[name=summaryDescription]');
        await page.type('[name=summaryDescription]', '.');
        await page.click(CommonSelectors.Publish);
        await page.goto(`http://local.sogive.org/#charity?charityId=urras-eaglais-na-h-aoidhe`);

        await page.waitForSelector('.description-short');
    }, 20000);

    test('Reset edits', async () => {
        await page.goto(`http://local.sogive.org/#edit?charityId=${lamb}`);
        await page.waitForSelector('[name=summaryDescription]');
        await page.click('[name=summaryDescription]', { clickCount: 3 });

        await page.keyboard.press('Backspace');
        await page.waitFor(1000)
        await page.click('[name=save]');
        await page.waitFor(200);
        await page.click('[name=publish]');

        await page.click('.panel-body a');
        await page.waitFor(2000);
    })
})


