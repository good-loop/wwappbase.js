import React, {useRef, useEffect} from 'react';
import ServerIO from '../plumbing/ServerIOBase'; 
// https://reactjs.org/docs/higher-order-components.html
// Reusable bits of functionality: simply wrap your component with one of these to extend its functionality

const withLogsIfVisible = (Component) => (props) => {
	// Report if this div appeared fully on the user's screen
	let logsIfVisibleRef = useRef();
	useEffect(() => {
		const scrollListener = window.addEventListener(
			'scroll',
			// Pass in reference to actual DOM element 
			() => ServerIO.logIfVisible(logsIfVisibleRef.current, "DigitalMirrorVisible")
		);
		return () => window.removeEventListener('scroll', scrollListener);
	}, [logsIfVisibleRef]);

	return <Component {...props} logsIfVisibleRef={logsIfVisibleRef} />;
};

module.exports = {
	withLogsIfVisible
};
