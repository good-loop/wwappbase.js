/**
 * HACK since hookrouter is throwing compile errors, let's DIY the bits we actually need
 */

import React, { Component } from 'react';
import { encURI, mapkv, modifyHash, stopEvent, yessy } from '../utils/miscutils';
import DataStore from './DataStore';

const goto = href => {
	if ( ! href) {
		console.warn("goto: no href");
		return;
	}
	window.history.pushState({}, "", href);
	// scroll to the page top
	window.scrollTo(0,0);
	// update
	DataStore.parseUrlVars(true);
};

/** Which is the "open in new tab" modifier key - Ctrl or Meta (Command)? */
const clickModKey = window.navigator.platform.match(/^(Mac|iPhone|iPad|iPod)/) ? 'metaKey' : 'ctrlKey';

const A = (x) => {
	if (!x) return null;
	const {href, children, onClick, ...args} = x;
	const doClick = e => {
		// Allow default <a> behaviour (ie open in new tab/window) if appropriate modifier held down
		if (e.shiftKey || e[clickModKey]) return;

		if (!href) return; // just an anchor tag, not a link
		// Only override redirects to this origin
		if (!href.includes(window.location.origin) && href.startsWith("http")) {
			return;
		}
		stopEvent(e);
		if (onClick) onClick(e);
		// Allow onClick functions to stop our events too
		if (!e.glrouterStopEvent) goto(href);
	};
	return <a href={href} onClick={doClick} {...args}>{children}</a>;
};

A.stopEvent = e => {
	e.glrouterStopEvent = true;
};

const usePath = () => ""+window.location;

/**
 * Backwards compatible replacement for modifyHash
 * 
 * @param {?String[]} newpath Can be null for no-change
 * @param {?Object} newparams Can be null for no-change
 * @param {?boolean} returnOnly If true, do not modify the hash -- just return what the new value would be (starting with #)
 * @param {?boolean} clearParams - If true, remove all existing url parameters
 */
const modifyPage = (newpath, newparams, returnOnly, clearParams) => {
	if (DataStore.localUrl !== '/') {
		return modifyHash(newpath, newparams, returnOnly);
	}
	const { path, params } = DataStore.getValue('location');
	let allparams = clearParams? {} : (params || {});
	allparams = Object.assign(allparams, newparams);
	if ( ! newpath) newpath = path || [];
	let hash = encURI(newpath.join('/'));
	if (yessy(allparams)) {
		let kvs = mapkv(allparams, (k, v) => encURI(k) + "=" + (v === null || v === undefined ? '' : encURI(v)));
		hash += "?" + kvs.join('&');
	}
	let u = '/' + hash;
	if (returnOnly) {
		return u;
	}
	goto(u);
};

const initRouter = () => {
	// Switch DataStore to /page over #page
	// DataStore.useHashPath = false;
	// DataStore.usePathname = true;
	DataStore.localUrl = '/';
	DataStore.parseUrlVars(false); // update the parsing since we've changed the method
	// NB: Catch beforeunload? No - Modern Chrome insists on a user popup for this
	window.addEventListener('popstate', e => {		
		DataStore.parseUrlVars(true);
	});
};

export {A, usePath, goto, modifyPage, initRouter};
