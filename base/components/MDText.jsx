import React from 'react';
import MDText from '../base/components/MDText'
import Misc from './Misc';

/**
 * Remove non-standard characters and render Markdown.
 */
const MDText = ({source}) => {
	let source = Misc.normalise(source);
	return <ReactMarkdown source={source} />
};

export default MDText;