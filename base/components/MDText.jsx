import React from 'react';
import ReactMarkdown from 'react-markdown';
import Misc from './Misc';

/**
 * Remove non-standard characters and render Markdown.
 */
const MDText = ({source, renderers}) => {
	let nsource = Misc.normalise(source);
	return <ReactMarkdown source={nsource} renderers={renderers}/>
};

export default MDText;