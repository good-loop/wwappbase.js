import React, {useRef, useEffect, useState} from 'react';
import ServerIO from '../plumbing/ServerIOBase'; 

// NB: Comments below refer to an earlier version of this code that made use of HOCs rather than hooks.
// @deprecated (sorry)
// This is neat code, but I'm going to ask that we avoid HOCs in general.
// 
// I saw the new code in Counter. I guess you've made Counter run smoother by replacing 
// the npm package with this code?
// Good work.
// 
// And useState() for maintaining the counter's internal state is an improvement on 
// passing in an id to key into DataStore -- given that the internal state is genuinely 
// internal (i.e. other parts of code don't need to know).
//
// Re. HOCs -- Our house style is to avoid HOC and similar wrapper code patterns.
// Why, when they seem powerful?
// They can lead to complex code plumbing, which is hard to maintain.
// Mostly though it's an aesthetic choice.
// It's a good idea for a code base to consistently use a few simple code patterns. 
// That consistency helps with maintenance, code reuse, and teamwork.
// So some patterns we don't use just because we don't use them.
// Also, the more basic and standard the code, the easier it is for new devs to pick it up.
// NB: see (and feel free to update 'cos its partly out of date) 
// https://wiki.good-loop.com/index.php?title=Code_Style_Guidelines
// 
// You don't have to rewrite the work you've done. Just please avoid the HOC pattern in future.
// 
// E.g. instead of doIfVisible(), just have an isVisible(): ref -> boolean function, 
// and Counter can have a couple of state flags to track its state.
// Using useEffect to add a scroll listener makes good sense.
//
// Thanks, Dan

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
	useEffect(() => {
		if(isVisible) fn();
	}, [isVisible])
};

const useLogsIfVisible = (elementReference, mixPanelTag) => useDoesIfVisible(() => ServerIO.mixPanelTrack({mixPanelTag}), elementReference);

export {
	useDoesIfVisible,
	useLogsIfVisible
};
