import React, {useRef, useEffect, useState} from 'react';
import ServerIO from '../plumbing/ServerIOBase'; 

// @deprecated
// I'm not keen on HOCs. Our house style is to avoid HOC and similar wrapper code patterns.
// It leads to code plumbing labyrinths, which are hard to maintain.
//
// E.g. instead of doIfVisible(), just have an isVisible() function, 
// and Counter can have a couple of state flags to track its state.
// NB: using useEffect to add a sroll listener makes sense, but can 
// be done more clearly in Counter.
//
// No need to rewrite this. But avoid this pattern in future.
// Thanks, Dan

// https://reactjs.org/docs/higher-order-components.html
// https://reactjs.org/docs/hooks-reference.html
// Reusable bits of functionality: simply wrap your component with one of these to extend its functionality

/** Takes React element reference. Calculates if div is visible to user or not */
const doIfVisible = props => {
	const {elementReference, fn} = props;
	
	const { top, left, bottom, right } = elementReference.getBoundingClientRect();

	const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
	const viewportWidth = window.innerWidth || document.documentElement.clientWidth;

	// True if div is completely visible
	const isVisible = ( top >=0 && left >= 0 && bottom <= viewportHeight && right <= viewportWidth ); 

	if ( isVisible ) {
		fn(props);
	}
};

/** Logging will not work properly with anonymous functions (they do not have a displayName or name property) */
const withDoesIfVisible = (Component, fn) => props => {
	// Report if this div appeared fully on the user's screen
	let doesIfVisibleRef = useRef();
	// see https://reactjs.org/docs/hooks-reference.html#useeffect
	useEffect(() => {
		const scrollListener = window.addEventListener(
			'scroll',
			// Pass in reference to actual DOM element 
			() => doIfVisible({
				elementReference: doesIfVisibleRef.current,
				fn: () => fn(props), 
				// what is this for??
				tag: ( props.mixPanelTag || Component.dispayName || Component.name || 'UnknownComponent') + 'Visible'
			})
		);
		// cleanup 
		return () => window.removeEventListener('scroll', scrollListener);
	}, [doesIfVisibleRef]);

	return <Component {...props} doesIfVisibleRef={doesIfVisibleRef} />;
};


/**
 * @deprecated Avoid HOCs -- see note above
 */
const withLogsIfVisible = Component => withDoesIfVisible(Component, ServerIO.mixPanelTrack);

// More modern version of HOCs above
// TODO: refactor instances of withDoesIfVisible to use hook instead
const useDoesIfVisible = (fn, elementReference) => {
	const [isVisible, setIsVisible] = useState(false);

	useEffect(() => {
		// Initial call incase component is visible without scrolling
		doIfVisible({elementReference: elementReference.current, fn: () => setIsVisible(true)})

		const scrollListener = window.addEventListener(
			'scroll',
			// Pass in reference to actual DOM element 
			() => doIfVisible({
				elementReference: elementReference.current,
				fn: () => setIsVisible(true), 
			})
		);
		return () => window.removeEventListener('scroll', scrollListener);
	}, [elementReference]);

	// Trigger function when component becomes visible for the first time
	useEffect( () => {
		if(isVisible) fn();
	}, [isVisible])
};

const useLogsIfVisible = (elementReference) => useDoesIfVisible(ServerIO.mixPanelTrack, elementReference);

export {
	useDoesIfVisible,
	withDoesIfVisible,
	withLogsIfVisible
};
