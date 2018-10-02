import React from 'react';
import ReactMarkdown from 'react-markdown';
import Misc from './Misc';

/**
 * Remove non-standard characters and render Markdown.
 * @param source {!String} text to render
 * @param renderers ?? see react-markdown docs
 */
const MDText = ({source, renderers}) => {
	let nsource = Misc.normalise(source);
	return <ReactMarkdown source={nsource} renderers={renderers}/>
};

export default MDText;