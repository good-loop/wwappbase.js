/** global test */
const puppeteer = require("puppeteer");
const {
	APIBASE,
	isPointingAtProduction,
	login,
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

const argvs = process.argv;
const devtools = argvs.join(",").includes("debug") || false;

let browser;
let page;

describe("Portal tests", () => {
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
    
    test("Log in via email", async () => {
        await page.goto(APIBASE);

        await failIfPointingAtProduction({ page });

        await page.waitForSelector('[name=email]');
        await page.type('[name=email]', username);
        await page.type('[name=password]', password);
        await page.click('[type=submit]');

        await page.waitFor(500);
        await verifyLoginSuccess(page);
    })

	test("Log in via Facebook", async () => {
		// NOTE: For some reason Puppeteer refuses to interact with Facebook's login popup
		// so instead we login in their website directly before going back to portal and login using facebook.
		// Since testing Facebook's code is outside the scope of these tests this solution is satisfactory.
		await page.goto("" + "https://www.facebook.com");

		await page.waitForSelector("[name=email]");
		await page.type("[name=email]", fbUsername);
		await page.type("[name=pass]", fbPassword);
		await page.click("[data-testid=royal_login_button]");
		await page.waitFor(5000);

		await page.goto(APIBASE);

		await page.waitForSelector(CommonSelectors.logIn);
		await page.click(CommonSelectors.logIn);
		await page.waitFor(1000);

		await page.click("button.facebook");
		await page.waitFor(1000);

		await verifyLoginSuccess(page);
	}, 30000);

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
		await page.goto("" + APIBASE);
		// await verifyLoginSuccess(page);

		await page.waitForSelector(".dropdown");

		await page.click(".dropdown");
		await page.waitForSelector(
			"#top-right-menu > li > ul > li:nth-child(3) > a"
		);
		await page.click("#top-right-menu > li > ul > li:nth-child(3) > a");
    }, 99999);
    
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
