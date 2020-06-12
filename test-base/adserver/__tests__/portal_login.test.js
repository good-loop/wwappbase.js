const puppeteer = require('puppeteer');
const { CommonSelectors, FacebookSelectors, PortalSelectors, TwitterSelectors } = require("../utils/Selectors");
const { login } = require("../utils/UtilityFunctions");
const { fbUsername, fbPassword, password, username, twitterUsername, twitterPassword } = require("../utils/Credentials");
const { targetServer } = require('../utils/TestConfig');

const config = JSON.parse(process.env.__CONFIGURATION);
const APIBASE = targetServer[config.site];

let context;

describe("Portal tests", () => {

	beforeEach(async () => {
		await page.close();
		context = await browser.createIncognitoBrowserContext();
		page = await context.newPage();
	});

	const verifyLoginSuccess = async function() {
		await page.goto(`${APIBASE}`);
		// will time out if we can't see the contents of the dashboard page

		// User can Logout.
		// await page.waitForSelector('#top-right-menu > li > ul > li:nth-child(3) > a');
		await expect(page).toMatch('Log out');
	};

	test("Log in via email", async () => {
		await page.goto(APIBASE);

		await page.waitForSelector('[name=email]');
		await page.type('[name=email]', username);
		await page.type('[name=password]', password);
		await page.click('[type=submit]');

		await page.waitFor(500);
		await verifyLoginSuccess();
	}, 99999);

	/////// Temporary disabled due to facebook test account being disabled ////////
	// test("Log in via Facebook", async () => {
	// 	// NOTE: For some reason Puppeteer refuses to interact with Facebook's login popup
	// 	// so instead we login in their website directly before going back to portal and login using facebook.
	// 	// Since testing Facebook's code is outside the scope of these tests this solution is satisfactory.
	// 	await page.goto("" + "https://www.facebook.com");

	// 	await page.waitForSelector("[name=email]");
	// 	await page.type("[name=email]", fbUsername);
	// 	await page.type("[name=pass]", fbPassword);
	// 	await page.click("[data-testid=royal_login_button]");
	// 	await page.waitFor(5000);

	// 	await page.goto(APIBASE);

	// 	await page.waitForSelector(CommonSelectors.logIn);
	// 	await page.click(CommonSelectors.logIn);
	// 	await page.waitFor(1000);

	// 	await page.click("button.facebook");
	// 	await page.waitFor(1000);

	// 	await verifyLoginSuccess();
	// }, 30000);

	test("Log in via Twitter", async () => {
		await page.goto("" + APIBASE);

		await page.waitForSelector(".login-link");
		await login({
			page,
			username: twitterUsername,
			password: twitterPassword,
			Selectors: Object.assign(CommonSelectors, TwitterSelectors),
			service: "twitter"
		});

		// test for success
		await page.goto(APIBASE);
		await verifyLoginSuccess(page);
	}, 99999);
});
