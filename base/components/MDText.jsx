import React from 'react';
import ReactMarkdown from 'react-markdown';
import Misc from './Misc';

/**
 * Remove non-standard characters and render Markdown.
 * @param {!String} source text to render
 * @param {?Object} renderers node type: React component. This is merged with the default renderers.
 * The props passed to the component varies based on the type of node.
 */
const MDText = ({source, renderers, escapeHtml = false}) => {
	// Misc.normalise is not a thing. Should this component be retired ??
	let nsource = Misc.normalise(source);
	nsource = nsource.replaceAll('<br/>', '    \n'); // HACK - always support break tags

	// security: no onClick etc traps	
	if ( ! escapeHtml) {
		let bad = nsource.match(/<[^>]+\bon[a-zA-Z]+=/g, '');
		if (bad) {
			console.warn("Dangerous content in markdown!", bad, nsource);
		}
		escapeHtml = true;
	}

	return <ReactMarkdown escapeHtml={escapeHtml} source={nsource} renderers={renderers} />;
};

export default MDText;
