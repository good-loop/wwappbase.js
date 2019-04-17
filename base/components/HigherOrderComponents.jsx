import React, {useRef, useEffect} from 'react';
import ServerIO from '../plumbing/ServerIOBase'; 
// https://reactjs.org/docs/higher-order-components.html
// Reusable bits of functionality: simply wrap your component with one of these to extend its functionality

/** Logging will not work properly with anonymous functions (they do not have a displayName or name property) */
const withDoesIfVisible = (Component, fn) => props => {
	// Report if this div appeared fully on the user's screen
	let doesIfVisibleRef = useRef();
	useEffect(() => {
		const scrollListener = window.addEventListener(
			'scroll',
			// Pass in reference to actual DOM element 
			() => ServerIO.doIfVisible({
				elementReference: doesIfVisibleRef.current,
				fn: () => fn(props), 
				tag: ( props.mixPanelTag || Component.dispayName || Component.name || 'UnknownComponent') + 'Visible'
			})
		);
		return () => window.removeEventListener('scroll', scrollListener);
	}, [doesIfVisibleRef]);

	return <Component {...props} doesIfVisibleRef={doesIfVisibleRef} />;
};

const withLogsIfVisible = Component => withDoesIfVisible(Component, ServerIO.mixPanelTrack);

// /**
//  * Pull in data from back-end, save in local state, pass to Component
//  * @param processFN optional transformation function to be called on returned data
//  * Result will be passed to Component
//  * @param url to pull data from. ServerIO.load will be used
//  */
// withFetchesData = Component => props => {
// 	const {processFN, url}

// 	[data, setData] = useState({});

// 	useEffect(() => {
// 		if( !url ) {
// 			console.error('Url not provided to ' + Component.displayName + ' which is wrapped by withFetchesData');
// 			return;
// 		}
// 		// Load the data and place in state
// 		data = ServerIO.load(url);
// 		processFN && data.then(processFN);
// 		setData(data);
// 	}, [processFN, url]);

// 	return <Component {...props} data={data} />
// };

export {
	// withFetchesData,
	withDoesIfVisible,
	withLogsIfVisible
};
