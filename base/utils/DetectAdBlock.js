import DataStore from '../plumbing/DataStore';
import PromiseValue from 'promise-value';

const path = ['misc', 'adBlockEnabled'];

/** Will set DataStore flag if the user has adblock enabled 
 * @returns {Promise}
*/
const doDetect = () => {	
	const $script = document.createElement('script');
	// Based on https://www.detectadblock.com/
	// Adblockers are expected to always block js files with "ads" in the name
	$script.setAttribute('src', 'https://ads.good-loop.com/ads.js');
	
	console.log("[ADBLOCK]","Checking ad block status...");

	let pv = PromiseValue.pending();
	$script.onload = () => {
		console.log("[ADBLOCK]","Ad script loaded!");
		// If adblocker enabled, ads.js will not be able to create div with id #aiPai9th 
		const adBlockEnabled = ! document.getElementById('aiPai9th');
		console.log("[ADBLOCK]","Ad script embedded!");
		// DataStore.setValue(path, adBlockEnabled);
		pv.resolve(adBlockEnabled);
	};

	$script.onerror = () => {
		console.log("[ADBLOCK]","Could not load test ad script. Checking general internet...");
		// We might not be connected to internet at all - make another check
		const $img = document.createElement('img');
		$img.setAttribute('id', 'adblockTesterImg');
		$img.setAttribute('src', 'https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png');

		$img.onload = () => {
			console.log("[ADBLOCK]","Loaded general internet! Ads are blocked");
			// Image loaded so internet exists but ads were blocked
			// DataStore.setValue(path, true);
			pv.resolve(true);
		}

		$img.onerror = () => {
			console.log("[ADBLOCK]","Could not load general internet! We are offline");
			// We cannot load anything - no internet
			// "null" equates to false for showing adblock popups but also can be null-tested for no internet
			pv.resolve(null);
		}

	};

	document.head.appendChild($script);
	return pv.promise;
};

/**
 * @returns {PromiseValue} a PromiseValue, value=true means there _is_ an adblocker present.
 */
const detectAdBlock = () => DataStore.fetch(path, doDetect);

export default detectAdBlock;
