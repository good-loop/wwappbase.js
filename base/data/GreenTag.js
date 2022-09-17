/*
NB Why don't we use url.searchParams.set(k, v) to add params when generating tag exports?
A: Because whenever you invoke searchParams.set(), it parses all params and makes sure they're URL-encoded
...which ruins any attempt you've made up to that point to preserve macro delimiters like ${MACRO} and %%MACRO%%.
We use it ONCE when applying the dataspace param, to cleanly make sure the URL has its ? - and then append raw text subsequently.
*/
import DataClass from './DataClass';
import Enum from 'easy-enums';
import { encURI } from '../utils/miscutils';

const KGreenTagType = new Enum('PIXEL JAVASCRIPT REDIRECT WRAPPER');
const KMacroType = new Enum('NONE DV360 GOOGLE TTD XANDR');

/** Used by Green Ad Tag generator */
const REDIRECT_BASE = `${C.HTTPS}://${C.SERVER_TYPE}lg.good-loop.com/lg?t=redirect`;
const PIXEL_BASE = `${C.HTTPS}://${C.SERVER_TYPE}lg.good-loop.com/pxl.png?t=pixel`;
const WRAPPER_BASE = `${C.HTTPS}://${C.SERVER_TYPE}as.good-loop.com/greenvast.xml`;

/* When URL-encoding URLs - eg for redirect tags - use these regexes to separate and preserve macros in the target URL, so the user's DSP can process them. */
const macroRegexes = {
	[KMacroType.DV360]: /(\$\{\w+\})/g, // eg ${CREATIVE_ID}
	[KMacroType.GOOGLE]: /(%%\w+%%)/g, // eg %%SITE%%
	[KMacroType.TTD]: /(%%\w+%%)/g, // eg %%TTD_CREATIVE_ID%%
	[KMacroType.XANDR]: /(\$\{\w+\})/g, // eg ${CREATIVE_ID}
};

// Split out macros and preserve delimiters before URL-component-encoding the rest
const encodePreserveMacros = (targetUrl, macroType) => {
	const macroRegex = macroRegexes[macroType];
	if (!macroRegex) return encodeURIComponent(targetUrl);

	return targetUrl.split(macroRegex).reduce((acc, bit) => {
		if (bit.match(macroRegex)) return acc + bit;
		return acc + encodeURIComponent(bit);
	}, '');
};

// search vs searchParams: see comment at top
const macroAdders = {
	[KMacroType.DV360]: (url) => {
		// creative ID, site url
		url.search += '&vert=${CREATIVE_ID}&url=${SOURCE_URL_ENC}';
	},
	[KMacroType.GOOGLE]: (url) => {
		// width, height, site ID, site url
		url.search += '&width=%%WIDTH%%&height=%%HEIGHT%%&pub=%%SITE%%&url=%%REFERRER_URL_ESC%%';
	},
	[KMacroType.TTD]: (url) => {
		// creative ID, size string, device type, site ID
		url.search += '&vert=%%TTD_CREATIVEID%%&size=%%TTD_ADFORMAT%%&env=%%TTD_DEVICETYPE%%&pub=%%TTD_SITE%%';
	},
	[KMacroType.XANDR]: (url) => {
		// creative ID, size string, width, height, site ID, site URL
		url.search += '&vert=${CREATIVE_ID}&size=${CREATIVE_SIZE}&width=${WIDTH}&height=${HEIGHT}&pub=${SITE_ID}&url=${REFERER_URL_ENC}';
	},
};

/**
 * 
 * @param {!URL} url modifies this
 * @param {!GreenTag} tag 
 * @returns null
 */
const setBaseParams = (url, tag) => {
	url.searchParams.set('d', 'green'); // "green ad tag" dataspace

	if (tag.macroType && macroAdders[tag.macroType]) {
		macroAdders[tag.macroType](url);
	}
	// search vs searchParams: see comment at top
	if (tag.campaign) url.search += `&campaign=${encURI(tag.campaign)}`;
	if (tag.id) url.search += `&adid=${tag.id}`;
	if (tag.vertiser) url.search += `&vertiser=${encURI(tag.vertiser)}`;
	if (tag.agencyId) url.search += `&via=${encURI(tag.agencyId)}`;
};


/**
 * string -> function: tag -> string
 */
const generators = {
	PIXEL: (tag) => {
		const url = new URL(PIXEL_BASE);
		setBaseParams(url, tag);
		return `<img src="${url.toString()}" style="position:absolute;">`;
	},
	JAVASCRIPT: (tag) => {
		const url = new URL(PIXEL_BASE);
		setBaseParams(url, tag);
		return `<script type="text/javascript">var x=new XMLHttpRequest();x.open('GET', '${url.toString()}');x.send()</script>`;
	},
	REDIRECT: (tag) => {
		const url = new URL(REDIRECT_BASE);
		setBaseParams(url, tag);
		// search vs searchParams: see comment at top
		url.search += `&link=${encodePreserveMacros(tag.wrapped, tag.macroType)}`; // add destination URL
		return url.toString();
	},
	WRAPPER: (tag) => {
		const url = new URL(WRAPPER_BASE);
		setBaseParams(url, tag);
		return url.toString();
	}
};


/**
 */
class GreenTag extends DataClass {
	constructor(base) {
		super();
		DataClass._init(this, base);

		if (!this.tagType) this.tagType = KGreenTagType.PIXEL;
		if (!this.macroType) this.macroType = KMacroType.NONE;
	}

	/** User-recognisable name */
	name;
	/** Campaign to group impressions for multiple tags */
	campaign;
	/** Whose adverts are we measuring? */
	vertiser;
	/** Which organisation is managing these tags? */
	agencyId;
	/** Tag type, e.g. pixel, redirect, VAST wrapper */
	tagType;
	/** Macro type for target DSP, e.g. google, xandr */
	macroType;
	/** (For WRAPPER and REDIRECT tagType) The user's original tag which this wraps/redirects */
	wrapped;
	/** URL to the tagged advert's VAST tag or uploaded creative zip */
	creativeURL;
	/** The generated tag URL */
	tag;
	/** The size (in bytes) of the creative this tag represents */
	weight;
    /** For holding notes info. TODO: maybe move somewhere else? */
    notes;
}

GreenTag.generate = (tag) => {
	const generator = generators[tag.tagType] || generators.PIXEL;
	return generator(tag);
}

DataClass.register(GreenTag, "GreenTag");
const This = GreenTag;
export default GreenTag;

export { KGreenTagType, KMacroType };
