const $ = require('jquery');
const {login} = require('../utils/UtilityFunctions');
const {password, username} = require('../utils/Credentials');
const {CommonSelectors} = require('../utils/Selectors');

const config = JSON.parse(process.env.__CONFIGURATION);
const { targetServer } = require('../utils/TestConfig');

//    o<| : o ) --|--<
const APIBASE = targetServer[config.site];

describe('PropControlTest tests', () => {
	let dataStore;

	const updateDataStore = async () => {
		dataStore = JSON.parse(await page.evaluate(() => JSON.stringify(window.DataStore.appstate.widget.propcontroltest) ));
	};

	test('Can open PropControlTest and login', async () => {
		console.log(`${APIBASE}#propControlTest`);
		await page.goto(APIBASE + `#propControlTest`);

		expect(page.title()).resolves.toMatch('Good-Loop Portal');

		await page.waitForSelector(CommonSelectors.logIn); // wait for Misc.Loading to go away
		await page.waitFor(3000);
		await login({page, username, password});
		await page.reload(); // Reload to see content
	}, 99999);

	test('Can filter props through text input', async () => {
		// wait for filter then type string with delay per key
		await page.waitForSelector('.form-control');
		await page.type('[name=filter]', 'money', {delay: 5});

		await page.waitForSelector('.card-item');

		const cardArray = await page.$$('div.card-item');

		// If we filter by 'money' we should be able to see 3 different PropControl cards.
		await expect(cardArray.length).toBe(3);
	}, 99999);

	test('Simple text field communicates correctly with DataStore', async () => {
		await page.goto(APIBASE + `#propControlTest`);

		await page.waitForSelector('.form-control[name=text]');
		await page.type('[name=text]', 'testing...', {delay: 10});

		await page.waitForSelector('.card-item');
		await updateDataStore();

		await expect(dataStore.text).toBe('testing...');
	}, 99999);

	test('Number prop only accepts, well... ints', async () => {
		// Testing valid input first
		await page.waitForSelector('.form-control[name=prop]');
		await page.type('[name=prop]', '21', {delay: 10});

		await page.waitForSelector('.card-item');
		await updateDataStore();

		await expect(dataStore.prop).toBe(21);

		// Invalid Input
		// Triple click on input box to select content and then overwrite it, simulating proper user interaction
		const propField = await page.$('[name=prop]');
		await propField.click({ clickCount: 3 });
		await page.type('[name=prop]', 'string', {delay: 10});

		await updateDataStore();

		// Since we wrote an invalid value the Store stores an empty string instead of the previous int
		await expect(dataStore.prop).toBe('');
	}, 99999);

	test('yesNo radial displays properly and registers right interaction', async () => {
		// When clicking an option, it should be registered in DataStore. If you click the other, it gets overwritten.
		await page.click('[value=yes]');
		await updateDataStore();
		await expect(dataStore.yesNo).toBe(true);

		await page.click('[value=no]');
		await updateDataStore();
		await expect(dataStore.yesNo).toBe(false);
	}, 99999);

	test('Img prop works properly', async () => {
		const secureUrl = 'https://cdn2.iconfinder.com/data/icons/drugs-15/48/37-128.png';
		const insecureUrl = 'http://cdn2.iconfinder.com/data/icons/drugs-15/48/37-128.png';
		const invalidUrl = 'thisIsGibberish...';

		// Test using a secure url
		await page.type('[name=img]', secureUrl);
		let thumbnail = await page.$eval('img.img-thumbnail[src]', img => img.getAttribute('src'));
		await expect(thumbnail).toBe(secureUrl);

		// Test using insecure url
		await page.click('[name=img]', { clickCount: 3 });
		await page.type('[name=img]', insecureUrl);
		thumbnail = await page.$eval('img.img-thumbnail[src]', img => img.getAttribute('src'));
		await expect(thumbnail).toBe(insecureUrl);
	});

	test('Url prop offers open link/warns about secure link', async () => {
		const secureUrl = 'https://blah.fakedomain/';
		const insecureUrl = 'http://blah.fakedomain/';

		await page.type('[name=url]', secureUrl);
		const link = await page.$eval('.url a', e => e.href);

		await expect(link).toBe(secureUrl);

		await page.click('[name=url]', { clickCount: 3 });
		await page.type('[name=url]', insecureUrl);
		const warning = await page.$eval('.url .help-block', e => e.innerHTML);

		await expect(warning).toBe('Please use https for secure urls');
	});

	test('Date prop should process input correctly', async () => {
		const validDate = '2354-04-22';
		const invalidDate = 'totalgibberish';
		let output;

		await page.type('[name=date]', validDate);
		output = await page.$eval('.date .pull-right i', e => e.innerHTML);
		await expect(output).toBe('22 Apr 2354');

		await page.type('[name=date]', invalidDate);
		output = await page.$eval('.date .pull-right i', e => e.innerHTML);
		await expect(output).toBe('Invalid Date');

		const helpMessage = await page.$eval('.date .help-block', e => e.innerHTML);
		await expect(helpMessage).toBe('Please use the date format yyyy-mm-dd');
	});

	test('Select displays/stores correctly', async () => {
		await page.select('[name=select]', 'apple');
		await updateDataStore();

		await expect(dataStore.select).toBe('apple');

		await page.select('[name=select]', 'pear');
		await updateDataStore();

		await expect(dataStore.select).toBe('pear');
	});

	test('Year accepts/stores only numbers; null otherwise', async () => {
		const validYear = '2014';
		const invalidYear = 'invalidyear';

		await page.type('[name=year]', validYear);
		await updateDataStore();
		await expect(dataStore.year).toBe(2014);

		await page.click('[name=year]', { clickCount: 3 });
		await page.type('[name=year]', invalidYear);
		await updateDataStore();
		await expect(dataStore.year).toBe(null);
	});

	// TODO: Replace hardcoded values and update PropControlTest in order to better test different choices.
	test('Radio (passing function for labels) displays/stores correctly', async () => {
		await page.click('[name=radio-function]');
		await updateDataStore();

		let expected = await page.$eval('[name=radio-function]', e => e.value);
		await expect(dataStore['radio-function']).toBe(expected);

		await page.click('[name=radio-map]');
		await updateDataStore();

		expected = await page.$eval('[name=radio-map]', e => e.value);
		await expect(dataStore['radio-map']).toBe('a');
	});

	test('Checkbox performs as expected', async () => {
		await expect(dataStore.checkbox).toBe(undefined);

		await page.click('[type=checkbox]');
		await updateDataStore();

		await expect(dataStore.checkbox).toBe(true);

		await page.click('[type=checkbox]');
		await updateDataStore();

		await expect(dataStore.checkbox).toBe(false);
	});

	test('Arraytext performs as expected', async() => {
		const testString = 'This is a string with spaces';
		const stringArr = testString.split(' ');
        
		await page.type('[name=arraytext]', testString);
		await updateDataStore();

		// If we compare content the arrs should be equal. Notice that other comparisons will result in a failure.
		await expect(dataStore.arraytext).toEqual(stringArr);
	});

	test('Entryset performs as expected', async () => {
		const key = 'key1';
		const value = 'value1';
		await page.type('[placeholder=key]', key);
		await page.type('[placeholder=value]', value);
		await page.click('.entryset button');
		await updateDataStore();

		await page.waitForSelector(`[value=${value}]`); // If this tag gets generated, prop is storing and displaying sets as intended.

		// Make sure user can remove sets by clicking on the delete button.
		// If the .entried div is empty, then we have succeeded.
		await page.click('.remove-entry');

		const entriesArr = Array.from(await page.$$('.entry'));
		await expect(entriesArr.length).toBeFalsy();
	});

	test('Money saves data correctly based on input', async () => {
		const input = '23.41';

		await page.type('[name=money]', input);
		await updateDataStore();

		await expect(dataStore.money['@type']).toBe('Money');
		await expect(dataStore.money.currency).toEqual('GBP');
		await expect(dataStore.money.value).toEqual(23.41);
		await expect(dataStore.money.value100p).toBe(234100);
	});
});
