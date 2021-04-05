import React, {useEffect, useState, useCallback } from 'react';
import ServerIO from '../plumbing/ServerIOBase';


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

/**
 * Puts together the unit.json request
 */
const insertUnit = ({frame, unitJson, vertId, status, size, play, endCard, noab, debug, extraParams}) => {
	if (!frame) return;
	const doc = frame.contentDocument;
	const docBody = doc && doc.body;

	console.log('insertUnit doc = ', doc);


	// No scroll bars!
	if (docBody) docBody.style = 'overflow: hidden;'; // NB: the if is paranoia - NPE hunt Oct 2019

	// Insert preloaded unit.json, if we have it
	// ??is unitJson json or html?
	if (unitJson) {
		appendEl(doc, {tag: 'div', id: 'preloaded-unit-json', innerHTML: unitJson});
	}

	// Insert the element the unit goes in at the top of the document
	// Keep it simple: Tell the unit it's already isolated in an iframe and doesn't need to create another.
	appendEl(doc, {tag: 'div', className:'goodloopad-frameless'}, true);
	
	// Insert unit.js
	let params = []
	if (status) params.push(`gl.status=${status}`); // show published version unless otherwise specified
	if (size) params.push(`gl.size=${size}`); // If size isn't specified, the unit will pick a player-type to fit the container
	if (vertId) params.push(`gl.vert=${vertId}`); // If adID isn't specified, we'll get a random ad.
	if (play) params.push(`gl.play=${play}`)
	if (endCard) params.push(`gl.variant=tq`);
	if (noab) params.push('gl.noab=true');
	if (debug) params.push(`gl.debug=true`);
	if (extraParams) {
		Object.entries(extraParams).forEach(([k, v]) => params.push(`${k}=${v}`))
	}
	const filename = debug ? 'unit-debug.js' : 'unit.js';
	const src = `${ServerIO.AS_ENDPOINT}/${filename}${params.length ? '?' + params.join('&') : ''}`;
	appendEl(doc, {tag: 'script', src, async: true});

	// On unmount: empty out iframe's document
	return () => {
		doc ? doc.documentElement.innerHTML = '' : null;
	};
};

/**
 * TODO doc
 * ??How does this interact with the server vs on-client datastore??
 * @param {String} vertId ID of advert to show. Will allow server to pick if omitted.
 * @param {String} css Extra CSS to insert in the unit's iframe - used by portal to show custom styling changes without reload. Optional.
 * @param {String} size Defaults to "landscape".
 * @param {String} status Defaults to PUBLISHED if omitted.
 * @param {String} unitJson Optional: String with contents of a unit.json serve. 
 * 	Allows a previously loaded ad to be redisplayed elsewhere without hitting the server.
 * @param {String} play Condition for play to start. Defaults to "onvisible", "onclick" used in portal preview
 * @param {String} endCard Set truthy to display end-card without running through advert.
 * @param {?Boolean} noab Set true to block any A/B experiments
 * @param {Object} extraParams A map of extra URL parameters to put on the unit.js URL.
 */
const GoodLoopUnit = ({vertId, css, size = 'landscape', status, unitJson, play = 'onvisible', endCard, noab, debug: shouldDebug, extraParams}) => {
	// Store refs to the .goodLoopContainer and iframe nodes, to calculate sizing & insert elements
	const [frame, setFrame] = useState();
	const [container, setContainer] = useState();
	const [dummy, redraw] = useState(); // Just use this to provoke a redraw

	const [frameReady, setFrameReady] = useState(false);

	// Should we use unit.js or unit-debug.js?
	// Priority given to: gl.debug URL param, then explicit debug prop on this component, then server type.
	let debug = shouldDebug || !C.isProduction();
	// Allow overriding by URL param
	const debugParam = DataStore.getUrlValue('gl.debug');
	if (debug && debugParam === false) debug = false;
	if (!debug && debugParam === true) debug = true;

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
		if (frameReady) {
			const cleanup = insertUnit({frame, unitJson, vertId, status, size, play, endCard, noab, debug, extraParams});
			insertAdunitCss({frame, css});
			return cleanup;
		}
	}, [frameReady, unitKey]);

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
