import React, {useEffect, useState, useCallback } from 'react';
import ServerIO from '../plumbing/ServerIOBase';
import Misc from './Misc';


/**
 * @param {HTMLDocument} doc The document to put the new element in
 * @param {String} tag The <tag> to create
 * @param {?} attrs Other attributes to apply to the element we create
 * @param {Boolean} prepend True to insert the new element at the start of the document
 */
const appendEl = (doc, {tag, ...attrs}, prepend) => {
	if (!doc || !doc.createElement || !tag) return; // Can't make an element without a doc and a tag

	// Create the element and assign all properties
	const el = doc.createElement(tag);
	Object.entries(attrs).forEach(([key, val]) => {
		el[key] = val;
	});

	prepend ? doc.body.prepend(el) : doc.body.appendChild(el);
	return el; // just in case we want it
}


/**
	* Insert custom CSS into the adunit's iframe
	* Why do this when the adunit already manages its own CSS?
	* Because it's MUCH faster and more reliable than reloading the ad when iterating design in the portal.
	*/
const insertAdunitCss = ({frame, css}) => {
	if (!frame) return; // don't worry if frame doesn't have a doc, appendEl is safe for that
	// Remove any pre-existing vert-css
	removeAdunitCss({frame});
	if (!css) return; // No CSS supplied? Remove any that exists and we're done

	// Note from Mark 18 Feb 2019: We insert CSS into body instead of head to guarantee it appears later in the
	// document than the #vert-css tag inserted by the adunit - so it takes precedence & overrides as expected.
	appendEl(frame.contentDocument, {tag: 'style', type: 'text/css', id: 'vert-css', class: 'override', innerHTML: css});
};


/** Remove custom CSS from the adunit's frame */
const removeAdunitCss = ({frame, selector = '#vert-css'}) => {
	// this might be called after the iframe has already been destroyed!
	if (!frame || !frame.contentDocument || !frame.contentDocument.body) return;
	const cssEls = frame.contentDocument.querySelectorAll(selector) || [];
	cssEls.forEach(node => node.parentElement.removeChild(node));
}

// TODO copy-pasted from demo/test site - move to shared location?
/** Get the URL for an ad file (eg unit.js, unit.json, vast.xml) with appropriate server type and parameters */
export const getAdUrl = ({file = 'unit.js', unitBranch, params}) => {
	const isUnitJs = (file === 'unit.js');

	// Special overrides for unit.js
	if (isUnitJs) {
		// Override to unit(-debug).js
		if (params['gl.debug'] !== 'false' && isUnitJs) {
			file = 'unit-debug.js';
		}
		// Use custom/legacy unit branch
		if (unitBranch) {
			file = `legacy-units/${unitBranch}/${file}`;
		}
	}

	const url = new URL(`${ServerIO.AS_ENDPOINT}/${file}`);

	// append all gl.* parameters
	if (params) {
		Object.entries(params).forEach(([name, value]) => {
			if (name.match(/^gl\./) && value) url.searchParams.set(name, value);
		});
	}
	return url.toString();
};


/**
 * Turn the props passed to <GoodLoopUnit> into the gl.* URL params used when requesting adunits */
const normaliseParams = ({ endCard, ...params }) => {
	let normParams = {};

	if (endCard) params['gl.variant'] = 'tq';

	Object.entries(params).forEach(([key, val]) => {
		if (val === undefined) return;
		const normKey = key.match(/^gl\.\w+/) ? key : `gl.${key}`;
		normParams[normKey] = val;
	});

	return normParams;
}

/**
 * Puts together the unit.json request
 * TODO To seamlessly load legacy units without loading advert twice:
 * Load unit.json with given params, check for legacy unit param, and put contents in a div with ID #preloaded-unit-json.
 * Insert unit.js raw.
 * BehaviourLoadUnit in the adunit will find that div and extract the JSON from it.
 */
const insertUnit = ({frame, unitJson, unitBranch, glParams}) => {
	if (!frame) return;
	const doc = frame.contentDocument;
	const docBody = doc && doc.body;

	// No scroll bars!
	if (docBody) docBody.style = 'overflow: hidden;'; // NB: the if is paranoia - NPE hunt Oct 2019

	// Preloaded unit.json? Insert contents inside a <script> tag for the adunit to find
	if (unitJson) {
		appendEl(doc, {tag: 'script', type: 'application/json', id: 'preloaded-unit-json', innerHTML: unitJson});
	}

	// Insert the element the unit goes in at the top of the document
	// Keep it simple: Tell the unit it's already isolated in an iframe and doesn't need to create another.
	appendEl(doc, {tag: 'div', className: 'goodloopad-frameless'}, true);

	// Generate the unit.js URL and insert the <script> tag
	const src = getAdUrl({ file: 'unit.js', unitBranch, params: glParams });
	appendEl(doc, {tag: 'script', src, async: true});

	// On unmount: empty out iframe's document
	return () => doc ? doc.documentElement.innerHTML = '' : null;
};

/**
 * TODO doc
 * ??How does this interact with the server vs on-client datastore??
 * @param {Object} p
 * @param {String} p.vertId ID of advert to show. Will allow server to pick if omitted.
 * @param {String} p.css Extra CSS to insert in the unit's iframe - used by portal to show custom styling changes without reload. Optional.
 * @param {String} p.size Defaults to "landscape".
 * @param {?KStatus} p.status Defaults to PUBLISHED if omitted.
 * @param {?Advert} p.advert Used for legacyUnitBranch
 * @param {String} p.play Condition for play to start. Defaults to "onvisible", "onclick" used in portal preview
 * @param {String} p.endCard Set truthy to display end-card without running through advert.
 * @param {?Boolean} p.noab Set true to block any A/B experiments
 * @param {Object} p.extraParams A map of extra URL parameters to put on the unit.js URL.
 */
const GoodLoopUnit = ({vertId, css, size = 'landscape', status, play = 'onvisible', endCard, noab, debug: shouldDebug, extraParams}) => {
	// Should we use unit.js or unit-debug.js?
	// Priority given to: gl.debug URL param, then explicit debug prop on this component, then server type.
	let debug = shouldDebug || !C.isProduction();
	// Allow overriding by URL param
	const debugParam = DataStore.getUrlValue('gl.debug');
	if (debug && debugParam === false) debug = false;
	if (!debug && debugParam === true) debug = true;

	// Generate gl.* URL parameter list - add gl.delivery=direct as shim for "adunit overwrites variant.delivery" issue
	const glParams = normaliseParams({vert: vertId, status, size, play, endCard, noab, debug, delivery: 'direct', ...extraParams});

	// Load the ad
	const [unitJson, setUnitJson] = useState(null); // Preloaded unit.json
	const [unitBranch, setUnitBranch] = useState(false); // vert.legacyUnitBranch from the above

	// Fetch the advert from *as.good-loop.com so we can check if it has a legacy branch
	useEffect(() => {
		fetch(getAdUrl({file: 'unit.json', params: glParams}))
		.then(res => res.json())
		.then(unitObj => {
			setUnitBranch(unitObj.vert.legacyUnitBranch || '');
			setUnitJson(JSON.stringify(unitObj));
		});
	}, [vertId]);

	// Store refs to the .goodLoopContainer and iframe nodes, to calculate sizing & insert elements
	const [frame, setFrame] = useState();
	const [container, setContainer] = useState();
	const [dummy, redraw] = useState(); // Just use this to provoke a redraw
	const [frameReady, setFrameReady] = useState(false);

	const receiveFrame = useCallback(node => {
		setFrame(node);

		// The cases below account for subtle DOM element lifecycle differences between Firefox and Chrome.

		if (!node) {
			setFrameReady(false); // Needs to flip false during element replacement so it triggers the useEffect below
		} else if (node.contentDocument && node.contentDocument.readyState === 'complete') {
			// If the iframe's DOM is ready to use when this ref executes, mark it as such.
			// Do asynchronously so setFrameReady(false) above gets to trigger a render first
			window.setTimeout(() => setFrameReady(true), 0);
		} else {
			// If it's not ready, add an event listener to mark it when it is.
			// NB: Jan 2021: bugs seen where setFrameReady(true) is never called.
			// 'DOMContentLoaded' seems to fire too early (see https://developer.mozilla.org/en-US/docs/Web/API/Window/DOMContentLoaded_event)
			// So trying 'load' instead... It seems to work. (Jan 2021)
			node.contentWindow.addEventListener('load', () => setFrameReady(true));
		}
	}, []);
	const receiveContainer = useCallback(node => setContainer(node), []);

	// This string is meaningless in itself, but when it changes we need to recreate the iframe & reinsert JS.
	// It's used as a key on the iframe to break identity so it's replaced instead of updated.
	const unitKey = vertId + size + status + play + endCard;

	// Load/Reload the adunit when vert-ID, unit size, skip-to-end-card, or iframe container changes
	useEffect(() => {
		if (frameReady && unitJson && unitBranch !== false) {
			const cleanup = insertUnit({frame, unitJson, unitBranch, glParams});
			insertAdunitCss({frame, css});
			return cleanup;
		}
	}, [frameReady, unitKey, unitJson, unitBranch]);

	// Redo CSS when CSS or adunit frame changes
	useEffect(() => {
		insertAdunitCss({frame, css});
	}, [frame, css]);

	// Set up listeners to redraw this component on window resize or rotate
	useEffect(() => {
		window.addEventListener('resize', redraw);
		window.addEventListener('orientationchange', redraw);

		return () => {
			window.removeEventListener('resize', redraw);
			window.removeEventListener('orientationchange', redraw);
		};
	}, []);

	// Calculate dimensions every render because it's cheap and KISS
	const dims = {};
	if (container) {
		const { width, height } = container.getBoundingClientRect();
		// 16:9 --> 100% width, proportional height; 9:16 --> 100% height, proportional width
		if (size === 'landscape') dims.height = `${width * 0.5625}px`; // 0.5625 = 9/16
		else if (size === 'portrait') dims.width = `${height * 0.5625}px`;
	}

	return (
		<div className="goodLoopContainer" style={dims} ref={receiveContainer}>
			<iframe key={unitKey} frameBorder={0} scrolling="auto" style={{width: '100%', height: '100%'}} ref={receiveFrame} />
		</div>
	);
};

export default GoodLoopUnit;
