import DataStore from '../plumbing/DataStore';
import PromiseValue from 'promise-value';

const path = ['misc', 'adBlockEnabled'];

/** Will set DataStore flag if the user has adblock enabled 
*/
const doDetect = () => {	
	const $script = document.createElement('script');
	// Based on https://www.detectadblock.com/
	// Adblockers are expected to always block js files with "ads" in the name
	$script.setAttribute('src', 'https://ads.good-loop.com/ads.js');
	
	let pv = PromiseValue.pending();
	$script.onload = () => {
		// If adblocker enabled, ads.js will not be able to create div with id #aiPai9th 
		const adBlockEnabled = ! document.getElementById('aiPai9th');
		// DataStore.setValue(path, adBlockEnabled);
		pv.resolve(adBlockEnabled);
	};

	$script.onerror = () => {
		// DataStore.setValue(path, true);
		pv.resolve(true);
	};

	document.head.appendChild($script);
	return pv;
};

/**
 * @returns {PromiseValue} a PromiseValue, value=true means there _is_ an adblocker present.
 */
const detectAdBlock = () => DataStore.fetch(path, doDetect);

export default detectAdBlock;
