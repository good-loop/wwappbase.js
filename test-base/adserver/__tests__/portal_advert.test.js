const puppeteer = require("puppeteer");
const { fillInForm, isPointingAtProduction, login, vertiserIdByName, watchAdvertAndDonate } = require("../utils/UtilityFunctions");
const { fbUsername, fbPassword, password, username, twitterUsername, twitterPassword } = require("../utils/Credentials");
const { Advertiser, Advert, General, Main, AdSignUp, CommonSelectors } = require("../utils/Selectors");

const config = JSON.parse(process.env.__CONFIGURATION);
const { targetServer } = require('../utils/TestConfig');

const timestamp = Date.now();
const vertName = "advert-" + timestamp;
let vertId;

const APIBASE = targetServer[config.site];

describe("Portal advert tests", () => {
	beforeEach(async () => {
		await page.close();
		const context = await browser.createIncognitoBrowserContext();
		page = await context.newPage();
	});

	test("Create an advert", async () => {
		// const vertiserId = await vertiserIdByName({ vertiserName: timestamp });
		const vertiserId = "default_advertiser"; //"wtVdPVvW";
		await page.goto(APIBASE);

		await page.waitForSelector(".switch-verb a");
		await page.click(".switch-verb a");
		await page.waitFor(100);
		await page.type("[name=email]", username);
		await page.type("[name=password]", password);
		await page.click(".btn-primary");

		await page.goto(APIBASE + `#advert?vertiser=${vertiserId}`);

		await page.waitFor(Advertiser.Create);

		await page.click(Advertiser.Create);

		await page.waitFor(1000);

		await fillInForm({
			page,
			Selectors: Advert,
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
			Selectors: Advert,
			data: {
				video: "https://testas.good-loop.com/vert/buck-480p.webm",
				videoSeconds: 15
			}
		});

		// Fill in charities
		await fillInForm({
			page,
			Selectors: Advert,
			data: {
				charityOne: "the-save-the-children-fund",
				charityTwo: "wateraid",
				charityThree: "oxfam"
			}
		});
		await page.waitFor(5000);

		await page.click(
			"#advert > div > div:nth-child(2) > div > div:nth-child(2) > div.SavePublishDiscard > button:nth-child(2)"
		);
		await page.waitFor(2000);

		// Hack to grab the vert ID from the url.
		vertId = await page
			.url()
			.split("/")
			.pop()
			.split("?")
			.shift();

		await page.click(CommonSelectors.Publish);
		await page.waitFor(1000); //Give ES a second to update
	}, 90000);

	//Check if advert can be viewed on landing page
	// test("Watch advert", async () => {
	// 	// const vertId = await vertIdByName({ vertName });

	// 	await page.goto(APIBASE);
	// 	await page.waitFor(2000);

	// 	await page.waitForSelector(".switch-verb a");
	// 	await page.click(".switch-verb a");
	// 	await page.waitFor(100);
	// 	await page.type("[name=email]", username);
	// 	await page.type("[name=password]", password);
	// 	await page.click(".btn-primary");

	// 	let url;

	// 	if (("" + APIBASE).includes("local")) {
	// 		url = "http://localtest.good-loop.com/?gl.vert=" + vertId;
	// 	} else if (("" + APIBASE).includes("test")) {
	// 		url = "http://test.good-loop.com/?gl.vert=" + vertId;
	// 	} else {
	// 		url = "http://test.good-loop.com/?gl.vert=" + vertId;
	// 	}

	// 	await page.goto(url);
	// 	await watchAdvertAndDonate({ page });
	// }, 99000);

	// //Delete advert
	test("Delete advert", async () => {
		await page.goto(APIBASE);

		await page.waitForSelector(".switch-verb a");
		await page.click(".switch-verb a");
		await page.waitFor(100);
		await page.type("[name=email]", username);
		await page.type("[name=password]", password);
		await page.click(".btn-primary");

		await page.goto(`${APIBASE}#advert/${vertId}`);

		await page.waitFor(CommonSelectors.Delete);
		await page.click(CommonSelectors.Delete);

		await page.waitFor(2000);
	}, 99999);
});
