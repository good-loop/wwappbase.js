'use strict';

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

/**NOTE: This file needs to be babeled under current setup.
 * compile.sh set to output to babeled-res. That's also
 * where jest is set to read the setup file from
 */
const puppeteer = require('puppeteer');
const { takeScreenshot } = require('../babeled-res/UtilityFunctions');
const fs = require('fs');

const headless = true;

/**Setup functions run before each test
 * If you only want something to run once
 * before all tests in file, use beforeAll/afterAll
 */
beforeEach(_asyncToGenerator(function* () {
    //Can't access global from tests
    window.__BROWSER__ = yield puppeteer.launch({ headless });
    //Could set API.ENDPOINT here.
}));

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
afterEach(_asyncToGenerator(function* () {
    const browser = window.__BROWSER__;
    const pages = yield browser.pages();
    const date = new Date().toISOString();
    // fs.appendFileSync('this_log.txt', 
    //     Object.keys(window.fails)
    //     .map(key => `{${key}: ${typeof window[key] === 'string' ? window[key] : ''}}\n`)
    // );
    //Start at 1 to skip over chrome home page
    for (let i = 1; i < pages.length; i++) {
        yield takeScreenshot({
            page: pages[i],
            path: `test-results/Screenshots(success)`,
            date
        });
    }
    yield window.__BROWSER__.close();
}), 10000);
