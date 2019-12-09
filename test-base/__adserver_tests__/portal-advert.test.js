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

describe("Portal advert tests", () => {
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

	test("Create an advert", async () => {
		// const vertiserId = await vertiserIdByName({ vertiserName: timestamp });
		const vertiserId = "wtVdPVvW";
		await page.goto(APIBASE);

		await page.waitForSelector(".switch-verb a");
		await page.click(".switch-verb a");
		await page.waitFor(100);
		await page.type("[name=email]", username);
		await page.type("[name=password]", password);
		await page.click(".btn-primary");

		await failIfPointingAtProduction({ page });

		await page.goto(APIBASE + `#advert?vertiser=${vertiserId}`);

		await page.waitFor(PortalSelectors.Advert.Create);
		await page.click(PortalSelectors.Advert.Create);

		await page.waitFor(6000);

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
	test("Watch advert", async () => {
		// const vertId = await vertIdByName({ vertName });

		await page.goto(APIBASE);
		await page.waitFor(2000);

		await page.waitForSelector(".switch-verb a");
		await page.click(".switch-verb a");
		await page.waitFor(100);
		await page.type("[name=email]", username);
		await page.type("[name=password]", password);
		await page.click(".btn-primary");

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
		await page.goto(APIBASE);

		await page.waitForSelector(".switch-verb a");
		await page.click(".switch-verb a");
		await page.waitFor(100);
		await page.type("[name=email]", username);
		await page.type("[name=password]", password);
		await page.click(".btn-primary");

		await page.goto(`${APIBASE}#advert/${vertId}`);

		await failIfPointingAtProduction({ page });

		await page.waitFor(CommonSelectors.Delete);
		await page.click(CommonSelectors.Delete);
	}, 30000);

	// /** Safety measure to stop weird test data being written to production */
	const failIfPointingAtProduction = async ({ page }) => {
		const bool = await isPointingAtProduction({ page });
		if (bool) throw new Error("Aborting: page is using production lg!");
	};
});
