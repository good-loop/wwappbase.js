import React, { useEffect, useRef } from 'react';
import Prism from 'prismjs';
import { DSsetValue, registerControl } from '../PropControl';

import '../../style/prism-dark.less';
import '../../style/PropControls/PropControlCode.less';


const PropControlCode = ({ storeValue, prop, path, lang, onFocus, onChange, onKeyDown, rawValue, setRawValue, ...otherStuff }) => {
	const textRef = useRef(); // The mostly-invisible <textarea>
	const codeRef = useRef(); // The <code> containing the highlighted text
	const preRef = useRef(); // The <pre> containing the highlighter <code>

	// Update highlighting in <code> element
	const doHighlight = () => codeRef.current && Prism.highlightElement(codeRef.current);
	// Match scrolling between <textarea> and <code>
	const syncScroll = () => {
		if (!preRef.current || !textRef.current) return;
		preRef.current.scrollLeft = textRef.current.scrollLeft;
		preRef.current.scrollTop = textRef.current.scrollTop;
	};

	// Highlight the <code> element as soon as it mounts
	useEffect((e) => {
			setTimeout(doHighlight);
	}, [codeRef])

	// Event handlers for <textarea>
	const inputEvents = {
		// Tab should insert tab character instead of selecting next interactable element
		onKeyDown: (e) => {
			onKeyDown && onKeyDown(e);
			if (e.key !== 'Tab') return;
			if (!textRef.current) return;

			e.preventDefault();
			const { selectionStart, selectionEnd } = textRef.current;
			DSsetValue([...path, prop], storeValue.slice(0, selectionStart) + '\t' + storeValue.slice(selectionEnd));
			setTimeout(() => {
				textRef.current.setSelectionRange(selectionStart + 1, selectionStart + 1);
				textRef.current.focus();
				setTimeout(doHighlight);
			}); // defer until after DataStore update redraws element & breaks caret pos / focus
		},
		// scroll the textarea & code at the same time
		onScroll: syncScroll,
		onChange: e => {
			onChange && onChange(e);
			setTimeout(doHighlight);
		},
		onFocus: e => {
			onFocus && onFocus(e);
			setTimeout(doHighlight);
		},
	};

	// fix discrepency between last lines & stop undefined errors
	const codeText = storeValue ? `${storeValue}\n ` : ' ';

	return (
		<div className="code-container">
			<pre className="syntax-highlighting" ref={preRef}>
				<code className={`language-${lang}`} ref={codeRef}>
					{codeText}
				</code>
			</pre>
			<textarea
				className="form-control code-input" wrap="off" spellCheck={false}
				name={prop} value={storeValue} ref={textRef}
				{...inputEvents} {...otherStuff}
			/>
		</div>
	);
};


registerControl({
	type: 'code',
	$Widget: PropControlCode,
});

export default {};
