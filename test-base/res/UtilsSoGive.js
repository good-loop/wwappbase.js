const puppeteer = require('puppeteer');
const {CommonSelectors, SoGiveSelectors: {Event}} = require('../utils/SelectorsMaster');
const {APIBASE, eventIdFromName, fillInForm} = require('../res/UtilityFunctions');

const createEvent = async ({page, data}) => {    
    await page.goto(`${APIBASE}#event`);
    
    // Set up an event
    await page.click(Event.Main.CreateEvent);
    await page.waitForSelector(Event.Main.CreateEditButton);
    await page.click(Event.Main.CreateEditButton);

    await page.waitForSelector(Event.TicketTypes.CreateButton);
    await page.click(Event.TicketTypes.CreateButton);

    await fillInForm({
        page,
        data,
        Selectors: Object.assign(
            Event.EditEventForm,
            Event.ImagesAndBranding,
            Event.TicketTypes
        ) 
    });

    await page.click(CommonSelectors.Publish);
    await page.waitForSelector(`${CommonSelectors.Publish}[disabled]`, {hidden: true});
}; 

const deleteEvent = async ({page, eventName, eventId}) => {
    if ( eventId === null || eventId === undefined ) {
        eventId = await eventIdFromName({eventName});
        await deleteEvent({page, eventId});
    }

    await page.goto(`${APIBASE}#editEvent/${eventId}`);
    await page.waitForSelector(CommonSelectors.Delete);
    await page.click(CommonSelectors.Delete);
};

module.exports = {
    createEvent,
    deleteEvent
};
