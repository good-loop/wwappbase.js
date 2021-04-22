import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { assMatch } from '../utils/assert';
import Misc from './Misc';
import gfm from 'remark-gfm';
import { is } from '../utils/miscutils';
import { Input, Label } from 'reactstrap';

const MDCheckbox = ({setSource, source, checked, ...args}) => {
	console.warn(args);
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
 * @param {?Object} renderers node-type: React-component. This is merged with the default renderers.
 * The props passed to the component varies based on the type of node.
 * @param {?boolean} escapeHtml By default we render html (with just an anti-script-injection check). Set true to block html.
 * @param {Function} setSource newText => Function to make changes to the text source. If provided, then checkboxes can be clicked on/off.
 */
const MDText = ({source, renderers={}, escapeHtml = false, setSource}) => {
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
	
	// tasks
	if (setSource) {
		renderers.listItem = args => <MDCheckbox source={source} setSource={setSource} {...args} />;
	}

	return <ReactMarkdown plugins={[gfm]} escapeHtml={escapeHtml} source={nsource} renderers={renderers} />;
};

export default MDText;
