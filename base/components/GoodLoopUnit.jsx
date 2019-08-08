import React, {useEffect, useState} from 'react';
import ServerIO from '../plumbing/ServerIOBase';


const appendEl = (doc, {tag, ...attrs}) => {
	if (!doc || !doc.createElement || !tag) return;
	const el = doc.createElement(tag);
	Object.entries(attrs).forEach(([key, val]) => {
		el[key] = val;
	});
	doc.body.appendChild(el);
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
	return () => removeAdunitCss({frame, selector: '#vert-css.override'});
};


/** Remove custom CSS from the adunit's frame */
const removeAdunitCss = ({frame, selector = '#vert-css'}) => {
	// this might be called after the iframe has already been destroyed!
	if (!frame || !frame.contentDocument || !frame.contenDocument.body) return;
	const cssEls = frame.contenDocument.querySelectorAll(selector) || [];
	cssEls.forEach(node => node.parentElement.removeChild(node));
}


const insertUnit = ({frame, unitJson, vertId, status, size}) => {
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
	const src = `${ServerIO.AS_ENDPOINT}/unit.js${params.length ? '?' + params.join('&') : ''}`;
	appendEl(doc, {tag: 'script', src, async: true});

	// On unmount: empty out iframe's document
	return () => { docBody ? docBody.innerHTML = '' : null; };
};


const GoodLoopUnit = ({vertId, css, size = 'landscape', status, unitJson}) => {
	// Store refs to the .goodLoopContainer and iframe nodes, to calculate sizing & insert elements
	const [state, setState] = useState({});
	const {container, frame} = state;

	// Record the container and iframe when they're put in the DOM
	const receiveRef = ((name, node) => {
		if (node && node !== state[name]) {
			// Make element available in this function and provoke a redraw
			setState({...state, [name]: node});
		}
	});

	const frameDoc = frame && frame.contentDocument;
	const goodloopframe = frameDoc && frameDoc.querySelector('.goodloopframe');

	// Redo CSS when CSS or adunit frame changes
	useEffect(() => insertAdunitCss({frame: goodloopframe, css}), [css, goodloopframe]);

	// Load/Reload the adunit when vert-ID, unit size, or iframe container changes
	useEffect(() => insertUnit({frame, unitJson, vertId, status, size}), [frame, unitJson, vertId, size, status]);

	// Set up listeners to redraw this component on window resize or rotate
	useEffect(() => {
		window.addEventListener('resize', setState);
		window.addEventListener('orientationchange', setState);

		return () => {
			window.removeEventListener('resize', setState);
			window.removeEventListener('orientationchange', setState);
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
		<div className="goodLoopContainer" style={dims} ref={(node) => receiveRef('container', node)}>
			<iframe frameBorder={0} scrolling='auto' style={{width: '100%', height: '100%'}} ref={(node) => receiveRef('frame', node)} />
		</div>
	);
};

export default GoodLoopUnit;
