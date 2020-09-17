import React from 'react';
import ReactMarkdown from 'react-markdown';
import Misc from './Misc';

/**
 * Remove non-standard characters and render Markdown.
 * @param source {!String} text to render
 * @param renderers ?? see react-markdown docs
 */
const MDText = ({source, renderers}) => {
	// Misc.normalise is not a thing. Should this component be retired ??
	let nsource = Misc.normalise(source);
	nsource = nsource.replaceAll("<br/>","    \n"); // HACK - support break tags
	return <ReactMarkdown source={nsource} renderers={renderers} />;
};

export default MDText;
