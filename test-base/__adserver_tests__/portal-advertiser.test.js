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

const timestamp = Date.now();
const vertName = "advert-" + timestamp;
let vertId;

const argvs = process.argv;
const devtools = argvs.join(",").includes("debug") || false;

let browser;
let page;

describe("Portal advertiser tests", () => {
	beforeEach(async () => {
		browser = await puppeteer.launch({
			headless: !devtools,
			devtools: devtools,
			slowMo: 0
		});
		page = await browser.newPage();
	});

	afterEach(async () => {
		await browser.close();
	});

	// Create advertiser
	test("Create an advertiser", async () => {
		const testLogo = 'https://cdn.iconscout.com/icon/premium/png-256-thumb/sonic-3-554498.png';
		await page.goto(APIBASE);

		await page.waitForSelector(".switch-verb a");
		await page.click(".switch-verb a");
		await page.waitFor(100);
		await page.type("[name=email]", username);
		await page.type("[name=password]", password);
		await page.click(".btn-primary");

		await page.goto(APIBASE + `#advertiser`);

		await failIfPointingAtProduction({ page });

		// Use 
		await page.waitForSelector('.glyphicon');
		await page.click('.glyphicon');

		// Fill in the form
		await page.waitForSelector('[name=name]');
		await page.type('[name=name', timestamp);
		await page.type('[name=id]', 'sonic@thehedgehog.com')
		await page.type('.form-group[name=name]', 'Sanic');
		await page.type('[name=description]', 'Gotta go fast!');
		await page.type('[[name=logo]', testLogo);
		await page.waitFor(2000); // Give it two secs to save draft

		// await page.waitFor(PortalSelectors.Advertiser.Create);
		// await page.click(PortalSelectors.Advertiser.Create);
		// await fillInForm({
		// 	page,
		// 	Selectors: PortalSelectors.Advertiser,
		// 	data: {
		// 		name: timestamp,
		// 		"contact-email": "fire@brim.stone",
		// 		"contact-name": "Hades",
		// 		"contact-title": "Lord of the underworld"
		// 	}
		// });
		await page.click(CommonSelectors.Publish);
		await page.waitFor(1000); //Give ES a second to update
	}, 45000);

	// Delete advertiser
	test("Delete advertiser", async () => {
		await page.goto(APIBASE);

		await page.waitForSelector(".switch-verb a");
		await page.click(".switch-verb a");
		await page.waitFor(100);
		await page.type("[name=email]", username);
		await page.type("[name=password]", password);
		await page.click(".btn-primary");

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
});
