import React, {useEffect, useState, useCallback } from 'react';
import ServerIO from '../plumbing/ServerIOBase';


const appendEl = (doc, {tag, ...attrs}) => {
	if (!doc || !doc.createElement || !tag) return;
	const el = doc.createElement(tag);
	Object.entries(attrs).forEach(([key, val]) => {
		el[key] = val;
	});
	doc.body.appendChild(el);
	return el; // just in case we want it
}


/**
	* Insert custom CSS into the adunit's iframe
	* Why do this when the adunit already manages its own CSS?
	* Because it's MUCH faster and more reliable than reloading the ad when iterating design in the portal.
	*/
const insertAdunitCss = ({frame, css}) => {
	if (!css || !frame) return; // don't worry if frame doesn't have a doc, appendEl is safe for that
	// Remove any pre-existing vert-css
	removeAdunitCss({frame});

	// Note from Mark 18 Feb 2019: We insert CSS into body instead of head to guarantee it appears later in the
	// document than the #vert-css tag inserted by the adunit - so it takes precedence & overrides as expected.
	appendEl(frame.contentDocument, {tag: 'style', type: 'text/css', id: 'vert-css', class: 'override', innerHTML: css});

	// On unmount: remove the CSS override we inserted but not the original if somehow present
	return () => {
		removeAdunitCss({frame, selector: '#vert-css.override'})
	};
};


/** Remove custom CSS from the adunit's frame */
const removeAdunitCss = ({frame, selector = '#vert-css'}) => {
	// this might be called after the iframe has already been destroyed!
	if (!frame || !frame.contentDocument || !frame.contenDocument.body) return;
	const cssEls = frame.contenDocument.querySelectorAll(selector) || [];
	cssEls.forEach(node => node.parentElement.removeChild(node));
}


const insertUnit = ({frame, unitJson, vertId, status, size, play, endCard}) => {
	if (!frame) return;
	const doc = frame.contentDocument;
	const docBody = doc && doc.body;

	// Insert preloaded unit.json, if we have it
	if (unitJson) appendEl(doc, {tag: 'div', id: 'preloaded-unit-json', innerHTML: unitJson});

	// Insert the element the unit goes in
	appendEl(doc, {tag: 'div', className:'goodloopad'});

	// Insert unit.js
	let params = []
	if (status) params.push(`gl.status=${status}`); // show published version unless otherwise specified
	if (size) params.push(`gl.size=${size}`); // If size isn't specified, the unit will pick a player-type to fit the container
	if (vertId) params.push(`gl.vert=${vertId}`); // If adID isn't specified, we'll get a random ad.
	if (play) params.push(`gl.play=${play}`)
	if (endCard) params.push(`gl.variant=tq`);
	const src = `${ServerIO.AS_ENDPOINT}/unit.js${params.length ? '?' + params.join('&') : ''}`;
	appendEl(doc, {tag: 'script', src, async: true});

	// On unmount: empty out iframe's document
	return () => {
		docBody ? docBody.innerHTML = '' : null;
	};
};


const GoodLoopUnit = ({vertId, css, size = 'landscape', status, unitJson, play = 'onvisible', endCard}) => {
	// Store refs to the .goodLoopContainer and iframe nodes, to calculate sizing & insert elements
	const [frame, setFrame] = useState();
	const [frameLoaded, setFrameLoaded] = useState(false);
	const [container, setContainer] = useState();
	const [dummy, redraw] = useState(); // Just use this to provoke a redraw

	const receiveFrame = useCallback(node => setFrame(node), []);
	const receiveContainer = useCallback(node => setContainer(node), []);

	const frameDoc = frame && frame.contentDocument;
	const frameReady = frameDoc && frameDoc.readyState === 'complete'; // Needed for Chrome as onload doesn't fire on about:blank frames
	const goodloopframe = frameDoc && frameDoc.querySelector('.goodloopframe');

	// Redo CSS when CSS or adunit frame changes
	useEffect(() => insertAdunitCss({frame: goodloopframe, css}), [css, goodloopframe]);

	// Load/Reload the adunit when vert-ID, unit size, skip-to-end-card, or iframe container changes
	useEffect(() => {
		if (frameLoaded || frameReady) insertUnit({frame, unitJson, vertId, status, size, play, endCard});
	}, [frameLoaded, frameReady, frame, unitJson, vertId, size, status, play, endCard]);

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
			<iframe frameBorder={0} scrolling='auto' style={{width: '100%', height: '100%'}} onLoad={() => setFrameLoaded(true)} ref={receiveFrame} />
		</div>
	);
};

export default GoodLoopUnit;
