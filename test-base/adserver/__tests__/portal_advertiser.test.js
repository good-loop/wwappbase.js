const puppeteer = require("puppeteer");
const { CommonSelectors, FacebookSelectors, PortalSelectors, TwitterSelectors } = require("../utils/Selectors");
const { login, vertiserIdByName } = require("../utils/UtilityFunctions");
const { fbUsername, fbPassword, password, username, twitterUsername, twitterPassword } = require("../utils/Credentials");

const config = JSON.parse(process.env.__CONFIGURATION);
const { targetServer } = require('../utils/TestConfig');

const APIBASE = targetServer[config.site];

const timestamp = Date.now();
const vertName = "advert-" + timestamp;
let vertId;

describe("Portal advertiser tests", () => {
	afterEach(async () => {
		await page.close();
		const context = await browser.createIncognitoBrowserContext();
		page = await context.newPage();
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

		// Use 
		await page.waitForSelector('.glyphicon');
		await page.click('.glyphicon');

		// Fill in the form
		await page.waitForSelector('[name=name]');
		await page.type('[name=name]', timestamp.toString());
		await page.type('[name=id]', 'sonic@thehedgehog.com')
		await page.type('.form-group [name=name]', 'Sanic');
		await page.type('[name=description]', 'Gotta go fast!');
		await page.type('[name=logo]', testLogo);
		await page.waitFor(2000); // Give it two secs to save draft

		vertId = await page.url().split('/').pop();

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
		// TODO After publishing, find the ID in the page and store it to a variable in higher scope accessible to the Delete Advertiser test
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

		await page.goto(`${APIBASE}#vertiser/${vertId}`);

		// await page.waitFor(CommonSelectors.logIn); // wait for Misc.Loading to go away
		// await login({ page, username, password });
		// await page.reload();

		await page.waitFor(CommonSelectors.Delete);
		await page.click(CommonSelectors.Delete);
		await page.waitFor(2000);
	}, 30000);
});
