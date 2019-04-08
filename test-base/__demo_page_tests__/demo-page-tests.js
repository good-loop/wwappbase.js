const puppeteer = require('puppeteer');
const $ = require('jquery');
const {DemoPageSelectors} = require('../utils/SelectorsMaster');
const {APIBASE, fillInForm, watchAdvertAndDonate} = require('../res/UtilityFunctions');

// Demo page always uses production portal, so don't need to worry about switching for local/test/production
const adID = 'W830wIsC';

// Variants on the demo page
const variants = ['mpu2', 'landscape', 'pre-roll', 'in-read', 'mpu'];

// Check that each variant available on the demo page can be selected
// and that the user is able to play a video + make a donation
variants.forEach(variant => {
    test(`Go to demo page, watch ${variant} video, then make a donation`, async () => {
        const browser = await window.__BROWSER__;
        const page = await browser.newPage();
        const url = `${APIBASE}?gl.vert=${adID}`;
    
        await page.goto(url);
        await page.select(DemoPageSelectors['select-element'], variant);
        await watchAdvertAndDonate({page});    
    }, 45000);
});

// test(`Fill out contact form`, async () => {
//     const browser = await window.__BROWSER__;
//     const page = await browser.newPage();

//     await page.goto(`${APIBASE}`);
//     await fillInForm({
//         page, 
//         Selectors: DemoPageSelectors,
//         data: {
//             name: 'THIS IS AN AUTOMATED TEST',
//             email: 'thePuppetMaster@winterwell.com',
//             message: 'One weird trick to find singles in your area. To find out more, just send ₦1000 to my bank account.'
//         }
//     });
//     await page.click(DemoPageSelectors['submit']);

//     // Give a minute to allow redirection to failure/success page
//     await page.waitFor(5000);
//     expect(page.url()).toEqual('https://www.good-loop.com/success');
// }, 15000);
