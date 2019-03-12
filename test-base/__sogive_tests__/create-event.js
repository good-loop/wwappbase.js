const puppeteer = require('puppeteer');
const {APIBASE, eventIdFromName, login, soGiveFailIfPointingAtProduction, fillInForm} = require('../res/UtilityFunctions');
const {username, password} = require('../../../logins/sogive-app/puppeteer.credentials');
const {CommonSelectors, SoGiveSelectors: {Event}} = require('../utils/SelectorsMaster');
const {createEvent, deleteEvent} = require('../res/UtilsSoGive');

// Default event data
const eventData = {
    name: Date.now(),
    description: "Resistance is futile",
    "web-page": 'https://developers.google.com/web/tools/puppeteer/',
    "matched-funding": 10,
    sponsor: "Locutus of Borg",

    backdrop: 'https://i.pinimg.com/originals/a4/42/b9/a442b9891265ec69c78187a030b0753b.jpg',
};

test('Create an event', async() => {
    const browser = window.__BROWSER__;
    const page = await browser.newPage();

    await page.goto(`${APIBASE}#event`);
    await soGiveFailIfPointingAtProduction({page});

    await login({page, username, password});  
    await createEvent({page, data: eventData});
}, 45000);

test('Delete event created', async() => {
    const browser = window.__BROWSER__;
    const page = await browser.newPage();
    
    await page.goto(`${APIBASE}`);
    await soGiveFailIfPointingAtProduction({page});
    await login({page, username, password});  
    await deleteEvent({page, eventName: eventData.name});
}, 45000);
