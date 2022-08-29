import React, { useState } from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter, Button } from 'reactstrap';
import PropControl from './PropControl';
import Prism from 'prismjs';
import '../style/syntaxHighlighting.less';


const ModalTextInput = ({props, storeValue}) => {

	let {modal, ...rest} = props

	const [modalOpen, setModalOpen] = useState(false);
	const [caretPos, setCaretPos] = useState(false);
	const [inputEl, setInputEl] = useState();

	const onFocusInput = e => setTimeout(() => { // selectionStart needs a TINY delay or it reads incorrectly
		setCaretPos(e.target.selectionStart)
		setModalOpen(true);
	}, 0);

	const focusInner = (el) => {
		const _inputEl = el?.querySelector('.form-control'); // grab modal text element
		
		if(_inputEl && props.styled) Prism.highlightAll();	 // apply highlighting once a call

		if (caretPos === false) return;						 // if false, we've already set

		// focus & set modals caret to be same as non-modals - but only on creation
		setInputEl(prev => {
			if (_inputEl && !prev) {
				_inputEl.selectionStart = caretPos; 
				_inputEl.selectionEnd = caretPos;
				setTimeout(() => setCaretPos(false), 0) 
				_inputEl.focus();
			};
			return _inputEl;
		});
	};

	if(props.styled) {
		// Prism (the syntax-highlighting lib) doesn't work on text-area's
		// to get around this, this puts a translucent text-area over a highlighted code block

		// fixes lastline discrepency between prism & textarea 
		let codeText = storeValue ? (storeValue[storeValue.length-1] === "\n" ? storeValue + " " : storeValue) : " "

		return <>
			<PropControl onFocus={onFocusInput} {...rest} />
			<Modal className="modal-propControl" isOpen={modalOpen} toggle={() => setModalOpen(!modalOpen)} fade={false} size="lg" returnFocusAfterClose={false} innerRef={focusInner}>
				<ModalBody>
					<PropControl {...rest} modalTextarea/>
					<pre className="line-numbers" id="syntax-highlighting"><code className={"language-"+rest.styled} id="code-highlighting">{codeText}</code></pre>
				</ModalBody>
			</Modal>
		</>;
	} else {
		return <>
			<PropControl onFocus={onFocusInput} {...rest} />
			<Modal className="modal-propControl" isOpen={modalOpen} toggle={() => setModalOpen(!modalOpen)} fade={false} size="lg" returnFocusAfterClose={false} innerRef={focusInner}>
				<ModalBody>
					<PropControl {...rest} id="modal-textarea-no-style"/>
				</ModalBody>
			</Modal>
		</>;
	}
}

const ModalStyledTextarea = ({props, storeValue, onChange, prop, otherStuff, DSsetValue, proppath}) => {
				// tab normally selects next window, make it indent instead
				const onTabDown = (e) => {
					if(e.key === "Tab"){
					  e.preventDefault()
					  let startCaret = e.target.selectionStart;
					  let endCaret = e.target.selectionEnd;
					  let newText = storeValue.slice(0, startCaret) + "\t" +storeValue.slice(endCaret)
					  setTimeout(() => {
						e.target.selectionStart = startCaret + 1
						e.target.selectionEnd = startCaret + 1
					}, 0)
					DSsetValue(proppath, newText)
					}
				}
	
				// scroll the textarea & code at the same time
				const onScroll = () => {
					$("#syntax-highlighting").scrollTop($("#input-highlighting").scrollTop());
					$("#syntax-highlighting").scrollLeft($("#input-highlighting").scrollLeft());
				  }
	
	
				return <textarea 
				id="input-highlighting"
				wrap="off"
				spellCheck="false"
				onKeyDown={onTabDown}
				onScroll={onScroll}
	
				className="form-control"
				name={prop}
				onChange={onChange}
				value={storeValue}
				{...otherStuff}
				/>;	
}


export default ModalTextInput
export {ModalStyledTextarea};
