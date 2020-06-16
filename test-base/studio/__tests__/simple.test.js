
// TODO for help on this see <doc??>

const config = JSON.parse(process.env.__CONFIGURATION);
const { ourServers} = require('../utils/testConfig');

const baseSite = ourServers[config.site];

describe('Studio - smoke test', () => {
	it('should load a page', async () => {
		console.log("goto "+baseSite+"...");
		await page.goto(baseSite);
		await expect(page).toMatch('Studio');
	});

	it("PropControl: Basic text input", async () => {
		await page.goto(baseSite+'?f=basic');
		await expect(page).toMatch('Basic');
		
		// type in text
		await page.type('[name=mybasictext]', "Hello World");

		// check screen updated
		const iv = await page.$eval('[name=mybasictext]', e => e.value);
		expect(iv).toBe("Hello World");		
		// check datastore updated
		const dv = await page.$eval('body', 
			e => window.DataStore.getValue(['widget','BasicTextPropControl','mybasictext'])
		);
		expect(dv).toBe("Hello World");				

	});

	it("PropControl: Text area", async () => {
		await page.goto(baseSite+'?f=text area');
		await expect(page).toMatch('Text area');
		
		// type in text
		await page.type('[name=mytextarea]', "Hello World");

		// check screen updated
		const iv = await page.$eval('[name=mytextarea]', e => e.value);
		expect(iv).toBe("Hello World");		
		// check datastore updated
		const dv = await page.$eval('body', 
			e => window.DataStore.getValue(['widget','BasicTextPropControl','mytextarea'])
		);
		expect(dv).toBe("Hello World");				

	});

	// TODO: Add in auto-correcting test when functionality is working again
	it("!!Broken!! - PropControl: Autocomplete", async () => {
		if (true) return;

		await page.goto(baseSite+'?f=auto');
		await expect(page).toMatch('Auto');
		
		// type in text
		await page.type('div.autocomplete>div>input.form-control', "Hello World");

		// check screen updated
		const iv = await page.$eval('div.autocomplete>div>input.form-control', e => e.value);
		expect(iv).toBe("Hello World");		
		// check datastore updated
		const dv = await page.$eval('body', 
			e => window.DataStore.getValue(['widget','BasicTextPropControl','myautocomp'])
		);
		expect(dv).toBe("Hello World");				

	});

	it("PropControl: URL", async () => {
		await page.goto(baseSite+'?f=url');
		await expect(page).toMatch('URL');
		
		// type in text
		await page.type('[name=myurl]', "https://www.good-loop.com");

		// check screen updated
		const iv = await page.$eval('[name=myurl]', e => e.value);
		expect(iv).toBe("https://www.good-loop.com");		
		// check datastore updated
		const dv = await page.$eval('body', 
			e => window.DataStore.getValue(['widget','BasicTextPropControl','myurl'])
		);
		expect(dv).toBe("https://www.good-loop.com");	

		// Clear field
		for (let i = 0; i < iv.length; i++) {
			await page.keyboard.press('Backspace');
		}

		// ERROR CHECK

		// type in text
		await page.type('[name=myurl]', "good loop");

		// check screen updated
		const iv2 = await page.$eval('[name=myurl]', e => e.value);
		expect(iv2).toBe("good loop");		
		// check datastore updated
		const dv2 = await page.$eval('body', 
			e => window.DataStore.getValue(['widget','BasicTextPropControl','myurl'])
		);
		expect(dv2).toBe("good loop");
		// check error is generated
		const ev = await page.$eval('.help-block.text-danger', e => e.innerHTML);
		expect(ev).toBe("This is not a valid URL");

	});

	it("PropControl: MoneyControl", async () => {
		await page.goto(baseSite+'?f=money');
		await expect(page).toMatch('Money');
		
		// type in text
		await page.type('[name=mymoney]', "50");

		// check screen updated
		const iv = await page.$eval('[name=mymoney]', e => e.value);
		expect(iv).toBe("50");		
		// check datastore updated
		const dv = await page.$eval('body', 
			e => window.DataStore.getValue(['widget','BasicTextPropControl','mymoney'])
		);
		expect(dv.value).toBe(50);
		expect(dv.currency).toBe("GBP");

		// Clear field
		for (let i = 0; i < iv.length; i++) {
			await page.keyboard.press('Backspace');
		}

		// ERROR CHECK - min value

		// type in text
		await page.type('[name=mymoney]', "2.5");

		// check screen updated
		const iv2 = await page.$eval('[name=mymoney]', e => e.value);
		expect(iv2).toBe("2.5");		
		// check datastore updated
		const dv2 = await page.$eval('body', 
			e => window.DataStore.getValue(['widget','BasicTextPropControl','mymoney'])
		);
		expect(dv2.value).toBe(2.5);
		expect(dv2.currency).toBe("GBP");
		// check error is generated
		const ev = await page.$eval('.help-block.text-danger', e => e.innerHTML);
		expect(ev).toBe("Value is below the minimum £5");

		// Clear field
		for (let i = 0; i < iv2.length; i++) {
			await page.keyboard.press('Backspace');
		}

		// ERROR CHECK - max value

		// type in text
		await page.type('[name=mymoney]', "105");

		// check screen updated
		const iv3 = await page.$eval('[name=mymoney]', e => e.value);
		expect(iv3).toBe("105");		
		// check datastore updated
		const dv3 = await page.$eval('body', 
			e => window.DataStore.getValue(['widget','BasicTextPropControl','mymoney'])
		);
		expect(dv3.value).toBe(105);
		expect(dv3.currency).toBe("GBP");
		// check error is generated
		const ev2 = await page.$eval('.help-block.text-danger', e => e.innerHTML);
		expect(ev2).toBe("Value is above the maximum £100");

	});

	it("PropControl: Date", async () => {
		await page.goto(baseSite+'?f=date');
		await expect(page).toMatch('Date');
		
		// type in text
		await page.type('[name=mydate]', "2020-08-06");

		// check screen updated
		const iv = await page.$eval('[name=mydate]', e => e.value);
		expect(iv).toBe("2020-08-06");		
		// check datastore updated
		const dv = await page.$eval('body', 
			e => window.DataStore.getValue(['widget','BasicTextPropControl','mydate'])
		);
		expect(dv).toBe("2020-08-06");	

		// Clear field
		for (let i = 0; i < iv.length; i++) {
			await page.keyboard.press('Backspace');
		}

		// ERROR CHECK

		// type in text
		await page.type('[name=mydate]', "20-6-12");

		// check screen updated
		const iv2 = await page.$eval('[name=mydate]', e => e.value);
		expect(iv2).toBe("20-6-12");		
		// check datastore updated
		const dv2 = await page.$eval('body', 
			e => window.DataStore.getValue(['widget','BasicTextPropControl','mydate'])
		);
		expect(dv2).toBe("20-6-12");
		// check error is generated
		const ev = await page.$eval('.help-block.text-danger', e => e.innerHTML);
		expect(ev).toBe("Please use the date format yyyy-mm-dd");

	});

	it("PropControl: Country input", async () => {
		await page.goto(baseSite+'?f=country');
		await expect(page).toMatch('Country');
		
		// make selection
		await page.select('[name=mycountry]', 'GB');

		// check screen updated
		const iv = await page.$eval('[name=mycountry]', e => e.options[e.selectedIndex].text);
		expect(iv).toBe("United Kingdom (UK)");		
		// check datastore updated
		const dv = await page.$eval('body', 
			e => window.DataStore.getValue(['widget','BasicTextPropControl','mycountry'])
		);
		expect(dv).toBe("GB");

	});

	it("PropControl: Radio buttons", async () => {
		await page.goto(baseSite+'?f=radio');
		await expect(page).toMatch('Radio');
		
		// make selection
		await page.click('[name=myradio][value=Apples]');

		// check screen updated
		const iv = await page.$eval('[name=myradio][value=Apples]', e => e.checked);
		expect(iv).toBe(true);		
		// check datastore updated
		const dv = await page.$eval('body', 
			e => window.DataStore.getValue(['widget','BasicTextPropControl','myradio'])
		);
		expect(dv).toBe("Apples");

		//check other options deselect when a new option is selected

		// make selection
		await page.click('[name=myradio][value=Bananas]');

		// check screen updated
		const iv2 = await page.$eval('[name=myradio][value=Bananas]', e => e.checked);
		expect(iv2).toBe(true);
		// check other option is deselected
		const iv3 = await page.$eval('[name=myradio][value=Apples]', e => e.checked);
		expect(iv3).toBe(false);	
		// check datastore updated
		const dv2 = await page.$eval('body', 
			e => window.DataStore.getValue(['widget','BasicTextPropControl','myradio'])
		);
		expect(dv2).toBe("Bananas");

	});
	
	it("PropControl: Yes-No", async () => {
		await page.goto(baseSite+'?f=yes');
		await expect(page).toMatch('Yes');
		
		// make selection
		await page.click('[name=yehnay][value=yes]');

		// check screen updated
		const iv = await page.$eval('[name=yehnay][value=yes]', e => e.checked);
		expect(iv).toBe(true);
		// check datastore updated
		const dv = await page.$eval('body', 
			e => window.DataStore.getValue(['widget','BasicTextPropControl','yehnay'])
		);
		expect(dv).toBe(true);

		//check other options deselect when a new option is selected

		// make selection
		await page.click('[name=yehnay][value=no]');

		// check screen updated
		const iv2 = await page.$eval('[name=yehnay][value=no]', e => e.checked);
		expect(iv2).toBe(true);
		// check other option is deselected
		const iv3 = await page.$eval('[name=yehnay][value=yes]', e => e.checked);
		expect(iv3).toBe(false);	
		// check datastore updated
		const dv2 = await page.$eval('body', 
			e => window.DataStore.getValue(['widget','BasicTextPropControl','yehnay'])
		);
		expect(dv2).toBe(false);

	});

	it("PropControl: Checkboxes", async () => {
		await page.goto(baseSite+'?f=check');
		await expect(page).toMatch('Check');
		
		// make selection
		await page.click('[name=mycheckbox][value=Cash]');

		// check screen updated
		const iv = await page.$eval('[name=mycheckbox][value=Cash]', e => e.checked);
		expect(iv).toBe(true);
		// check datastore updated
		const dv = await page.$eval('body', 
			e => window.DataStore.getValue(['widget','BasicTextPropControl','mycheckbox'])
		);
		expect(dv).toBe("Cash");

		//check other options deselect when a new option is selected

		// make selection
		await page.click('[name=mycheckbox][value=Card]');

		// check screen updated
		const iv2 = await page.$eval('[name=mycheckbox][value=Card]', e => e.checked);
		expect(iv2).toBe(true);
		// check other option is deselected
		const iv3 = await page.$eval('[name=mycheckbox][value=Cash]', e => e.checked);
		expect(iv3).toBe(false);	
		// check datastore updated
		const dv2 = await page.$eval('body', 
			e => window.DataStore.getValue(['widget','BasicTextPropControl','mycheckbox'])
		);
		expect(dv2).toBe("Card");

	});

	it("PropControl: Selection control", async () => {
		await page.goto(baseSite+'?f=selection');
		await expect(page).toMatch('Selection');
		
		// make selection
		await page.select('[name=myselect]', 'fee');

		// check screen updated
		const iv = await page.$eval('[name=myselect]', e => e.options[e.selectedIndex].text);
		expect(iv).toBe("Fee");		
		// check datastore updated
		const dv = await page.$eval('body', 
			e => window.DataStore.getValue(['widget','BasicTextPropControl','myselect'])
		);
		expect(dv).toBe("fee");

	});

	it("PropControl: Multiselect control", async () => {
		await page.goto(baseSite+'?f=multi');
		await expect(page).toMatch('Multi');
		
		// make selection
		await page.click('[type=checkbox][value=fee]');
		await page.click('[type=checkbox][value=fo]');

		// check screen updated
		const iv = await page.$eval('[type=checkbox][value=fee]', e => e.checked);
		expect(iv).toBe(true);
		const iv2 = await page.$eval('[type=checkbox][value=fo]', e => e.checked);
		expect(iv2).toBe(true);
		// check datastore updated
		const dv = await page.$eval('body', 
			e => window.DataStore.getValue(['widget','BasicTextPropControl','mymultselect'])
		);
		expect(dv[0]).toBe("fee");
		expect(dv[1]).toBe("fo");
	});

	it("PropControl: Image URL", async () => {
		await page.goto(baseSite+'?f=image url');
		await expect(page).toMatch('Image URL');
		
		const url = 'https://uploads-ssl.webflow.com/5cd560eec4480f4f00e3c1c1/5d1f67f4e3f0a740c2bc0dba_favicon-60x60.png';

		// type in text
		await page.type('[name=myimg]', url);

		//if (true) return;

		// check image is loaded
		const iv = await page.$eval('img.img-thumbnail', e => e.src);
		expect(iv).toBe(url);
		// check datastore updated
		const dv = await page.$eval('body', 
			e => window.DataStore.getValue(['widget','BasicTextPropControl','myimg'])
		);
		expect(dv).toBe(url);				

	});

	it("PropControl: XId input", async () => {
		await page.goto(baseSite+'?f=xid');
		await expect(page).toMatch('XId');
		
		const text = "External ID Test";

		// type in text
		await page.type('[name=myxid]', text);

		// check screen updated
		const iv = await page.$eval('[name=myxid]', e => e.value);
		expect(iv).toBe(text);		
		// check datastore updated
		const dv = await page.$eval('body', 
			e => window.DataStore.getValue(['widget','BasicTextPropControl','myxid'])
		);
		expect(dv).toBe(text + '@service');				

	});

	it("PropControl: Array text", async () => {
		await page.goto(baseSite+'?f=array');
		await expect(page).toMatch('Array');
		
		const text = "this, is, a, test";

		// type in text
		await page.type('[name=myarraytext]', text);

		// check screen updated
		const iv = await page.$eval('[name=myarraytext]', e => e.value);
		expect(iv).toBe(text);		
		// check datastore updated
		const dv = await page.$eval('body', 
			e => window.DataStore.getValue(['widget','BasicTextPropControl','myarraytext'])
		);
		const expected = text.split(" ");
		expected.forEach((e,i) => expect(dv[i]).toBe(e)); // compare the arrays by element

	});

	// Does not update DataStore on entry removal, which fails test
	it("PropControl: Key set", async () => {

		await page.goto(baseSite+'?f=key set');
		await expect(page).toMatch('Key set');
		
		const testKeys = ["terrific","marvelous","super","extroardinary"];

		// add keys
		for (let i = 0; i < testKeys.length; i++) {
			const e = testKeys[i];

			// type in text
			await page.type('div.keyset>form>input[type=text]', e);
			// check screen updated
			const iv = await page.$eval('div.keyset>form>input[type=text]', e => e.value);
			expect(iv).toBe(e);

			// submit key
			await page.click('div.keyset>form>button');
			// check input has cleared
			const iv2 = await page.$eval('div.keyset>form>input[type=text]', e => e.value);
			expect(iv2).toBe('');
		}

		// check keys have been displayed
		const keylist = await page.$$eval('span.key', keys => keys.map(key => key.innerHTML.slice(0, -' <span class=\"remove-key\">×</span>'.length)));
		expect(keylist.length).toBe(testKeys.length);
		keylist.forEach((e,i) => expect(e).toBe(testKeys[i]));

		// check datastore updated
		const dv = await page.$eval('body',
			e => window.DataStore.getValue(['widget','BasicTextPropControl','mykeyset'])
		);
		// compare the object to array
		let i = 0;
		for (key in dv) {
			expect(key).toBe(testKeys[i]);
			expect(dv[key]).toBe(true);
			i++;
		}
		expect(i).toBe(testKeys.length);

		// test entry removal
		await page.click('span.remove-key');
		const keylist2 = await page.$$eval('span.key', keys => keys.map(key => key.innerHTML));
		expect(keylist2.length).toBe(testKeys.length - 1);

		// check datastore updated
		const dv2 = await page.$eval('body',
			e => window.DataStore.getValue(['widget','BasicTextPropControl','mykeyset'])
		);
		// compare the object to array
		i = 0;
		for (key in dv2) {
			expect(key).toBe(testKeys[i]);
			if (i==0) expect(dv2[key]).toBe(false);
			else expect(dv2[key]).toBe(true);
			i++;
		}
		expect(i).toBe(testKeys.length);

		// attempt to re-add removed key

		const e = testKeys[0];

		// type in text
		await page.type('div.keyset>form>input[type=text]', e);
		// check screen updated
		const iv3 = await page.$eval('div.keyset>form>input[type=text]', e => e.value);
		expect(iv3).toBe(e);

		// submit key
		await page.click('div.keyset>form>button');
		// check input has cleared
		const iv4 = await page.$eval('div.keyset>form>input[type=text]', e => e.value);
		expect(iv4).toBe('');

		// check datastore updated
		const dv3 = await page.$eval('body',
			e => window.DataStore.getValue(['widget','BasicTextPropControl','mykeyset'])
		);
		// compare the object to array
		i = 0;
		for (key in dv3) {
			expect(key).toBe(testKeys[i]);
			expect(dv3[key]).toBe(true);
			i++;
		}
		expect(i).toBe(testKeys.length);

	});

	// Does not update DataStore on entry removal, which fails test
	it("PropControl: Entry set", async () => {

		await page.goto(baseSite+'?f=entry');
		await expect(page).toMatch('Entry');
		
		// scones
		const testKeys = ["self raising flour", "butter", "salt", "water"];
		const testVals = ["300g", "85g", "a pinch", "175ml"];
		/*
		* Put the softened butter, flour and salt in a mixing bowl and rub together with fingers until like breadcrumbs.
		* Add the water all at once and mix quickly with a butter knife
		* Put on floured surface and knead. Dough will feel wet
		* Cut/tear pieces 3-4cm thick and put on baking tray
		* Bake at 220 Celcius for 10-15 mins, until lightly browned.
		*/

		// add key value pairs
		for (let i = 0; i < testKeys.length; i++) {
			const ek = testKeys[i];
			const ev = testVals[i];
			
			// type in text
			await page.type('input.form-control[placeholder=key]', ek);
			await page.type('input.form-control[placeholder=value]', ev);
			// check screen updated
			const iv = await page.$eval('input.form-control[placeholder=key]', e => e.value);
			expect(iv).toBe(ek);
			const iv2 = await page.$eval('input.form-control[placeholder=value]', e => e.value);
			expect(iv2).toBe(ev);

			// submit key		
			await page.click('button.btn-primary');

			// clear fields
			await page.focus('input.form-control[placeholder=key]');
			for (let i = 0; i < iv.length; i++) {
				await page.keyboard.press('Backspace');
			}
			await page.focus('input.form-control[placeholder=value]');
			for (let i = 0; i < iv2.length; i++) {
				await page.keyboard.press('Backspace');
			}
		}
		
		// check keys have been displayed
		const keylist = await page.$$eval('tr.entry>td.px-2', keys => keys.map(key => key.innerHTML.slice(0, -1)));
		expect(keylist.length).toBe(testKeys.length);
		keylist.forEach((e,i) => expect(e).toBe(testKeys[i]));
		// check values have been displayed
		const vallist = await page.$$eval('tr.entry>td>div.text>input[type=text]', vals => vals.map(val => val.value));
		expect(vallist.length).toBe(testVals.length);
		vallist.forEach((e,i) => expect(e).toBe(testVals[i]));

		// check datastore updated
		const dv = await page.$eval('body',
			e => window.DataStore.getValue(['widget','BasicTextPropControl','myentryset'])
		);
		// compare the object to array
		let i = 0;
		for (key in dv) {
			expect(key).toBe(testKeys[i]);
			expect(dv[key]).toBe(testVals[i]);
			i++;
		}
		expect(i).toBe(testKeys.length);

		// test entry removal
		await page.click('button.remove-entry');
		const keylist2 = await page.$$eval('tr.entry>td.px-2', keys => keys.map(key => key.innerHTML.slice(0, -1)));
		expect(keylist2.length).toBe(testKeys.length - 1);

		// check datastore updated
		const dv2 = await page.$eval('body',
			e => window.DataStore.getValue(['widget','BasicTextPropControl','myentryset'])
		);
		// compare the object to array
		i = 0;
		for (key in dv2) {
			expect(key).toBe(testKeys[i]);
			if (i==0) expect(dv2[key]).toBe(false);
			else expect(dv2[key]).toBe(testVals[i]);
			//console.log("Key: " + key + ", Value: " + dv2[key]);
			i++;
		}
		expect(i).toBe(testKeys.length);

		// attempt to re-add entry

		const ek = testKeys[0];
		const ev = testVals[0];
		
		// type in text
		await page.type('input.form-control[placeholder=key]', ek);
		await page.type('input.form-control[placeholder=value]', ev);
		// check screen updated
		const iv3 = await page.$eval('input.form-control[placeholder=key]', e => e.value);
		expect(iv3).toBe(ek);
		const iv4 = await page.$eval('input.form-control[placeholder=value]', e => e.value);
		expect(iv4).toBe(ev);

		// submit key		
		await page.click('button.btn-primary');

		// check datastore updated
		const dv3 = await page.$eval('body',
			e => window.DataStore.getValue(['widget','BasicTextPropControl','myentryset'])
		);
		// compare the object to array
		
		i = 0;
		for (key in dv3) {
			expect(key).toBe(testKeys[i]);
			expect(dv3[key]).toBe(testVals[i]);
			i++;
		}
		expect(i).toBe(testKeys.length);

	});

	// TODO: Fill in when HTML is working
	it("!!Broken!! - Prop Control: HTML", async () => {
		if (true) return;
	});

	it("PropControl: JSON", async () => {
		//if (true) return;
		await page.goto(baseSite+'?f=json');
		await expect(page).toMatch('JSON');
		
		const text = '{"Hello":"World!"}';

		// type in text
		await page.type('[name=myjson]', text);
		for (let i = 0; i < 2; i++) {
			await page.keyboard.press('Delete');
		}

		// check screen updated
		const iv = await page.$eval('[name=myjson]', e => e.value);
		expect(iv).toBe(text);		
		// check datastore updated
		const dv = await page.$eval('body', 
			e => window.DataStore.getValue(['widget','BasicTextPropControl','myjson'])
		);
		expect(JSON.stringify(dv)).toBe(JSON.stringify({Hello:"World!"}));

		// Clear field
		for (let i = 0; i < iv.length; i++) {
			await page.keyboard.press('Backspace');
		}
		for (let i = 0; i < 2; i++) {
			await page.keyboard.press('ArrowLeft');
		}

		// check input works when replacing JSON

		const text2 = '{"foo":"bar"}';

		// type in text
		await page.type('[name=myjson]', text2);
		for (let i = 0; i < 2; i++) {
			await page.keyboard.press('Delete');
		}

		// check screen updated
		const iv2 = await page.$eval('[name=myjson]', e => e.value);
		expect(iv2).toBe(text2);		
		// check datastore updated
		const dv2 = await page.$eval('body', 
			e => window.DataStore.getValue(['widget','BasicTextPropControl','myjson'])
		);
		expect(JSON.stringify(dv2)).toBe(JSON.stringify({foo:"bar"}));

	});

});