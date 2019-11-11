const puppeteer = require('puppeteer');
const $ = require('jquery');
const {APIBASE, fillInForm, isPointingAtProduction , login, vertIdByName, vertiserIdByName, watchAdvertAndDonate} = require('../res/UtilityFunctions');
const {fbUsername, fbPassword, password, username, twitterUsername, twitterPassword} = require('../../../logins/sogive-app/puppeteer.credentials');
import {CommonSelectors, FacebookSelectors, PortalSelectors, TwitterSelectors} from '../utils/MasterSelectors';
import { pathToFileURL } from 'url';

//    o<| : o ) --|--<

describe('PropControlTest tests', () => {    
    test('Can open PropControlTest', async () => {
        const browser = window.__BROWSER__;
        const page = await browser.newPage();
        console.log(`${APIBASE}#propControlTest`);
        await page.goto(`http://localportal.good-loop.com/#propControlTest`);

        expect(page.title()).resolves.toMatch('Good-Loop Portal');
    }, 99999)

    test('Can filter props through text input', async () => {
        const browser = window.__BROWSER__;
        const page = await browser.newPage();
        await page.goto(`http://localportal.good-loop.com/#propControlTest`);

        await page.waitFor(PortalSelectors.General.Environment.logIn); // wait for Misc.Loading to go away
        await login({page, username, password});
        await page.reload(); // Reload to see content
        
        // wait for filter then type string with delay per key
        await page.waitForSelector('.form-control');
        await page.type('[name=filter]', 'money', {delay: 5})
        await page.reload(); // Reload to make sure Components are updated after we apply the filter

        await page.waitForSelector('.card-item');

        const cardArray = await page.$$('div.card-item');

        // If we filter by 'money' we should be able to see 3 different PropControl cards.
        await expect(cardArray.length).toBe(3)
    }, 99999)

    test('Simple text field communicates correctly with DataStore', async () => {
        const browser = window.__BROWSER__;
        const page = await browser.newPage();
        await page.goto(`http://localportal.good-loop.com/#propControlTest`);

        await page.waitFor(PortalSelectors.General.Environment.logIn); // wait for Misc.Loading to go away
        await login({page, username, password});
        await page.reload();

        await page.waitForSelector('.form-control[name=text]');
        await page.type('[name=text]', 'testing...', {delay: 10});

        await page.waitForSelector('.card-item');
        const dataStoreText = JSON.parse(await page.evaluate(() => JSON.stringify(window.DataStore.appstate.widget.propcontroltest.text) )) ;

        await expect(dataStoreText).toBe('testing...');
    }, 99999)

    test('Number prop only accepts, well... ints', async () => {
        const browser = window.__BROWSER__;
        const page = await browser.newPage();
        await page.goto(`http://localportal.good-loop.com/#propControlTest`);

        await page.waitFor(PortalSelectors.General.Environment.logIn); // wait for Misc.Loading to go away
        await login({page, username, password});
        await page.reload();

        // Testing valid input first
        await page.waitForSelector('.form-control[name=prop]');
        await page.type('[name=prop]', '21', {delay: 10});

        await page.waitForSelector('.card-item');
        let dataStoreNumber = JSON.parse(await page.evaluate(() => JSON.stringify(window.DataStore.appstate.widget.propcontroltest.prop) )) ;

        await expect(dataStoreNumber).toBe(21);

        // Invalid Input
        // Triple click on input box to select content and then overwrite it, simulating proper user interaction
        const propField = await page.$('[name=prop]');
        await propField.click({ clickCount: 3 });
        await page.type('[name=prop]', 'string', {delay: 10});

        // Since we wrote an invalid value the Store stores an empty string instead of the previous int
        dataStoreNumber = JSON.parse(await page.evaluate(() => JSON.stringify(window.DataStore.appstate.widget.propcontroltest.prop) )) ;
        await expect(dataStoreNumber).toBe('');
    }, 99999)

    test('yesNo radial displays properly and registers right interaction', async () => {
        const browser = window.__BROWSER__;
        const page = await browser.newPage();
        await page.goto(`http://localportal.good-loop.com/#propControlTest`);

        await page.waitFor(PortalSelectors.General.Environment.logIn); // wait for Misc.Loading to go away
        await login({page, username, password});
        await page.reload();

        // When clicking an option, it should be registered in DataStore. If you click the other, it gets overwritten.
        await page.click('[value=yes]');

        let dataStoreNumber = JSON.parse(await page.evaluate(() => JSON.stringify(window.DataStore.appstate.widget.propcontroltest.yesNo) )) ;
        await expect(dataStoreNumber).toBe(true);

        await page.click('[value=no]');

        dataStoreNumber = JSON.parse(await page.evaluate(() => JSON.stringify(window.DataStore.appstate.widget.propcontroltest.yesNo) )) ;
        await expect(dataStoreNumber).toBe(false);
    }, 99999)
})

///////////////////////////////////////////////////////////////////////////////
//// TODO: WHEN FINISHED REMEMBER TO MOVE ALL TEST FILE BACK IN THE DIR!!! ////
///////////////////////////////////////////////////////////////////////////////
