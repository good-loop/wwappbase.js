/**NOTE: This file needs to be babeled under current setup.
 * compile.sh set to output to babeled-res. That's also
 * where jest is set to read the setup file from
 */
const puppeteer = require('puppeteer');
const {takeScreenshot} = require('../res/UtilityFunctions');
const fs = require('fs');
const url = require('url');

const options = {
    headless: true,
    devtools: false,
    slowMo: 0, // Introduces a delay between puppeteer actions
};
/**Setup functions run before each test
 * If you only want something to run once
 * before all tests in file, use beforeAll/afterAll
 */
beforeEach(async () => {
    let browserOptions = {...options, headless: !!!process.env.PUPPETEER_RUN_HEADLESS};
    window.__BROWSER_OPTIONS__ = browserOptions;
    //Can't access global from tests
    window.__BROWSER__ = await puppeteer.launch(browserOptions);
});

/**Cleanup after each test is completed
 * Note: some after-test functionality is 
 * written in custom-reporter.js
 * Reporters get more info on tests.
 * 
 * Bit annoying: useful test info can only be
 * accessed through reporter. Browser can't be
 * accessed from there for taking screenshots though.
 * Might need to screenshot here and write to log over there.
 * How barbaric.
 */
afterEach(async () => {
    const browser = window.__BROWSER__;
    const pages = await browser.pages();
    const date = new Date().toISOString();
    // fs.appendFileSync('this_log.txt', 
    //     Object.keys(window.fails)
    //     .map(key => `{${key}: ${typeof window[key] === 'string' ? window[key] : ''}}\n`)
    // );
    //Start at 1 to skip over chrome home page
    for(let i=1; i<pages.length; i++) {
        const page = pages[i];
        let glURL = 
            url.parse(page.url())
            .path
            .replace(/\//g, '');
        const name = glURL ? (date + '_' + glURL + '_') : date; 

        await takeScreenshot({
            page, 
            path: `test-results/Screenshots`,
            name
        });
    }
    if( process.env.PUPPETEER_RUN_HEADLESS ) {
        await window.__BROWSER__.close();
    }
}, 10000);
