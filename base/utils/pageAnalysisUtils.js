import ServerIO from "../plumbing/ServerIOBase";

const MEASURE_ENDPOINT_BASE = ServerIO.MEASURE_ENDPOINT.replace(/\/measure$/, '');
export const PROXY_ENDPOINT = `${MEASURE_ENDPOINT_BASE}/proxy`;
export const RECOMPRESS_ENDPOINT = `${MEASURE_ENDPOINT_BASE}/recompress`;


export function storedManifestForTag(tagId) {
	return `${MEASURE_ENDPOINT_BASE}/persist/greentag_${tagId}/results.json`;
}


/* Make something that may not be an array (or even exist) into an array, without nesting things that already are. */
function arrayify(thing) {
	if (thing === null || thing === undefined) return [];
	if (Array.isArray(thing)) return [...thing];
	return [thing];
};


/**
 * Pulls out a named property from every node in a tree of homogeneous nodes.
 * e.g. to pull all transfers out of a manifest including those in subframes, call flattenProp(manifest, 'transfers', 'frames');
 * @param {object} root The root node of the tree
 * @param {string} propKey The name of the property to extract
 * @param {string} childKey The name under which each node's children are stored
 * 
 * @return {*[]} Every instance of the named property in the tree, ordered depth-first
 */
function flattenProp(root, propKey, childKey) {
	const items = [];
	if (root[propKey]) items.push(...arrayify(root[propKey]));

	root[childKey]?.forEach(branch => {
		items.push(...flattenProp(branch, propKey, childKey));
	});
	return items;
}


/**
 * Generates a short display name for a URL.
 * Returns either:
 * - the "filename" part of the URL (eg https://www.domain.tld/dir/filename.ext --> "filename.ext")
 * - the last "directory" part  (eg https://www.domain.tld/dir/subdir/ --> "subdir/"
 * - "/" for domain root
 * - "[Strange URL]" if none of the above can be found
 */
export function shortenName(transfer) {
	let matches = null;
	try {
		matches = new URL(transfer.url).pathname.match(/\/([^/]*\/?)$/);
	} catch (e) { /* Malformed URL - oh well. */ }
	if (matches) return matches[1] || matches[0]; // if path is "/", match will succeed but group 1 will be empty
	return '[Strange URL]';
};


/** Very quick and dirty CORS-stripping proxy using FileProxyServlet */
export function proxy(url) {
	const proxied = new URL(PROXY_ENDPOINT);
	proxied.searchParams.append('url', url);
	return proxied.toString();
}


/** Regexes matching MIME types and filenames for some more and less specific classes of file */
const typeSpecs = {
	font: { mime: /^(application\/)?font/, filename: /\.(ttf|otf|woff2?)$/i }, // normally "font/xxxx" but "application/font-xxxx" also sighted
	image: { mime: /^image/, filename: /\.(jpe?g|gif|png|tiff?|bmp)$/i },
	audio: { mime: /^audio/, filename: /\.(wav|aiff|mp3|ogg|m4a|aac|flac|alac)$/i },
	video: { mime: /^video/, filename: /\.(m4v|mp4|mpeg4|mpe?g|mov|webm|avi)$/i },
	script: { mime: /javascript$/, filename: /\.js$/i }, // text/javascript and application/javascript both seen in the wild
	stylesheet: { mime: /css$/, filename: /\.css$/i },
	html: { mime: /^text\/html$/, filename: /\.html?$/i },
	svg: { mime: /^image\/svg$/, filename: /\.svg$/i },
	avif: { mime: /^image\/avif$/, filename: /\.avif$/i },
	webp: { mime: /^image\/webp$/, filename: /\.webp$/i },
	gif: { mime: /^image\/gif$/, filename: /\.gif$/i }, // specifically suggest replacing GIF with video / multiframe WEBP
	woff: { mime: /woff2?$/, filename: /\.woff2?$/i }, // Includes WOFF and WOFF2
	woff2: { mime: /woff2$/, filename: /\.woff2$/i }, // WOFF2-only
	audioLossless: { mime: /^audio/, filename: /\.(flac|alac)$/i }, // Warn about unnecessary use of lossless audio
};


/** Quick check for whether a given transfer's MIME type or extension matches a file class */
function isType(transfer, type) {
	const spec = typeSpecs[type];
	return transfer.mimeType?.match(spec.mime) || transfer.path?.match(spec.filename);
}


/** Find potential issues with an individual file. Expects fonts to have been augmented with usage data. */
function recommendationsForTransfer(transfer) {
	const recs = [];
	if (transfer.resBody === 0) return recs; // Duplicate transfer - 0 bytes because it's a cache hit.

	let rec = { url: transfer.url, bytes: (transfer.resBody + transfer.resHeaders), shortName: shortenName(transfer) };

	if (isType(transfer, 'font')) {
		// Try subsetting, try recompressing
		recs.push({...rec, type: 'font', characters: transfer.characters, woff2: isType(transfer, 'woff2')});
	}

	if (isType(transfer, 'image') && transfer.resBody > 5000) { // Ignore tiny images like tracking pixels and interface buttons
		// TODO Server-side comparison of image rendered vs inherent size
		if (isType(transfer, 'svg')) { // Magic number for "this is a large SVG"...
			// TODO additional heuristic based on fraction of overall transfer size to flag smaller graphics on ads?
			if (transfer.resBody > 200000) { // don't merge this with the is-svg condition
				recs.push({...rec, type: 'svg'}); // Recommender can try SVGO and TODO rendering to raster
			}
		} else if (isType(transfer, 'gif')) {
			recs.push({...rec, type: 'gif'}); // Recommender can try converting to video or non-gif image
		} else if (!isType(transfer, 'webp')) {
			recs.push({...rec, type: 'image' }); // Can convert to .webp or just try jpeg/png optimisation
		}
	}

	if (isType(transfer, 'script')) {
		if (transfer.resBody > 100000) {
			recs.push({ ...rec, type: 'script', });
		}
	}

	return recs;
}


/**
 * For a transfer of a font file:
 * - Find any font specs recorded in the page manifest which use the same URL
 * - Mark transfer with t.fontFamily = ['font-name-1', 'font-name-2', ...]
 * - Mark transfer with t.characters = '!,123ABCabc'
 */
function augmentFont(transfer, fonts) {
	// What font-families use this file, and what characters are rendered in that font?
	fonts.filter(f => f.urls?.includes(transfer.url)).forEach(font => {
		if (!transfer.fontFamily) transfer.fontFamily = {};
		transfer.fontFamily[font.family] = true; 
		if (!transfer.characters) transfer.characters = '';
		transfer.characters += font.characters;
	});
	// {'font-name-1': true, 'font-name-2': true} --> ['font-name-1', 'font-name-2']
	if (transfer.fontFamily) transfer.fontFamily = Object.keys(transfer.fontFamily);
	// deduplicate merged character sets
	if (transfer.characters) {
		const charset = new Set(transfer.characters);
		transfer.characters = Array.from(charset).sort().join('');
	}
}


/**
 * For a transfer of an image or video file:
 * - Find any elements in the page manifest with the same source URL
 * - Mark transfer with largest onscreen size it's displayed at
 */
function augmentMedia(transfer, mediaElements) {
	if (isType(transfer, 'image') || isType(transfer, 'video')) {
		mediaElements.filter(e => (e.src === transfer.url)).forEach(el => {
			const elementArea = el.clientWidth * el.clientHeight;
			const transferArea = (transfer.width || 0) * (transfer.height || 0);
			if (elementArea <= transferArea) return;
			transfer.width = element.clientWidth;
			transfer.height = element.clientHeight;
		});
	}
}


/** Pair up font and media transfers with information on how they're used in the analysed page */
function augmentTransfers(transfers, fonts, mediaElements) {
	transfers.forEach(t => {
		if (isType(t, 'image') || isType(t, 'video')) {
			augmentMedia(t, mediaElements)
		} else if (isType(t, 'font')) {
			augmentFont(t, fonts);
		}
	});
}


/** Helper for classifying transfers when constructing the type breakdown */
const testTransfer = (transfer, manifest, type, ownFrame) => {
	// Does the transfer belong to a sub-frame when we only want directly owned transfers or vice versa?
	if (ownFrame !== (manifest.transfers.indexOf(transfer) >= 0)) return false;
	// Is the transfer the wrong type?
	if (type && !isType(transfer, type)) return false;
	return true;
};


/** Classes of data for the type breakdown */
const breakdownTypes = [
	{ title: 'HTML', typeSpec: 'html', ownFrame: true, color: '#003f5c' },
	{ title: 'Images', typeSpec: 'image', ownFrame: true, color: '#374c80' },
	{ title: 'Video', typeSpec: 'video', ownFrame: true, color: '#7a5195' },
	{ title: 'Audio', typeSpec: 'audio', ownFrame: true, color: '#bc5090' },
	{ title: 'Javascript', typeSpec: 'script', ownFrame: true, color: '#ef5675' },
	{ title: 'Fonts', typeSpec: 'font', ownFrame: true, color: '#ff764a' },
	{ title: 'Stylesheets', typeSpec: 'stylesheet', ownFrame: true, color: '#ffa600' },
	// { title: 'Other Types' }, // Inserted dynamically in typeBreakdown
	{ title: 'Sub-frame content', typeSpec: null, ownFrame: false, color: '#ff00ff' }
];


/** What types of transfers make up the page's data usage? */
export function typeBreakdown(manifest) {
	const pageBytes = manifest.resHeaders + manifest.resBody;
	const fTransfers = flattenProp(manifest, 'transfers', 'frames');
	let bytesAccountedFor = 0;

	const breakdown = breakdownTypes.map(({title, typeSpec, ownFrame, color}) => {
		const typeTransfers = fTransfers.filter(t => testTransfer(t, manifest, typeSpec, ownFrame));
		const bytes = typeTransfers.reduce((acc, t) => acc + t.resHeaders + t.resBody, 0);
		bytesAccountedFor += bytes;
		return { title, bytes, fraction: (bytes / pageBytes), color };
	});

	// Any data that didn't match any of the filters in breakdownTypes? Insert it before "Sub-frame content".
	const otherBytes = pageBytes - bytesAccountedFor;
	const otherEntry = { title: 'Other Types', bytes: otherBytes, fraction: otherBytes / pageBytes, color: '#00ffff' };
	breakdown.splice(breakdown.findIndex(a => a.title.match(/frame/)), 0, otherEntry);
	
	return breakdown.filter(a => !!a.bytes);
}


/** Make some simple recommendations about the analysed page */
export function makeRecommendations(manifest) {
	const recs = [];

	// TODO Should recs for sub-pages be folded away?
	const allTransfers = flattenProp(manifest, 'transfers', 'frames');

	const allFonts = flattenProp(manifest, 'fonts', 'frames');
	const allMediaElements = flattenProp(manifest, 'elements', 'frames');

	augmentTransfers(allTransfers, allFonts, allMediaElements);

	allTransfers.forEach(transfer => {
		recs.push(...recommendationsForTransfer(transfer));
	});

	return recs;
}
