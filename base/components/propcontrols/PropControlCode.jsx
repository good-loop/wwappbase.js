import React, { useEffect, useRef, useState } from 'react';
import Prism from 'prismjs';
Prism.manual = true; // Suppress Prism auto-highlighting

import { FakeEvent, registerControl } from '../PropControl';
import { setInputValue } from '../../utils/miscutils';

// import '../../style/prism-dark.less';
import '../../style/prism-tomorrow.less';
import '../../style/PropControls/PropControlCode.less';

/** Used as a "split tree here when flattening" marker when turning */
const NEWLINE = Symbol();

const multilineTest = [
	'This is a text token\n',
	{ type: 'important', content: ['Multi-string text token 1 ', 'Multi-string text token 2', 'Multi-string text token 3'] },
	'\n',
	{ type: 'property', content: 'Single string which spans multiple lines\nContinuation of multiline string' },
	'\n',
	{ type: 'comment', content: [
		'Comment token 1',
		{ type: 'selector', content: 'Comment+selector nested token' },
		{ type: 'property', content: 'Comment+property nested MULTILINE token line 1\nComment+property nested MULTILINE token line 2' },
		'Comment token end line 1\nComment token end line 2',
	]},
];


/** Recursively render a Prism.js Token to a <span> */
function TokenSpan({ token }) {
	if (typeof token === 'string') return token;
	if (token.map) return token.map((tkn, i) => <TokenSpan key={i} token={tkn} />);
	return <span className={`token ${token.type}`}><TokenSpan token={token.content} /></span>;
}


/**
 * Split an array on a particular item and group the runs of elements between the split points.
 * [1, splitOn, 2, 3, splitOn, 4, [5, 6]] --> [[1], splitOn, [2, 3], splitOn, [4, [5, 6]]]
 * @param {*[]} array The input array
 * @param {*} splitOn Array is split where element === splitOn
 * @param {?boolean} [keep=true] Keep the splitOn elements in between groups
 */
const groupBetweenSplits = (array, splitOn, keep = true) => {
	const groups = [];
	let group = [];
	const last = array.length - 1;
	array.forEach((el, i) => {
		const isSplitter = (el === splitOn);
		if (isSplitter) {
			groups.push(group);
			if (keep) groups.push(el);
			group = [];
		} else {
			group.push(el);
			if (i === last) groups.push(group);
		}
	});
	return groups;
};


/**
 * Process a Prism.js token and do two things:
 * - Wherever there's a newline, split the token stream (including nesting) and insert a NEWLINE symbol, so e.g.:
 * -- { type: "x", content: { type: "y", content: "Line 1\nLine 2" } } becomes:
 * -- [{ type: "x", content: { type: "y", content: "Line 1" } }, NEWLINE, { type: "x", content: { type: "y", content: "Line 1" } }]
 * - Augment it with flattened text, which can be used at the top level as a per-line key.
 * @param {Prism.Token} token
 * @returns {(Prism.Token|NEWLINE)[]}
 */
const splitToken = (token) => {
	// Base case: split string on newline character (LF or CRLF - can use /\r\n|\r|\n/ if we somehow need to support MacOS 9)
	// 'Hello\nWorld\n' --> ['Hello', LINEBREAK, 'world', LINEBREAK, '']
	// Don't trim off empty strings - they'll either get merged and disappear, or (correctly) become empty <li>s at the root of the tree.
	if (typeof token === 'string') return token.split(/\r?\n/).flatMap(a => [a, NEWLINE]).slice(0, -1);
	const { content, ...rest } = token;
	// Recurse in until we reach strings, then group everything between NEWLINEs into arrays
	const splitChildren = content.flatMap?.(splitToken) || splitToken(content);
	return groupBetweenSplits(splitChildren, NEWLINE).map(group => {
		if (group === NEWLINE || !group.length) return group;
		const text = group.reduce((acc, el) => acc + (typeof el === 'string' ? el : el.text), '');
		return { text, content: group, ...rest };
	});
};


const tokensToLines = (tokens = []) => {
	const lineSpecs = groupBetweenSplits(tokens.flatMap(splitToken), NEWLINE, false);
	const seenKeys = {};
	return lineSpecs.map((ls, i) => {
		let { text } = ls;
		if (seenKeys[text]) text += `-${i}`;
		seenKeys[text] = true;
		return <li key={text}><TokenSpan token={ls} /></li>
	});
}


const PropControlCode = ({ storeValue, prop, path, lang, onChange, onKeyDown, rawValue, setRawValue, ...otherStuff }) => {
	const [tokenLines, setTokenLines] = useState();

	const codeRef = useRef(); // The editable <code>

	// Update highlighting in <code> element
	const doHighlight = () => {
		const tokens = Prism.tokenize(codeRef.current.innerText, Prism.languages.css);
		setTokenLines(tokensToLines(tokens));
	};

	// Highlight the <code> element as soon as it mounts
	useEffect(() => {
		if (codeRef.current) doHighlight();
	}, [codeRef.current])

	// Event handlers for <code>
	const inputEvents = {
		onKeyDown: (e) => {
			onKeyDown && onKeyDown(e);
			if (e.key !== 'Tab') return;
			if (!codeRef.current) return;

			// Tab should insert tab character instead of selecting next interactable element
			const code = codeRef.current;
			const sel = window.getSelection();
			const isInside = (code.contains(sel.anchorNode) && code.contains(sel.focusNode));
			if (!isInside) return; // Don't act on a selection that isn't fully inside the editor!
			e.preventDefault();
			// Replace the selection with a tab character
			sel.deleteFromDocument();
			sel.getRangeAt(0).insertNode('\t');
			onChange && onChange(new FakeEvent(codeRef.innerText));
			doHighlight();
			// ...and push caret forward by 1??
		},
		onInput: () => {
			onChange && onChange(new FakeEvent(codeRef.innerText));
			doHighlight();
		}
	};

	return <pre className={`language-${lang}`} {...otherStuff}>
		<code className={`language-${lang}`} {...inputEvents} contentEditable="plaintext-only" ref={codeRef}>
			<ol>{tokenLines || storeValue}</ol>
		</code>
	</pre>;
};


registerControl({
	type: 'code',
	$Widget: PropControlCode,
});


export default {};
