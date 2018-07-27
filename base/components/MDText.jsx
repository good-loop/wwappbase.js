import React from 'react';
import ReactMarkdown from 'react-markdown';
import Misc from './Misc';

/**
 * Remove non-standard characters and render Markdown.
 */
const MDText = ({source}) => {
	let nsource = Misc.normalise(source);
	return <ReactMarkdown source={nsource} />
};

export default MDText;