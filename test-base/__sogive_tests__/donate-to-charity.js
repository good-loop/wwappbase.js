const puppeteer = require("puppeteer");
const {
	APIBASE,
	login,
	soGiveFailIfPointingAtProduction
} = require("../res/UtilityFunctions");
const {
	username,
	password
} = require("../../../logins/sogive-app/puppeteer.credentials");
const {
	advanceWizard,
	donate
} = require("../utils/sogive-scripts/donation-form");
const {
	CommonSelectors,
	SoGiveSelectors: { Search, General }
} = require("../utils/MasterSelectors");

const Details = {
	name: "Human Realman",
	email: "mark@winterwell.com",
	address: "123 Clown Shoes Avenue",
	postcode: "CS20AD",
	"consent-checkbox": true
};

let browser;
let page;

describe("Charity donation tests", () => {
	beforeAll(async () => {
		browser = await puppeteer.launch({ headless: false });
		page = await browser.newPage();
	});

	afterAll(async () => {
		browser.close();
	});

	test("Logged-out charity donation", async () => {
		await page.goto(APIBASE + "#search?q=");
		await soGiveFailIfPointingAtProduction({ page });

		// Search for charity
		await page.click(Search.Main.SearchField);
		await page.keyboard.type("oxfam");
		await page.click(Search.Main.SearchButton);

		// Click on first link in search results
		await page.waitForSelector(Search.Main.FirstResult);
		await page.click(Search.Main.FirstResult);

		await donate({
			page,
			Amount: {
				amount: 1
			},
			GiftAid: {},
			Details
		});
	}, 20000);

	test("Logged-in charity donation", async () => {
		await page.goto(APIBASE + "#search?q=");
		await soGiveFailIfPointingAtProduction({ page });
		await login({ page, username, password });

		// Search for charity
		await page.click(Search.Main.SearchField);
		await page.keyboard.type("oxfam");
		await page.click(Search.Main.SearchButton);

		// Click on first link in search results
		// await page.waitForSelector(Search.Main.FirstResult);
		// await page.click(Search.Main.FirstResult);
        await page.waitForSelector('#search > div > div:nth-child(2) > div > div.results-list > div:nth-child(2) > a.logo.col-md-2.col-xs-4');
        await page.click('#search > div > div:nth-child(2) > div > div.results-list > div:nth-child(2) > a.logo.col-md-2.col-xs-4');

		await donate({
			page,
			Amount: {
				amount: 1
			},
			GiftAid: {},
			Details
		});
	}, 20000);
});
