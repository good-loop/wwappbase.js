/** global test */
const puppeteer = require("puppeteer");
const {
	APIBASE,
	fillInForm,
	isPointingAtProduction,
	login,
	vertIdByName,
	vertiserIdByName,
	watchAdvertAndDonate
} = require("../res/UtilityFunctions");
const {
	fbUsername,
	fbPassword,
	password,
	username,
	twitterUsername,
	twitterPassword
} = require("../../../logins/sogive-app/puppeteer.credentials");
import {
	CommonSelectors,
	FacebookSelectors,
	PortalSelectors,
	TwitterSelectors
} from "../utils/MasterSelectors";
import { pathToFileURL } from "url";

const timestamp = Date.now();
const vertName = "advert-" + timestamp;
let vertId;

let browser;
let page;

describe("Portal tests", () => {

	beforeAll(async () => {
		browser = await puppeteer.launch();
		page = await browser.newPage();
	})

	afterAll(async () => {
		await browser.close();
	})

	test("New user able to complete pub sign up", async () => {
		const website = `${timestamp}.viking`;
		console.log(`${APIBASE}#pubsignup`);
		await page.goto(APIBASE + `#pubsignup`);

		// await failIfPointingAtProduction({ page });

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
		await page.waitForSelector("#pubdash");

		// Portal Logout. TODO: Extract for reuse.
		await page.click('.dropdown');
		await page.waitForSelector('#top-right-menu > li > ul > li:nth-child(3) > a');
		await page.click('#top-right-menu > li > ul > li:nth-child(3) > a');
		await page.waitForSelector('.login-link');
	}, 30000);

	// test("Advertiser sign-up form", async () => {
	// 	await page.goto(`http://localportal.good-loop.com/#adsignup`);
	// 	await page.waitForSelector(PortalSelectors.AdSignUp.email);
	// 	await fillInForm({
	// 		page,
	// 		Selectors: PortalSelectors.AdSignUp,
	// 		data: {
	// 			email: "human@real.man",
	// 			website: "destroyallhumans.org",
	// 			video: "https://testas.good-loop.com/vert/buck-480p.webm",
	// 			logo:
	// 				"https://www.deke.com/images/made/assets/uploads/08-final-hal_1600_1097_50.jpg",
	// 			charityOne: "Robotic Alms",
	// 			charityTwo: "Save the toasters",
	// 			charityThree: 'The "humans in chains" foundation',
	// 			total: "1",
	// 			notes: "Hello fellow human!"
	// 		}
	// 	});
	// 	await page.click(PortalSelectors.AdSignUp.submit);
	// }, 30000);

	// test("Log in via Facebook", async () => {
	// 	// const browser = window.__BROWSER__;
	// 	// const page = await browser.newPage();
	// 	await page.goto("" + APIBASE);

	// 	await page.waitForSelector(CommonSelectors.logIn);
	// 	await page.click(CommonSelectors.logIn);
	// 	await page.waitFor(1000);

	// 	await page.click('button.facebook');
	// 	await page.waitFor(2000);

	// 	await login({
	// 		browser,
	// 		page,
	// 		username: fbUsername,
	// 		password: fbPassword,
	// 		Selectors: Object.assign(CommonSelectors, FacebookSelectors),
	// 		service: "facebook"
	// 	});

	// 	await verifyLoginSuccess(page);

	// 	// Portal Logout. TODO: Extract for reuse.
	// 	await page.click('.dropdown');
	// 	await page.waitForSelector('#top-right-menu > li > ul > li:nth-child(3) > a');
	// 	await page.click('#top-right-menu > li > ul > li:nth-child(3) > a');
	// 	await page.waitForSelector('.login-link');
	// }, 30000);

	test("Log in via Twitter", async () => {
		await page.goto("" + APIBASE);

		await page.waitForSelector('.login-link');
		await login({
			page,
			username: twitterUsername,
			password: twitterPassword,
			Selectors: Object.assign(CommonSelectors, TwitterSelectors),
			service: "twitter"
		});

		// test for success
		await page.goto("" + APIBASE);
		// await verifyLoginSuccess(page);

		await page.waitForSelector('.dropdown');

		await page.click('.dropdown');
		await page.waitForSelector('#top-right-menu > li > ul > li:nth-child(3) > a');
		await page.click('#top-right-menu > li > ul > li:nth-child(3) > a');
	}, 30000);

	// Create advertiser
	test("Create an advertiser", async () => {
		await page.goto(APIBASE + `#advertiser`);

		await failIfPointingAtProduction({ page });

		await page.waitFor(PortalSelectors.General.Environment.logIn); // wait for Misc.Loading to go away
		await login({ page, username, password });
		await page.reload();

		await page.waitFor(PortalSelectors.Advertiser.Create);
		await page.click(PortalSelectors.Advertiser.Create);
		await fillInForm({
			page,
			Selectors: PortalSelectors.Advertiser,
			data: {
				name: timestamp,
				"contact-email": "fire@brim.stone",
				"contact-name": "Hades",
				"contact-title": "Lord of the underworld"
			}
		});
		await page.waitFor(2000);
		await page.click(CommonSelectors.Publish);
		await page.waitFor(1000); //Give ES a second to update
	}, 45000);

	// // Create advert
	test("Create an advert", async () => {
		// const vertiserId = await vertiserIdByName({ vertiserName: timestamp });
		const vertiserId = 'wtVdPVvW';
		await page.reload();
		await failIfPointingAtProduction({ page });

		await page.goto(APIBASE+`#advert?vertiser=${vertiserId}`);

		await page.waitFor(PortalSelectors.Advert.Create);
		await page.click(PortalSelectors.Advert.Create);

		await fillInForm({
			page,
			Selectors: PortalSelectors.Advert,
			data: {
				name: vertName,
				campaign: "soylent_green",
				logo:
					"https://www.moma.org/d/assets/W1siZiIsIjIwMTcvMTIvMjAvMnJnMGxxMDBoM19Tb3lsZW50X0dyZWVuXzE5NzNfNC5qcGciXSxbInAiLCJjb252ZXJ0IiwiLXJlc2l6ZSAxMDI0eDEwMjRcdTAwM2UiXV0/Soylent_Green_1973_4.jpg?sha=027176d7fa846760",
				about:
					"Tackling world hunger by simultaneously increasing supply and reducing demand"
			}
		});

		await fillInForm({
			page,
			Selectors: PortalSelectors.Advert,
			data: {
				video: "https://testas.good-loop.com/vert/buck-480p.webm",
				videoSeconds: 15
			}
		});

		// Fill in charities
		await fillInForm({
			page,
			Selectors: PortalSelectors.Advert,
			data: {
				charityOne: "the-save-the-children-fund",
				charityTwo: "wateraid",
				charityThree: "oxfam"
			}
		});
		await page.waitFor(5000);

		await page.click('#advert > div > div:nth-child(2) > div > div:nth-child(2) > div.SavePublishDiscard > button:nth-child(2)');
		await page.waitFor(2000);

		// Hack to grab the vert ID from the url.
		vertId = await page.url().split('/').pop().split('?').shift();

		await page.click(CommonSelectors.Publish);
		await page.waitFor(1000); //Give ES a second to update
	}, 90000);

	//Check if advert can be viewed on landing page
	test("Watch advert", async () => {
		// const vertId = await vertIdByName({ vertName });

		let url;

		if (("" + APIBASE).includes("localportal")) {
			url = "http://localas.good-loop.com/?gl.vert=" + vertId;
		} else if (("" + APIBASE).includes("testportal")) {
			url = "http://testas.good-loop.com/?gl.vert=" + vertId;
		} else {
			url = "http://as.good-loop.com/?gl.vert=" + vertId;
		}

		await page.goto(url);
		await watchAdvertAndDonate({ page });
	}, 45000);

	// //Delete advert
	test("Delete advert", async () => {
		const vertId = await vertIdByName({ vertName });

		await page.goto(`${APIBASE}#advert/${vertId}`);

		await failIfPointingAtProduction({ page });

		// await page.waitFor(CommonSelectors.logIn); // wait for Misc.Loading to go away
		// await login({ page, username, password });
		// await page.reload();

		await page.waitFor(CommonSelectors.Delete);
		await page.click(CommonSelectors.Delete);
	}, 30000);

	// Delete advertiser
	test("Delete advertiser", async () => {

		const vertiserId = await vertiserIdByName({ vertiserName: timestamp });

		await page.goto(`${APIBASE}#advertiser/${vertiserId}`);

		await failIfPointingAtProduction({ page });

		// await page.waitFor(CommonSelectors.logIn); // wait for Misc.Loading to go away
		// await login({ page, username, password });
		// await page.reload();

		await page.waitFor(CommonSelectors.Delete);
		await page.click(CommonSelectors.Delete);
	}, 30000);

	// /** Safety measure to stop weird test data being written to production */
	const failIfPointingAtProduction = async ({ page }) => {
		const bool = await isPointingAtProduction({ page });
		if (bool) throw new Error("Aborting: page is using production lg!");
	};

	/**Relies on a very simple check: can I perform actions that are access-restricted?
	 * Not too happy with this method as it relies on what is and isn't restricted not changing
	 */
	const verifyLoginSuccess = async function(page) {
		await page.goto(`${APIBASE}#dashboard`);
		// will time out if we can't see the contents of the dashboard page

		// User can Logout.
		await page.waitForSelector('#top-right-menu > li > ul > li:nth-child(3) > a');
	};
});
