const config = JSON.parse(process.env.__CONFIGURATION);
const { testServers, customVertIds } = require('../utils/testConfig');

const baseSite = testServers[config.site];
const adId = config.vert || customVertIds[config.site];
const protocol = config.site === 'local' ? 'http://' : 'https://';

let url = `${protocol}${baseSite}?gl.vert=${adId}`;

// Variables that will be defined from the adunit json once fetched.
let videoLength, isSingleCharity, singleOrMultiple, skippable, clickToPlay;

// Get adunit json from our servers. Node does not allow fetch() natively,
// so we execute it inside the puppeteer browser.
const getUnitJson = async (id) => {
	const data = await page.evaluate(async  id => {
		const res = await fetch(`https://testas.good-loop.com/unit.json?gl.vert=${id}`);
		return await res.json();
	}, id)
	return await data;
}

let unitJson;

// The iframe context on which we will call out puppeteer methods, as opposed to 'page'
// which doesn't have access to inner iframes.
let adunit;

describe('Adunit tests', () => {
	// Before running any tests, we set up things here.
	beforeAll(async () => {
		unitJson = await getUnitJson(adId);

		videoLength = unitJson.variant.adsecs;
		isSingleCharity = unitJson.charities.length === 1;
		singleOrMultiple = isSingleCharity ? 'Single' : 'Multiple';
		skippable = unitJson.variant.skippable;
		clickToPlay = unitJson.variant.play === 'onclick';

		await page.goto(url);
		const adunitHandle = await page.$('iframe');
		adunit = await adunitHandle.contentFrame();
	})

	it('should start video on click if clickToPlay', async () => {
		if(clickToPlay) {
			await adunit.waitForSelector('.play-icon');
			await adunit.click('.play-icon');
		}
	});

	it('should have donations locked at start', async () => {
		if (isSingleCharity) {
			await adunit.waitForSelector('.single-charity.locked')
		} else {
			await adunit.waitForSelector('.chooser-list.locked');
		}
	});

	// In order to check if the countdown is working we compare the innerHTML of the locked message
	// against itself after 2 seconds. SHould have a different value, since the seconds have been updated.
	it('should display unlock message and counter', async () => {
		const counterSelector = isSingleCharity ? '.countdown-number .current' : '.chooser-message';
		await adunit.waitForSelector(counterSelector);
		const initialLockedMessage = await adunit.$eval(counterSelector, e => e.innerHTML);
		await page.waitFor(2000);
		const secondLockedMessage = await adunit.$eval(counterSelector, e => e.innerHTML);

		await expect(initialLockedMessage).not.toBe(secondLockedMessage);
	});

	it('unlock donations after watching half the video', async () => {
		// Wait for the duration of the video, minus 2 secs from the previous test
		await adunit.waitFor(videoLength * 1000 / 2 - 2000);
		const unlockedSelector = isSingleCharity ? '.single-charity complete' : '.chooser-list.ready';
		await adunit.waitForSelector(unlockedSelector);
	}, 15000);

	it('should allow to pick charity if multiple', async () => {
		if (!isSingleCharity) {
			await adunit.click('a.charity');
			await adunit.waitForSelector('.charity.selected');
		}
	}, 15000);

	it('should be able to skip if skippable', async () => {
		if (skippable) {
			await adunit.hover('video');
			await adunit.waitFor(100);
			await adunit.click('.skip-now');
		}
	});
});