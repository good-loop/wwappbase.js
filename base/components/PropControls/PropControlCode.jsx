import React from 'react';

import Prism from 'prismjs';
import '../../style/prism-dark.less';

import { DSsetValue, registerControl } from '../PropControl';


const PropControlCode = ({ storeValue, prop, path, lang, onFocus: _onFocus, onChange: _onChange, onKeyDown: _onKeyDown, rawValue, setRawValue, ...otherStuff}) => {
	// Tab should insert tab character instead of selecting next interactable element
	const onKeyDown = (e) => {
		if (e.key !== 'Tab') {
			_onKeyDown && _onKeyDown(e);
			return;
		};

		e.preventDefault();
		const evtTarget = e.target;
		const { selectionStart, selectionEnd } = evtTarget;
		DSsetValue([...path, prop], storeValue.slice(0, selectionStart) + '\t' + storeValue.slice(selectionEnd));
		setTimeout(() => {
			evtTarget.setSelectionRange(selectionStart + 1, selectionStart + 1);
			evtTarget.focus();
		}); // defer until after DataStore update redraws element & breaks caret pos / focus
	};

	// scroll the textarea & code at the same time
	const onScroll = (e) => {
		const inputEl = e.target.parentElement.querySelector('textarea');
		const syntaxEl = e.target.parentElement.querySelector('pre');
		syntaxEl.scrollLeft = inputEl.scrollLeft;
		syntaxEl.scrollTop = inputEl.scrollTop;
	};

	const onChange = e => {
		_onChange && _onChange(e);
		const codeEl = e.target.parentElement.querySelector('code');
		setTimeout(() => Prism.highlightElement(codeEl));
	};

	const onFocus = e => {
		_onFocus && _onFocus(e);
		const codeEl = e.target.parentElement.querySelector('code');
		setTimeout(() => Prism.highlightElement(codeEl));
	};

	// fix discrepency between last lines & stop undefined errors
	const codeText = storeValue ? `${storeValue}\n ` : ' ';

	return (
		<div className="code-container">
			<pre className="form-control syntax-highlighting">
				<code className={`code-highlighting language-${lang}`}>
					{codeText}
				</code>
			</pre>
			<textarea
				name={prop}
				value={storeValue}
				className="form-control code-input"
				wrap="off"
				spellCheck={false}
				onKeyDown={onKeyDown}
				onFocus={onFocus}
				onScroll={onScroll}
				onChange={onChange}
				{...otherStuff}
			/>
		</div>
	);
};


registerControl({
	type: 'code',
	$Widget: PropControlCode,
});

export default {};
