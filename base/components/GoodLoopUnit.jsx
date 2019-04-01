import React, {useRef, useEffect} from 'react';
import ServerIO from '../plumbing/ServerIOBase';
import { assert } from 'sjtest';

const insertAdunitCSS = ({iframe, CSS}) => {
	const $style = document.createElement('style');
	$style.type = 'text/css';
	$style.id = 'vert-css';
	$style.innerHTML = CSS;

	// (18/02/19) Inserting in to body instead of head is a dumb dumb fix for adunit inserting it's style tag after insertAdunitCSS has already run
	// Means that, if a user makes edits and then reloads the page, they will see the published ad's CSS rather than their local changes.
	// Don't think that there is any event I can listen for, and I did not want to have this function run in the render method.
	iframe.contentDocument.body.appendChild($style);
};

const GoodLoopUnit = ({ adID, CSS, size }) => {
	// TODO: investigate this
	// Looked as though default parameter was ignored if falsy value is provided as argument to GoodLoopUnit
	size = size || 'landscape';

	// Get reference to iframe div instantiated by React
	let iframeRef = useRef();

	// Load/Reload the adunit
	useEffect( () => {
		const iframe = iframeRef.current;
		if( !iframe ) return;

		// Load specific ad if given, random ad if not
		let src = ServerIO.AS_ENDPOINT + '/unit.js?gl.status=DRAFT&gl.size=' + size + '&';
		if ( adID ) src += ('gl.vert=' + adID + '&');

		const $container = document.createElement('div');
		$container.className = 'goodloopad'; 

		const $script = document.createElement('script');
		$script.src = src;
		$script.async = true;

		iframe.contentDocument.body.appendChild($script);
		iframe.contentDocument.body.appendChild($container);

		return () => iframe.contentDocument && iframe.contentDocument.body ? iframe.contentDocument.body.innerHTML = '' : null;
	}, [adID, size, iframeRef]);

	// Insert CSS in to the head
	// Decided to continue with this rather than loading DRAFT because I have no good way of knowing when back-end will have updated with user's changes. At best will be much slower.
	let goodloopframe = iframeRef.current && iframeRef.current.contentDocument && iframeRef.current.contentDocument.querySelector('.goodloopframe');
	useEffect( () => {
		if( !goodloopframe ) return;

		insertAdunitCSS({iframe: goodloopframe, CSS});
		// Has the adunit already inserted a custom CSS tag?
		// If so, delete it. Use querySelectorAll in case multiple tags were accidentaly inserted
		return () => {
			const $adunitCSS = goodloopframe.querySelectorAll('#vert-css') || [];
			$adunitCSS.forEach( node => node.parentElement.removeChild(node) );
		}
	}, [CSS, goodloopframe]);

	let frameStyle = {};
	if ( size === 'landscape') {
		frameStyle.height = '360px';
		frameStyle.width = '640px';
	} else if ( size === 'portrait' ) {
		frameStyle.height = '800px';
		frameStyle.width = '450px';
	}

	return (
		<div className="goodLoopContainer">
			<iframe ref={iframeRef} frameBorder={0} scrolling='auto' style={frameStyle} />
		</div>
	);
};

export default GoodLoopUnit;
