import React, { Component } from 'react';
import { useState } from 'react';
import { useRef } from 'react';


// Where should we request cached/resized images? Use the media cluster which matches the current local/test/prod site.
let domainPrefix = window.location.host.match(/^(local|test)/);
domainPrefix = domainPrefix ? domainPrefix[0] : '';
domainPrefix = ''; // use the live cache
const mediaCacheBase = `${window.location.protocol}//${domainPrefix}media.good-loop.com/uploads/mediacache/`;


/**
 * A drop-in replacement for the html <img> tag, which adds in image size handling via media.gl.com
 * and mobile images via `msrc`
 */
const DynImg = ({src, msrc, ...props}) => {
	let _src = src;
	// explicit mobile setting?
	if (msrc && isMobile()) {
		_src = msrc;
	}
	if (false && C.SERVER_TYPE !== 'local') {
		return <img src={_src} {...props} />;
	}
	// work out the width
	let [width, setWidth] = useState();
	let ref = useRef();
	if ( ! width) {
		// Set img src to instant-loading placeholder data-URL to probe size without loading anything
		_src = transparentPixel;
		if (ref.current) {
			const $img = ref.current;
			// - Check img for an existing width rule
			// - If none, set width: 100% inline, to estimate largest occupied space
			// - Store any existing inline width rule to restore later
			let inlineWidth = '';
			const existingWidth = window.getComputedStyle($img).getPropertyValue('width');
			if ( ! existingWidth) {
				inlineWidth = $img.style.width;
				$img.style.width = '100%'
			}

			// get current pixel width
			width = $img.clientWidth;
			setWidth(width);

			// restore the image's original inline width rule
			if ( ! existingWidth) {
				$img.style.width = inlineWidth;
			}					
		}
	}
	// wrap url
	if (width) {
		// Get scaled + cached image URL and set it on the <img>
		_src = wrapUrl(src, width);
	}
	return <img ref={ref} src={_src} {...props} />;
};


// Let's quantise image sizes into 360px intervals (ie, neatly matched to common phone screen widths) + some tiny ones for good measure.
const sizes = [ 2160, 1800, 1440, 1080, 720, 360, 180, 90 ];


/** A 1x1 transparent PNG for use as a placeholder src */
const transparentPixel = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABAQMAAAAl21bKAAAAA1BMVEUAAACnej3aAAAAAXRSTlMAQObYZgAAAApJREFUCNdjYAAAAAIAAeIhvDMAAAAASUVORK5CYII=';

/** NB: Copy pasta from dynimg.js
 * Take a (hopefully image) URL and wrap it in a request to MediaCacheServlet, with optional scaling. 
 * @param {!string} src url, can be relative
 * @param {!number} width
 * */
function wrapUrl(src, width) {
	// resolve relative URLs
	const url = new URL(src, document.location);

	// use e.g. data: urls uncached
	if (!url.protocol.match(/http/)) return src;

	// base64web-encode URL for use as filename
	const urlEncoded = btoa(url.href).replace('+', '-').replace('/', '_');
	let extension = url.pathname.match(/\.[^.]+$/)[0];
	
	let sizeDir = '';
	if (width && !extension.match(/\.svg/)) {
		// Step down through quantised image widths & find smallest one bigger than estimated pixel size
		let qWidth = sizes[0];
		for (let i = 0; i < sizes.length && sizes[i] >= width; i++) {
			qWidth = sizes[i];
		}
		sizeDir = `scaled/w/${qWidth}/`;
	}
	return mediaCacheBase + sizeDir + urlEncoded  + extension + '?from=good-loop-ad-unit';
};

export default DynImg;
