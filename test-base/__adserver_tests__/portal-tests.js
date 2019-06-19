/** global test */
const puppeteer = require('puppeteer');
const {APIBASE, fillInForm, isPointingAtProduction , login, vertIdByName, vertiserIdByName, watchAdvertAndDonate} = require('../res/UtilityFunctions');
const {fbUsername, fbPassword, password, username, twitterUsername, twitterPassword} = require('../../../logins/sogive-app/puppeteer.credentials');
import {CommonSelectors, FacebookSelectors, PortalSelectors, TwitterSelectors} from '../utils/MasterSelectors';
import { pathToFileURL } from 'url';

const timestamp = Date.now();
const vertName = 'advert-'+timestamp;

test('New user able to complete pub sign up', async() => {
	const browser = window.__BROWSER__;
	const page = await browser.newPage();
	const website = `${timestamp}.viking`;
	console.log(`${APIBASE}#pubsignup`);
	await page.goto(`${APIBASE}#pubsignup`);
	
	await failIfPointingAtProduction({page});

	// register new account
	await page.waitForSelector(PortalSelectors.PubSignUp.email);
	await page.click(PortalSelectors.PubSignUp.email);
	await page.keyboard.type(`${timestamp}@winterwell.com`);

	await page.click(PortalSelectors.PubSignUp.password);
	await page.keyboard.type("password");
	await page.click(PortalSelectors.PubSignUp.register);

	await page.waitForSelector(PortalSelectors.PubSignUp.next);
	await page.click(PortalSelectors.PubSignUp.next);
   
	// claim website
	await page.waitForSelector(PortalSelectors.PubSignUp.linkToWebsite);
	await page.click(PortalSelectors.PubSignUp.linkToWebsite);
	await page.keyboard.type(website);

	await page.click(PortalSelectors.PubSignUp.claimSite);
	await page.waitForSelector(PortalSelectors.PubSignUp.next);
	await page.click(PortalSelectors.PubSignUp.next);
   
	// skip instructions
	await page.waitForSelector(PortalSelectors.PubSignUp.wordPressInstructions);
	await page.waitForSelector(PortalSelectors.PubSignUp.next);
	await page.click(PortalSelectors.PubSignUp.next);
   
	// enter test page
	await page.waitForSelector(PortalSelectors.PubSignUp.linkToWebsite);
	await page.click(PortalSelectors.PubSignUp.linkToWebsite);
	await page.keyboard.type(website);
	await page.waitForSelector(PortalSelectors.PubSignUp.next);
	await page.click(PortalSelectors.PubSignUp.next);

	// can access pubdash?
	// doesn't test installation in any way
	// really only tests that an account and pubdash page has been created
	await page.waitForSelector(PortalSelectors.PubSignUp.pubPageLink);
	await page.click(PortalSelectors.PubSignUp.pubPageLink);
	await page.waitForSelector('#pubdash');
}, 30000);

test('Advertiser sign-up form', async() => {
	const browser = window.__BROWSER__;
	const page = await browser.newPage();

	await page.goto(`${APIBASE}/#adsignup`);
	await page.waitForSelector(PortalSelectors.AdSignUp.email);
	await fillInForm({ 
		page,
		Selectors: PortalSelectors.AdSignUp,
		data:{
			email: 'human@real.man',
			website: 'destroyallhumans.org',
			video: 'https://testas.good-loop.com/vert/buck-480p.webm',
			logo: 'https://www.deke.com/images/made/assets/uploads/08-final-hal_1600_1097_50.jpg',
			charityOne: 'Robotic Alms',
			charityTwo: 'Save the toasters',
			charityThree: 'The "humans in chains" foundation',
			total: '1',
			notes: 'Hello fellow human!',
		}
	});
	await page.click(PortalSelectors.AdSignUp.submit);
}, 30000);

test('Log in via Facebook', async() => {
	const browser = window.__BROWSER__;
	const page = await browser.newPage();

	await page.goto('' + APIBASE);
	await page.waitForSelector(CommonSelectors['log-in']);
	await page.click(CommonSelectors['log-in']);

	await login({
		browser,
		page,
		username: fbUsername,
		password: fbPassword,
		Selectors: Object.assign(CommonSelectors, FacebookSelectors),
		service: 'facebook'
	});

	await verifyLoginSuccess(page);
}, 30000);

test('Log in via Twitter', async() => {
    const browser = window.__BROWSER__;
    const page = await browser.newPage();

    await page.goto('' + APIBASE);
	await login({
		page, 
		username: twitterUsername, 
		password: twitterPassword,
		Selectors: Object.assign(CommonSelectors, TwitterSelectors),
		service: 'twitter'
	});

	// test for success
    await page.goto('' + APIBASE);
    await verifyLoginSuccess(page);
}, 30000);

// Create advertiser
test('Create an advertiser', async() => {
	const browser = window.__BROWSER__;
	const page = await browser.newPage();

	await page.goto(`${APIBASE}#advertiser`);

	await failIfPointingAtProduction({page});

	await page.waitFor(PortalSelectors.General.Environmnet["log-in"]); // wait for Misc.Loading to go away
	await login({page, username, password});
	// hack to get around portal bug (27/07/18) where
	// permission to use CRUD buttons is not immediately given
	await page.reload();

	await page.waitFor(PortalSelectors.Advertiser.Create);
	await page.click(PortalSelectors.Advertiser.Create);
	await fillInForm({
		page,
		Selectors: PortalSelectors.Advertiser,
		data:{
			'name': timestamp,
			'contact-email': "fire@brim.stone",
			'contact-name': "Hades",
			'contact-title': "Lord of the underworld"
		}
	});
	await page.waitFor(2000);
	await page.click(CommonSelectors.Publish);
	await page.waitFor(1000);//Give ES a second to update
}, 45000);

// // Create advert
test('Create an advert', async() => {
	const browser = window.__BROWSER__;
	const page = await browser.newPage();
	const vertiserId = await vertiserIdByName({vertiserName: timestamp});

	await page.goto(`${APIBASE}#advertiser/${vertiserId}`);

	await failIfPointingAtProduction({page});

	await page.waitFor(CommonSelectors["log-in"]); // wait for Misc.Loading to go away
	await login({page, username, password});
	await page.reload();

	await page.waitFor(PortalSelectors.Advert.viewAdverts);
	await page.click(PortalSelectors.Advert.viewAdverts);

	await page.waitFor(PortalSelectors.Advert.Create);
	await page.click(PortalSelectors.Advert.Create);

	await fillInForm({
		page,
		Selectors: PortalSelectors.Advert,
		data:{
			name: vertName,
			campaign: 'soylent_green',
			logo: 'https://www.moma.org/d/assets/W1siZiIsIjIwMTcvMTIvMjAvMnJnMGxxMDBoM19Tb3lsZW50X0dyZWVuXzE5NzNfNC5qcGciXSxbInAiLCJjb252ZXJ0IiwiLXJlc2l6ZSAxMDI0eDEwMjRcdTAwM2UiXV0/Soylent_Green_1973_4.jpg?sha=027176d7fa846760',
			about: 'Tackling world hunger by simultaneously increasing supply and reducing demand',
		}
	});
	//Cheap work-around for CardAccordion blocking access to fields
	await page.click('#advert > div > div:nth-child(2) > div > div > div.CardAccordion > div:nth-child(5) > div.panel-heading.btn-link');
	await fillInForm({
		page,
		Selectors: PortalSelectors.Advert,
		data:{
			video: 'https://testas.good-loop.com/vert/buck-480p.webm',
			videoSeconds: 15
		}
	});

	// Fill in charities
	await page.click('#advert > div > div:nth-child(2) > div > div > div.CardAccordion > div:nth-child(6) > div.panel-heading.btn-link');
	await fillInForm({
		page,
		Selectors: PortalSelectors.Advert,
		data: {
			charityOne: 'the-save-the-children-fund',
			charityTwo: 'wateraid',
			charityThree: 'oxfam'
		}
	});

	await page.click(CommonSelectors.Publish);
	await page.waitFor(1000);//Give ES a second to update
},30000);

//Check if advert can be viewed on landing page
test('Watch advert', async() => {
	const browser = window.__BROWSER__;
	const page = await browser.newPage();
	const vertId = await vertIdByName({vertName});
	
	let url;

	if (('' + APIBASE).includes('localportal')) {
		url = 'http://localas.good-loop.com/?gl.vert=' + vertId;
	} else if(('' + APIBASE).includes('testportal')) {
		url = 'http://testas.good-loop.com/?gl.vert=' + vertId;
	} else {
		url = 'http://as.good-loop.com/?gl.vert=' + vertId;
	}
	
	await page.goto(url);
	await watchAdvertAndDonate({page});
}, 45000);

//Delete advert
test('Delete advert', async() => {
	const browser = window.__BROWSER__;
	const page = await browser.newPage();
	const vertId = await vertIdByName({vertName});

	await page.goto(`${APIBASE}#advert/${vertId}`);

	await failIfPointingAtProduction({page});

	await page.waitFor(CommonSelectors["log-in"]); // wait for Misc.Loading to go away
	await login({page, username, password});
	await page.reload();

	await page.waitFor(CommonSelectors.Delete);
	await page.click(CommonSelectors.Delete);
}, 30000);

//Delete advertiser
test('Delete advertiser', async() => {
	const browser = window.__BROWSER__;
	const page = await browser.newPage();
	const vertiserId = await vertiserIdByName({vertiserName: timestamp});

	await page.goto(`${APIBASE}#advertiser/${vertiserId}`);

	await failIfPointingAtProduction({page});

	await page.waitFor(CommonSelectors["log-in"]); // wait for Misc.Loading to go away
	await login({page, username, password});
	await page.reload();

	await page.waitFor(CommonSelectors.Delete);
	await page.click(CommonSelectors.Delete);
}, 30000);

/** Safety measure to stop weird test data being written to production */
const failIfPointingAtProduction = async ({page}) => { 
	const bool = await isPointingAtProduction({page});
	if( bool ) throw new Error('Aborting: page is using production lg!'); 
};

/**Relies on a very simple check: can I perform actions that are access-restricted?
 * Not too happy with this method as it relies on what is and isn't restricted not changing
 */
const verifyLoginSuccess = async function(page) {
	await page.goto(`${APIBASE}#dashboard`);
	// will time out if we can't see the contents of the dashboard page
	await page.waitForSelector('.DashboardPage');
};
