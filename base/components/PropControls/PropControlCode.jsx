import React, { useState } from 'react';
import { registerControl } from '../PropControl';

import Prism from 'prismjs';
import '../../style/prism-dark.less';


const PropControlCode = ({ storeValue, onChange, prop, otherStuff, DSsetValue, path, lang, onFocus }) => {
	// tab normally selects next window, make it indent instead
	const onTabDown = (e) => {
		if (e.key === "Tab") {
			e.preventDefault()
			let startCaret = e.target.selectionStart;
			let endCaret = e.target.selectionEnd;
			let newText = storeValue.slice(0, startCaret) + "\t" + storeValue.slice(endCaret)
			setTimeout(() => {
				e.target.selectionStart = startCaret + 1
				e.target.selectionEnd = startCaret + 1
			}, 0)
			DSsetValue(path, newText)
		}
	}

	// scroll the textarea & code at the same time
	const onScroll = () => {
		let syntaxEl = document.querySelector("#syntax-highlighting-" + prop)
		let inputEl = document.querySelector("#input-highlighting-" + prop)
		syntaxEl.scrollLeft = inputEl.scrollLeft;
		syntaxEl.scrollTop = inputEl.scrollTop;
	}

	// fix discrepency between last lines & stop undefined errors
	let codeText = storeValue ? storeValue + "\n " : " "

	return (
		<div className='code-container'>
			<pre id={"syntax-highlighting-" + prop} className="syntax-highlighting"><code className={"language-" + lang + " code-highlighting"} id={"code-highlighting-" + prop}>{codeText}</code></pre>
			<textarea
				value={storeValue}
				id={"input-highlighting-" + prop}
				className={"form-control " + prop + " input-highlighting"}
				wrap="off"
				spellCheck="false"
				form-control
				onKeyDown={onTabDown}
				onFocus = {e => setTimeout(() => {Prism.highlightAllUnder(e.target.parentElement)}, 0)}
				onScroll={onScroll}
				name = { prop }
				onChange = { e => { onChange(e); setTimeout(() => {Prism.highlightAllUnder(e.target.parentElement)}, 0)}}
			
			{...otherStuff}
			/>
		</div>
	)
}


registerControl({
	type: 'code',
	$Widget: PropControlCode,
});

export default {};
