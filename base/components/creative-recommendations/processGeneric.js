import ServerIO from '../../plumbing/ServerIOBase';
import { RECOMPRESS_ENDPOINT } from '../../utils/pageAnalysisUtils';


/** Helper for optimisations that don't involve the server. */
export function processLocal(transfer, type, extraData) {
	console.log("processLocal ie skip", type, transfer);
	return new Promise(resolve => resolve({ ...transfer, type, optUrl: null, optBytes: 0, optimised: true, ...extraData }));
}


/** Call /recompress - boilerplate for standard params and response */
export function callRecompressServlet(transfer, type, extraData) {
	console.log("callRecompressServlet", type, transfer);
	const data = { url: transfer.url, type, ...extraData };

	return ServerIO.load(RECOMPRESS_ENDPOINT, { data }).then(res => {
		const { url: optUrl, bytes: optBytes, ...rest } = res.data;
		return { ...transfer, type, optUrl, optBytes, ...rest, optimised: true };
	});
}


export function processEmpty(transfer) {
	return processLocal(transfer, { message: 'Empty transfer.' });
}


export function processGif(transfer) {
	// Ignore tiny images like tracking pixels and interface buttons
	if (transfer.bytes < 3000) {
		const { url: optUrl, bytes: optBytes } = transfer;
		return processLocal(transfer, 'image', { optUrl, optBytes, message: `Ignoring tiny file (${transfer.bytes} bytes)`, noop: true });
	};
	return callRecompressServlet(transfer, 'gif');
}


export function processSvg(transfer) {
	return callRecompressServlet(transfer, 'svg');
}


const scriptReplacements = [
	{ pattern: /tweenmax.+\.(min\.)?js/i, url: 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js', message: 'GSAP 3 is a drop-in replacement for TweenMax', bytes: 23942 },
];


export function processScript(transfer) {
	// Is there a simple replacement? (eg TweenMax --> GSAP 3)
	const scriptReplacement = scriptReplacements.find(({pattern}) => name.match(pattern));
	if (scriptReplacement) {
		const { url: optUrl, bytes: optBytes, message } = scriptReplacement;
		return processLocal(transfer, { optUrl, optBytes, message, isSubstitute: true });
	}

	// No - see if UglifyJS on the server can do anything.
	return callRecompressServlet(transfer, 'script');
}


export function processFont(transfer) {
	const { font } = transfer; // Usage in page

	// Couldn't find any text using this font: mark as "possibly unused"
	if (!font?.characters?.length) return processLocal(transfer, 'font', { unused: true });

	// Call servlet - subset and ensure format is WOFF2
	return callRecompressServlet(transfer, 'font', { characters: font.characters });
};