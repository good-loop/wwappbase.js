import processImage from './processImage';
import { processEmpty, processSvg, processGif, processFont, processScript } from './processGeneric';
import { flattenProp, isType } from '../../utils/pageAnalysisUtils';


export const RECS_PATH = ['widget', 'creative-recommendations'];

export const RECS_OPTIONS_PATH = [...RECS_PATH, 'options'];


function manifestPathBit({tag, url, html}) {
	const subPath = (tag && 'tag') || (url && 'url') || (html && 'html') || 'null';
	const endPath = tag?.id || url || html || 'null';
	return [subPath, endPath];
}


/**
 * DataStore path for PageManifest corresponding to a particular Green Ad Tag.
 * @param p Should have only one of p.tag, p.url, p.html
 * @param {GreenTag} [p.tag] The Green Ad Tag the manifest is attached to
 * @param {String} [p.url] The analysed URL, if the manifest is not attached to a GAT
 * @param {String} [p.html] The analysed HTML fragment (script tag etc), if the manifest is not attached to a GAT
 */
export function savedManifestPath({tag, url, html}) {
	return [...RECS_PATH, 'saved-tag-measurement', ...manifestPathBit({tag, url, html})];
}


/**
 * DataStore path for list of recommendations pertaining to a particular page/creative/etc analysis.
 * De-duplicates on manifest timestamp (so a re-analysis is stored under a new path) and recommendation options
 * - so recs for the same manifest with e.g. retina and standard resolution selected are stored under different paths.
 * @param p Should have only one of p.tag, p.url, p.html
 * @param {GreenTag} [p.tag] The Green Ad Tag the manifest is attached to
 * @param {String} [p.url] The analysed URL, if the manifest is not attached to a GAT
 * @param {String} [p.html] The analysed HTML fragment (script tag etc), if the manifest is not attached to a GAT
 * @param {Object} [manifest] The PageManifest returned by MeasureServlet (or loaded from /persist/)
 */
export function processedRecsPath({tag, url, html}, manifest) {
	const optionString = JSON.stringify(DataStore.getValue(RECS_OPTIONS_PATH));
	return [...RECS_PATH, 'processed-recs', ...manifestPathBit({tag, url, html}), manifest?.timestamp || 0, optionString];
}



/**
 * Request a new analysis from MeasureServlet.
 * @param p Should have only one of p.tag, p.url, p.html
 * @param {GreenTag} [p.tag] A Green Ad Tag to analyse
 * @param {String} [p.url] A URL to analyse
 * @param {String} [p.html] A HTML fragment to analyse
 */
export function startAnalysis({tag, url, html}) {
	if (!tag?.id && !url && !html) return;
	const path = savedManifestPath({tag, url, html});

	// Remove any previously-stored analysis
	DataStore.setValue(path, null);
	const data = {};
	if (tag) data.tagId = tag.id;
	if (tag?.creativeURL) data.url = tag.creativeURL;
	if (tag?.creativeHtml) data.html = tag.creativeHtml;
	if (url) data.url = url;
	if (html) data.html = html;

	return ServerIO.load(`${ServerIO.MEASURE_ENDPOINT}`, { data }).then(res => {
		if (res.error) throw new Error(res.error);
		// Store results in the standard location
		DataStore.setValue(path, res.data);
		return res;
	});
};


/**
 * Receive an analysis of a ZIP file uploaded to MeasureServlet
 */
export function uploadAnalysis(res) {
	DataStore.setValue(savedManifestPath({upload: 'upload'}, res.data));
}


/**
 * Generates a short display name for a URL.
 * Returns either:
 * - the "filename" part of the URL (eg https://www.domain.tld/dir/filename.ext --> "filename.ext")
 * - the last "directory" part  (eg https://www.domain.tld/dir/subdir/ --> "subdir/"
 * - "/" for domain root
 * - "[Strange URL]" if none of the above can be found
 */
export function shortenName(url) {
	let matches = null;
	try {
		matches = new URL(url).pathname.match(/\/([^/]*\/?)$/);
	} catch (e) { /* Malformed URL - oh well. */ }
	if (matches) return matches[1] || matches[0]; // if path is "/", match will succeed but group 1 will be empty
	return '[Strange URL]';
};


/** Find potential optimisations for an individual file. */
export function processTransfer(transfer) {
	// TODO Mark processed transfers with options used so we can just regenerate the ones the new options affect?
	if (transfer.bytes === 0) {
		// Duplicate transfer - 0 bytes because it's a cache hit.
		return processEmpty(transfer);
	} else if (isType(transfer, 'font')) {
		return processFont(transfer);
	} else if (isType(transfer, 'svg')) {
		return processSvg(transfer);
		// TODO Offer raster conversion
	} else if (isType(transfer, 'gif')) {
		return processGif(transfer);
	} else if (isType(transfer, 'image')) {
		return processImage(transfer);
	} else if (isType(transfer, 'script')) {
		return processScript(transfer);
	}

	return new Promise((resolve, reject) => reject('No recommendation function for transfer', transfer));
}


/** Sort recommendations, largest impact first */
function recsSortFn(a, b) {
	const rednA = a.bytes - a.optBytes;
	const rednB = b.bytes - b.optBytes;
	return rednB - rednA;
};


/**
 * For a transfer of a font file: Find a font spec from the page manifest with a matching URL & attach it.
 */
function augmentFont(transfer, fonts) {
	const fontSpecForTransfer = fonts[transfer.url];
	if (!fontSpecForTransfer) return;

	transfer.font = fontSpecForTransfer;
}


/**
 * For a transfer of an image or video file:
 * - Find any elements in the page manifest with the same source URL
 * - Attach those elements to the transfer
 */
function augmentMedia(transfer, mediaElements) {
	if (isType(transfer, 'image') || isType(transfer, 'video')) {
		mediaElements.filter(e => (e.resourceURL === transfer.url)).forEach(el => {
			if (!transfer.elements) transfer.elements = [];
			transfer.elements.push(el);
		});
	}
}


/** Generate and store list of recommendations */
export function generateRecommendations(manifest, path) {
	// Pull out all transfers, font specs, and media-bearing elements
	const allTransfers = flattenProp(manifest, 'transfers', 'frames');
	const allFonts = flattenProp(manifest, 'fonts', 'frames').reduce((acc, fontsObj) => Object.assign(acc, fontsObj), {});
	const allMediaElements = flattenProp(manifest, 'elements', 'frames');

	const newList = [];

	allTransfers.forEach(t => {
		// Pair up each font and media transfer with information on how it's used in the analysed page
		if (isType(t, 'image') || isType(t, 'video')) {
			augmentMedia(t, allMediaElements)
		} else if (isType(t, 'font')) {
			augmentFont(t, allFonts);
		}
		// Convenient info
		t.filename = shortenName(t.url);
		t.bytes = t.resBody;

		// Start the recommendation-generation process for this transfer & store each result when complete
		processTransfer(t).then(augTransfer => {
			// in-place array ops, should be concurrency safe (insofar as JS engine makes them atomic)
			newList.push(augTransfer);
			newList.sort(recsSortFn);
			DataStore.setValue(path, newList); // no-op wrt what's actually stored, but triggers a refresh
		})
	});
}
