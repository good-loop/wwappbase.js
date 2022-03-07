import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { assMatch } from '../utils/assert';
import Misc from './Misc';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { is } from '../utils/miscutils';
import { Input, Label } from 'reactstrap';

const MDCheckbox = ({setSource, source, checked, ...args}) => {
	if ( ! is(checked)) {
		return ReactMarkdown.renderers.listItem(args);
	}
	// args = Object.assign({}, args);
	// args.checked = null;
	// return <><input type="radio" />kids: {args.children} render: {ReactMarkdown.renderers.listItem(args)}</>;
	// const [isChecked, setChecked] = useState(args.checked);
	const onChange = e => {
		const posn = args.node.position;
		let lis = source.slice(posn.start.offset, posn.end.offset);
		let newLis = checked? lis.replace("[x]","[ ]") : lis.replace("[ ]","[x]");
		let newSource = source.slice(0,posn.start.offset)+newLis+source.slice(posn.end.offset);
		console.log("task tick :)", newSource, args, e);
		setSource(newSource);
	};
	return (<li>
		<Input type='checkbox' 
				className="form-check-input"				
				checked={checked}
				onChange={onChange} />
			<Label check>{args.children}</Label>
		</li>);
};

/**
 * Remove non-standard characters and render Markdown.
 * @param {?string} source text to render
 * @param {?Object} renderers DEPRECATED same function as components, left in for legacy
 * @param {?Object} components node-type: React-component. This is merged with the default renderers.
 * The props passed to the component varies based on the type of node.
 * @param {?boolean} escapeHtml By default we render html (with just an anti-script-injection check). Set true to block html.
 * @param {Function} setSource newText => Function to make changes to the text source. If provided, then checkboxes can be clicked on/off.
 * @param {?boolean} linkOut Toggle for <a> links should use LinkOut
 */
const MDText = ({source, renderers={}, components={}, escapeHtml = false, setSource, linkOut}) => {
	if ( ! source) {
		return null;
	}
	assMatch(source, String);

	let nsource = Misc.normalise(source);
	nsource = nsource.replace(/<br\s*\/?>/g, '    \n'); // HACK - always support break tags

	// security: no onClick etc traps or scripts
	if ( ! escapeHtml) {
		let bad = nsource.match(/<([^>]+\bon[a-zA-Z]+=|script.*)/g, '');
		if (bad) {
			console.warn("Dangerous content in markdown!", bad, nsource);
			escapeHtml = true;
		}
	}
	
	// Merge renderers with new components for legacy
	Object.assign(components, renderers);
	// tasks
	if (setSource) {
		components.listItem = args => <MDCheckbox source={source} setSource={setSource} {...args} />;
	}
	if (linkOut) {
		// TODO
	}
	// TODO linkOut vs a

	return <div className="MDText"><ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={escapeHtml ? null : [rehypeRaw]} children={nsource} components={components} /></div>;
};

export default MDText;
