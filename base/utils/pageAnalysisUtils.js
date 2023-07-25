import ServerIO from "../plumbing/ServerIOBase";

const MEASURE_ENDPOINT_BASE = ServerIO.MEASURE_ENDPOINT.replace(/\/measure$/, '');
export const PROXY_ENDPOINT = `${MEASURE_ENDPOINT_BASE}/proxy`;
export const RECOMPRESS_ENDPOINT = `${MEASURE_ENDPOINT_BASE}/recompress`;
export const EMBED_ENDPOINT = `${MEASURE_ENDPOINT_BASE}/embed`;


export function storedManifestForTag(tag) {
	return `${MEASURE_ENDPOINT_BASE}/persist/greentag_${tag.id}/results.json`;
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
export function flattenProp(root, propKey, childKey) {
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
	script: { mime: /javascript$/, filename: /\.js$/i }, // text/javascript and application/(x-)javascript both seen in the wild
	stylesheet: { mime: /css$/, filename: /\.css$/i },
	html: { mime: /^text\/html$/, filename: /\.html?$/i },
	svg: { mime: /^image\/svg$/, filename: /\.svg$/i },
	avif: { mime: /^image\/avif$/, filename: /\.avif$/i },
	webp: { mime: /^image\/webp$/, filename: /\.webp$/i },
	gif: { mime: /^image\/gif$/, filename: /\.gif$/i }, // specifically suggest replacing GIF with video / multiframe WEBP
	woff: { mime: /woff2?$/, filename: /\.woff2?$/i }, // Includes WOFF and WOFF2
	woff2: { mime: /woff2$/, filename: /\.woff2$/i }, // WOFF2-only
	audioLossless: { mime: /^audio/, filename: /\.(wav|flac|alac)$/i }, // Warn about unnecessary use of lossless audio
};


/** Quick check for whether a given transfer's MIME type or extension matches a file class */
export function isType(transfer, type) {
	const spec = typeSpecs[type];
	return transfer.mimeType?.match(spec.mime) || transfer.path?.match(spec.filename);
}


/** Find potential issues with an individual file. */
function recommendationsForTransfer(transfer) {
	const recs = [];
	if (transfer.resBody === 0) return recs; // Duplicate transfer - 0 bytes because it's a cache hit.

	const rec = { url: transfer.url, bytes: transfer.resBody, name: shortenName(transfer), transfer };

	if (isType(transfer, 'font')) {
		// Try subsetting, try recompressing.
		recs.push({...rec, type: 'font', woff2: isType(transfer, 'woff2')});
	}

	if (isType(transfer, 'image') && transfer.resBody > 5000) { // Ignore tiny images like tracking pixels and interface buttons
		// TODO Server-side comparison of image rendered vs inherent size
		if (isType(transfer, 'svg')) { // Magic number for "this is a large SVG"...
			// TODO additional heuristic based on fraction of overall transfer size to flag smaller graphics on ads?
			if (transfer.resBody > 100000) { // don't merge this with the is-svg condition - will break fallthrough
				recs.push({...rec, type: 'svg'}); // Recommender can try SVGO and TODO rendering to raster
			}
		} else if (isType(transfer, 'gif')) {
			recs.push({...rec, type: 'gif'}); // Try converting to animated .webp
		} else if (!isType(transfer, 'webp')) {
			recs.push({...rec, type: 'image' }); // Fallback for all images: convert to .webp or just try jpeg/png optimisation
		}
	}

	if (isType(transfer, 'script')) {
		if (transfer.resBody > 20000) {
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
	// Pile up all font-family names in one array & concatenate all character lists
	fonts.filter(f => f.urls?.includes(transfer.url)).forEach(font => {
		if (!transfer.fontFamily) transfer.fontFamily = [];
		transfer.fontFamily.push(font.family);
		if (!transfer.characters) transfer.characters = '';
		transfer.characters += font.characters;
	});	// De-duplicate and sort font list
	if (transfer.fontFamily) {
		const fontSet = new Set(transfer.fontFamily);
		transfer.fontFamily = Array.from(fontSet).sort();
	}
	// Remove duplicates and sort merged character set
	if (transfer.characters) {
		const charSet = new Set(transfer.characters);
		transfer.characters = Array.from(charSet).sort().join('');
	}
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


/** Helper for classifying transfers when constructing the type breakdown */
const testTransfer = (transfer, manifest, type, ownFrame) => {
	// Does the transfer belong to a sub-frame when we only want directly owned transfers?
	if (ownFrame && manifest.transfers.indexOf(transfer) < 0) return false;
	// Is the transfer the wrong type?
	if (type && !isType(transfer, type)) return false;
	return true;
};


/** Classes of data for the type breakdown */
const lineSpecs = [
	{ title: 'HTML', typeSpec: 'html', color: '#003f5c' },
	{ title: 'Images', typeSpec: 'image', color: '#374c80' },
	{ title: 'Video', typeSpec: 'video', color: '#7a5195' },
	{ title: 'Audio', typeSpec: 'audio', color: '#bc5090' },
	{ title: 'Javascript', typeSpec: 'script', color: '#ef5675' },
	{ title: 'Fonts', typeSpec: 'font', color: '#ff764a' },
	{ title: 'Stylesheets', typeSpec: 'stylesheet', color: '#ffa600' },
	// { title: 'Other Types' }, // Inserted dynamically in typeBreakdown
];

const subFrameLine = { title: 'Sub-frame content', typeSpec: null, color: '#ff00ff' };


/**
 * What types of transfers make up the page's data usage?
 * @param {object} manifest Page manifest to analyse
 * @param {boolean} flatten Show transfers belonging to sub-frames in the breakdown
 */
export function typeBreakdown(manifest, separateSubframes) {
	const pageBytes = manifest.resHeaders + manifest.resBody;
	const allTransfers = flattenProp(manifest, 'transfers', 'frames');
	let bytesAccountedFor = 0;

	const lines = lineSpecs.map(({title, typeSpec, color}) => {
		const transfersForType = allTransfers.filter(t => testTransfer(t, manifest, typeSpec, separateSubframes));
		const bytes = transfersForType.reduce((acc, t) => acc + t.resHeaders + t.resBody, 0);
		bytesAccountedFor += bytes;
		return { title, bytes, fraction: (bytes / pageBytes), color };
	});

	const extraLines = [];
	// Generate "transfers in sub-frames" line
	if (separateSubframes) {
		const subFrameTransfers = allTransfers.filter(t => manifest.transfers.indexOf(t) < 0);
		const subFrameBytes = subFrameTransfers.reduce((acc, t) => acc + t.resHeaders + t.resBody, 0);
		bytesAccountedFor += subFrameBytes;
		extraLines.push({ title: 'Sub-frame content', bytes: subFrameBytes, color: '#ff00ff' });
	}
	// Any data that didn't match any of the filters in breakdownTypes?
	const otherBytes = Math.max(pageBytes - bytesAccountedFor, 0);
	const otherEntry = { title: 'Other Types', bytes: otherBytes, color: '#00ffff' };
	extraLines.unshift(otherEntry); // "other" goes before "sub-frames" if present

	// Concatenate, remove zeroes, and add "fraction of whole page" number
	return [...lines, ...extraLines]
		.filter(a => !!a.bytes)
		.map(line => ({ ...line, fraction: line.bytes / pageBytes }));
}


/** Make some simple recommendations about the analysed page */
export function makeRecommendations(manifest) {
	const recs = [];

	// TODO Should recs for sub-pages be folded away?
	const allTransfers = flattenProp(manifest, 'transfers', 'frames');
	const allFonts = flattenProp(manifest, 'fonts', 'frames');
	const allMediaElements = flattenProp(manifest, 'elements', 'frames');
	
	/** Pair up font and media transfers with information on how they're used in the analysed page */
	transfers.forEach(t => {
		if (isType(t, 'image') || isType(t, 'video')) {
			augmentMedia(t, allMediaElements)
		} else if (isType(t, 'font')) {
			augmentFont(t, allFonts);
		}
	});

	allTransfers.forEach(transfer => {
		recs.push(...recommendationsForTransfer(transfer));
	});

	// Sort images & fonts to the top & largest first
	recs.sort((a, b) => {
		if (a.type !== b.type) {
			if (a.type === 'image') return -1;
			if (b.type === 'image') return 1;
			if (a.type === 'font') return -1;
			if (b.type === 'font') return 1
			if (a.type === 'script') return -1;
			if (b.type === 'script') return 1;
		}
		return b.bytes - a.bytes;
	});

	return recs;
}
