const fs = require('fs');
const $ = require('jquery');
const {CommonSelectors, AdServerSelectors} = require('../utils/MasterSelectors');

/**Used to disable all page animations
 * Found that these were making tests less reliable
 * Insert into page via page.addScriptTag(disableAnimations);
 */
const disableAnimations = {
	content:
		`function disableAnimations() {
			var jQuery = window.jQuery;
			if ( jQuery ) {
				jQuery.fx.off = true;
			}

			var css = document.createElement( "style" );
			css.type = "text/css";
			css.innerHTML = "* { -webkit-transition: none !important; transition: none !important; -webkit-animation: none !important; animation: none !important; }";
			document.body.appendChild( css );
		}

		if ( document.readyState !== "loading" ) {
			disableAnimations();
		} else {
			window.addEventListener( 'load', disableAnimations, false );
		}`
};

// set when calling Jest CLI with --testURL $url
const APIBASE = window.location.href;

async function takeScreenshot({page, path, name = new Date().toISOString()}) {
	try {
		await page.screenshot({path: `${path}/${name}.png`});
	}
	catch(e) {
		//dir not found
		//Shouldn't give infinite loop: mkdirSync throws error if directory can't be created
		if (e.code === 'ENOENT') {
			fs.mkdirSync(path);
			await takeScreenshot({page, path, name});
		}
		else{
			console.log('setup_script.js -- screenshot failed ' + e.code + ': ' + e.message);
		}
	}
}

/**Login to app. Should work for both SoGive and Good-loop 
 * Make sure that you are actually on a page with a clickable login button before running this!
 * @param selectors CSS selectors for the given page
 * @param url option param. Will go to the url before attempting to log in
 * @param service how are you loggin in? Can be email, Twitter or Facebook
*/
async function login({browser, page, username, password, Selectors=CommonSelectors, service='email'}) {
	if(!username || !password) throw new Error('UtilityFunctions -- no username/password provided to login');

	await page.waitForSelector(Selectors['log-in']);
	await page.click(Selectors['log-in']);
	// Wait for CSS transition to complete
	// Caused puppeteer to click on wrong div sometimes
	await page.waitFor(400);

	if (service === 'email') {
		await page.waitForSelector(Selectors['log-in-email']);
		await page.waitForSelector(Selectors['log-in-password']);
	
		await page.click(Selectors['log-in-email']);
		await page.keyboard.type(username);  
		await page.click(Selectors['log-in-password']);
		await page.keyboard.type(password); 
		await page.keyboard.press('Enter');
		
		await page.waitForSelector(Selectors['log-in-email'], {hidden: true});
	}

	if (service === 'twitter') {
		await page.waitForSelector(Selectors.twitterLogin);
		await page.click(Selectors.twitterLogin);
		await page.waitForSelector(Selectors.apiUsername);
	
		await page.click(Selectors.apiUsername);
		await page.keyboard.type(username);
		await page.click(Selectors.apiPassword);
		await page.keyboard.type(password);
	
		await page.click(Selectors.apiLogin);
		// twitter, for some reason, wants you
		// to enter the exact same username & password
		// again, but on a different page
		await page.waitForNavigation({ waitUntil: 'load'});
		await page.waitFor(5000); // Give Twitter login a second to process
		// await page.click(TwitterSelectors.username);
		// await page.keyboard.type(twitterUsername);
		// await page.click(TwitterSelectors.password);
		// await page.keyboard.type(twitterPassword);
		// await page.click(TwitterSelectors.login);
	}

	if (service === 'facebook') {

		if (!browser) throw new Error('login function needs to be passed a browser object when logging in via Facebook');

		// return promise and await below
		// workaround for issue where Jest would reach end of test
		// and deem it a success without waiting for the browser.on
		// callback to finish executing
		let fbResolve;
		let fbLoginFinished = new Promise(function(resolve, reject) { fbResolve = resolve; });
		fbLoginFinished.resolve = fbResolve;

		browser.on('targetcreated', async(target) => {
			if(target._targetInfo.type !== 'page') return;
			const fbPage = await target.page();

			await fbPage.waitForSelector(Selectors.username);
			await fbPage.click(Selectors.username);
			await fbPage.keyboard.type(username);

			await fbPage.click(Selectors.password);
			await fbPage.keyboard.type(password);
			await fbPage.click(Selectors.login);

			// only seems to appear once...
			// await fbPage.waitForSelector(FacebookSelectors.continue);
			// await fbPage.click(FacebookSelectors.continue);

			fbLoginFinished.resolve();
		});

		// trigger above code to handle
		// facebook login page
		// second click to handle popup being blocked
		await page.click(Selectors.facebookLogin);
		await page.click(Selectors.facebookLogin);

		// check that user is logged in, fail test if not
		await fbLoginFinished;
	}
}

/**
 * Takes an object in form {CSS_SELECTOR: value},
 * and fills in form accordingly
 */
async function fillInForm({page, Selectors, data}) {
	const keys = Object.keys(data);
	for(let i=0; i<keys.length; i++){
		const key = keys[i];
		const selector = Selectors[key];

		//Clicks checkbox if value doesn't match boolean provided
		if( await page.$eval(selector, e => e.type) === 'checkbox' ) {
				//Would be nicer to have this as one if statement, but there is a bit of faff around passing arguments into page.$eval()
				const checkValue = await page.$eval(selector, e => e.checked);
				if( checkValue != data[key] ) await page.click(selector)
		}
		// Select drop-down menu option
		else if( await page.$eval(selector, e => e.tagName) === 'SELECT' ) {
			await page.select(selector, data[key]);
		}
		else {
			await page.click(selector);
			//Check for default value. Clear field if found
			if(await page.$eval(selector, e => e.value)){
				await page.keyboard.down('Control');
				await page.keyboard.press('a');
				await page.keyboard.up('Control');
				await page.keyboard.press('Backspace');
			} 
			await page.keyboard.type(`${data[key]}`);
		}
	}
}

/**Retrieves ID of event with given name
 * by querying JSON endpoint
 * @param eventOrFundOrVertiserOrVert seriously needs a new name. Thankfully, is only ever called internally.
 */
async function IdByName({fundName, eventOrFundOrVertiserOrVert}) {
	// Make sure that we're comparing strings
	fundName = fundName + '';
	const r = await $.ajax({
		url: `${APIBASE}${eventOrFundOrVertiserOrVert}/_list.json`,
		withCredentials: true,
		jwt: 'eyJraWQiOiJ1b2J4b3UxNjJjZWVkZTJlMSIsImFsZyI6IlJTMjU2In0.eyJpc3MiOiJzb2dpdmUiLCJqdGkiOiJTX0o1UE5rNHpGT0YtVGlrSVdJcDJBIiwiaWF0IjoxNTI3MjQ5NzkwLCJkdmNzaWciOm51bGwsInN1YiI6Im1hcmtAd2ludGVyd2VsbC5jb21AZW1haWwifQ.kmdCG5Xh2YypPLmtD_FP4Gc27cbpOd2Dx1LCOlBJNWqphBN-WQa7I6v-LmhwTbdheb8t7xE10xXtrsp9mObQ8QKsGU6Emdnyp9-eKrUTQFMf5HqwD-qpsiYEjw9SWTSaQkTOP4ieCbE61QL2-_3TN8hq4AAxYmjgJG0IUKUkN5jtozXCFYddqmpEXR4teRr7P470RDEAOqleddIJqd0KCId2ohGCe5CqMDFfcCLoaW-ICghQUAx9wlUDCmEN0I9BxErDp9WJ7spqji0MeanEurLlbAU47q5SyVQS70zAUJS3OhqFK_LHmFVETEQhb5nMpik3hSZJpS5x_YT56causg',
	});
	const hit = r.cargo.hits.filter(fundraiser => fundraiser.name === fundName);
	if(hit && hit[0] && hit[0].id) return hit[0].id;
	return '';
}

async function eventIdFromName({eventName}) {
	return await IdByName({fundName: eventName, eventOrFundOrVertiserOrVert:'event'});
}

async function fundIdByName({fundName}) {
	return await IdByName({fundName, eventOrFundOrVertiserOrVert:'fundraiser'});
};

async function vertiserIdByName({vertiserName}) {
	return await IdByName({fundName: vertiserName, eventOrFundOrVertiserOrVert:'vertiser'});
};

async function vertIdByName({vertName}) {
	return await IdByName({fundName: vertName, eventOrFundOrVertiserOrVert:'vert'}); 
};

/** Depends on current setup where ServerIO is placed in to the window */
async function isPointingAtProduction({page}) {
	const endpoint = await page.evaluate( () => window.ServerIO.DATALOG_ENDPOINT);
	return endpoint.match(/\/\/lg.good-loop.com/);
};

async function soGiveFailIfPointingAtProduction({page}) {
	const endpoint = await page.evaluate( () => window.ServerIO.APIBASE);
	if( endpoint.match(/\/\/app.sogive.org/) || window.location.href.match(/\/\/app.sogive.org/) ) throw new Error("Test service is pointing at production server! Aborting test.");
};

// Goes to the given URL (which must contain a Good-loop ad), watches the video, and makes a donation 
/**
 * Advert must already be somewhere on the page before this method is called
 * @param { object } page puppeteer test object
 * @param { string } type(optional) behaviour needs to be slightly different for type:banner ads
 */
async function watchAdvertAndDonate({page, type}) {
	await page.waitFor(1000);//Allow 'visible' event to register. Doesn't get counted if you start working right away
	let pageOrIFrame = page; // If unit is wrapped in iframe, need to use iframe.ACTION instead of page.ACTION

	// Adunit may have been loaded in to an iframe.
	// Puppeteer will not cycle through frames to look for a given selector, so need to tell it where to look
	// TODO cut down on possible values after this has been harmonised across the different pages/services
	const iframe = await page.frames().find(f => f.name().slice(0, 2) === 'gl' || f.name() === 'test01' || f.name() === 'demo-iframe');
	
	if ( iframe ) {
		pageOrIFrame = iframe;
	}

	// Banner-types
	// Ad on Vpaid page should just autoplay
	if( type === 'banner' ) {
		await pageOrIFrame.waitForSelector(AdServerSelectors.TestAs.Banner);
		await pageOrIFrame.click(AdServerSelectors.TestAs.Banner);            
	}
	try{
		// Click-to-play video
		await pageOrIFrame.waitForSelector(AdServerSelectors.TestAs.ClickToPlay, { timeout: 3000 });
		await pageOrIFrame.click(AdServerSelectors.TestAs.ClickToPlay);
	} catch (e) { 
		console.log("Non click-to-play video. Continuing...");
	}
	// Pick a charity
	await pageOrIFrame.waitForSelector(AdServerSelectors.TestAs.FirstCharityIcon);
	await pageOrIFrame.click(AdServerSelectors.TestAs.FirstCharityIcon);

	await page.waitFor(5000);//Generally needs a second to register that donation has been made
}

module.exports = {
	APIBASE,
	disableAnimations,
	eventIdFromName,
	fillInForm,
	fundIdByName,
	isPointingAtProduction,
	login,
	soGiveFailIfPointingAtProduction,
	takeScreenshot,
	vertIdByName,
	vertiserIdByName,
	watchAdvertAndDonate
};
