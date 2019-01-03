import React from 'react';

const dragstate = {
	dragging: null,
	drops: []
};
// for debug
window.dragstate = dragstate;

// must preventDefault to allow drag
const _onDragOver = (e, id) => {
	// TODO check for validity
	e.preventDefault();
	let dragid = e.dataTransfer.getData("id");
	console.log('onDragOver', dragstate.dragging, id, dragid, e);
};

// must preventDefault to allow drag
const _onDragEnter = (e, id) => {
	let dragid = e.dataTransfer.getData("id");
	// TODO check for validity
	e.preventDefault();
	console.log('onDragEnter', dragstate.dragging, id, dragid, e);
};

const _onDragLeave = (e, id, onDragLeave) => {
	let dragid = e.dataTransfer.getData("id");
	if (onDragLeave) onDragLeave(e, id, dragid);
};

const _onDragExit = (e, id) => {
	let dragid = e.dataTransfer.getData("id");
	// TODO check for validity
	e.preventDefault();
	console.log('onDragExit', dragstate.dragging, id, dragid, e);
};

/**
 * Update dragstate.drops
 * @param onDrop {?Function} (e, dropInfo) => do-stuff
 */
const _onDrop = (e, id, onDrop, el) => {
	e.preventDefault();
	let dragid = e.dataTransfer.getData("id");
	console.log('onDrop', el, "this", this, id, dragid, dragstate.dragging);
	dragstate.dragging = null;
	let x = e.clientX - window.pageXOffset;
	let y = e.clientY - window.pageYOffset;
	const drop = {dropzone:id, draggable:dragid, 
		x, y, screenX:e.screenX, screenY:e.screenY,
		clientX:e.clientX, clientY:e.clientY};
	dragstate.drops.push(drop);
	// IE?? ev.dataTransfer.getData("text");
	if (onDrop) onDrop(e, drop);
};

const _onDragStart = (e, id, onDragStart) => {
	// e.preventDefault();
	console.log('onDragStart', id);
	e.dataTransfer.setData("id",id);
	dragstate.dragging = id;
	// IE??
	// e.dataTransfer.setData("text/plain",id);
	if (onDragStart) onDragStart();
};

const _onDragEnd = (e, id, onDragStart) => {
	console.log('onDragEnd', id);
	dragstate.dragging = null;
};

// https://mobiforge.com/design-development/html5-mobile-web-touch-events
const Draggable = ({children, id, onDragStart, onDragEnd, className}) => {
	className = className? className+' Draggable' : 'Draggable';
	return (<div className={className} id={id}
		draggable
		onDragStart={e => _onDragStart(e, id, onDragStart)}
		onDragEnd={e => _onDragEnd(e, id, onDragEnd)}
		onDragLeave={e => _onDragLeave(e, id)}
		onTouchStart={e => {			
    		var touch = e.targetTouches[0];			
			console.log('touchstart', e, touch, JSON.stringify(touch));
			// // Place element where the finger is
			// draggable.style.left = touch.pageX-25 + 'px';
			// draggable.style.top = touch.pageY-25 + 'px';
			// e.preventDefault();
		}}
		onTouchMove={e => {			
    		var touch = e.targetTouches[0];			
			console.log('touchmove', e, touch, JSON.stringify(touch));
			// // Place element where the finger is
			// draggable.style.left = touch.pageX-25 + 'px';
			// draggable.style.top = touch.pageY-25 + 'px';
			// e.preventDefault();
		}}
		>
		{children}
	</div>);
};

/**
 * @param id {!String} identify this dropzone in the dragstate / drop info
 * @param onDrop {?Function} Called if there is a drop here. (e, dropInfo) => do-stuff
 */
const DropZone = ({id, children, onDrop}) => {
	return (<div className='DropZone' id={id}		
		onDragOver={e => _onDragOver(e, id)} 
		onDragEnter={e => _onDragEnter(e,id)}
		onDragExit={e => _onDragExit(e,id)}
		onDrop={e => _onDrop(e, id, onDrop, this)}>
		{children}
	</div>);
};

export {
	Draggable,
	DropZone,
	dragstate
}
