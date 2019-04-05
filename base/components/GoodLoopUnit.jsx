import React, {useRef, useEffect, useState} from 'react';
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

	// Calculated styling for iframe containing the adunit
	const [frameStyle, setFrameStyle] = useState({});

	// Set the frame dimensions
	useEffect( () => {
		const iframe = iframeRef.current;
		if( !iframe ) return;

		const setIframeDimensions = () => {
			// Set iframe dimensions
			const goodLoopContainerBoundingRect = iframe.parentElement.getBoundingClientRect();
			// 16:9
			if ( size === 'landscape') {
				const width = goodLoopContainerBoundingRect.width;
				setFrameStyle({
					width,
					height: 0.5625 * width
				});
			} 
			// 9:16
			else if ( size === 'portrait' ) {
				const height = goodLoopContainerBoundingRect.height;
				setFrameStyle({
					height,
					width: 0.5625 * height
				});
			}
		};
		setIframeDimensions();
		
		// Recalculate if size changes
		// NB: This may be called twice on some devices. Not ideal, but doesn't seem too important
		window.addEventListener('resize', setIframeDimensions);
		window.addEventListener('orientationchange', setIframeDimensions);		

		return () => {
			window.removeEventListener('resize', setIframeDimensions);
			window.removeEventListener('orientationchange', setIframeDimensions);
		};
	}, [iframeRef, size]);

	// Insert CSS in to the head
	// Decided to continue with this rather than loading DRAFT because I have no good way of knowing when back-end will have updated with user's changes. At best will be much slower.
	let goodloopframe = iframeRef.current && iframeRef.current.contentDocument && iframeRef.current.contentDocument.querySelector('.goodloopframe');
	useEffect( () => {
		if( !goodloopframe ) return;

		insertAdunitCSS({iframe: goodloopframe, CSS});
		// Has the adunit already inserted a custom CSS tag?
		// If so, delete it. Use querySelectorAll in case multiple tags were accidentaly inserted
		return () => {
			const $adunitCSS = goodloopframe.contentDocument.querySelectorAll('#vert-css') || [];
			$adunitCSS.forEach( node => node.parentElement.removeChild(node) );
		}
	}, [CSS, goodloopframe]);

	return (
		<div className="goodLoopContainer">
			<iframe ref={iframeRef} frameBorder={0} scrolling='auto' style={frameStyle} />
		</div>
	);
};

export default GoodLoopUnit;
