import React from 'react';
import ReactMarkdown from 'react-markdown';
import { assMatch } from 'sjtest';
import Misc from './Misc';

/**
 * Remove non-standard characters and render Markdown.
 * @param {?string} source text to render
 * @param {?Object} renderers node-type: React-component. This is merged with the default renderers.
 * The props passed to the component varies based on the type of node.
 * @param {?boolean} escapeHtml By default we render html (with just an anti-script-injection check). Set true to block html.
 */
const MDText = ({source, renderers, escapeHtml = false}) => {
	if ( ! source) {
		return null;
	}
	assMatch(source, String);

	let nsource = Misc.normalise(source);
	nsource = nsource.replace(/<br\s*\/?>/g, '    \n'); // HACK - always support break tags

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
