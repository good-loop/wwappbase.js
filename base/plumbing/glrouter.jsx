/**
 * HACK since hookrouter is throwing compile errors, let's DIY the bits we actually need
 */

import React, { Component } from 'react';
import { encURI, mapkv, modifyHash, stopEvent, yessy } from '../utils/miscutils';
import DataStore from './DataStore';

/**
 * Navigate without a page reload. Also scrolls to the page top
 * @param {?string} href 
 * @param {?Object} options
 * @param {?boolean} options.scroll defaults to (0,0). Set `false` (not falsy) for no scroll
 * @returns null
 */
const goto = (href, options={}) => {
	if ( ! href) {
		console.warn("goto: no href");
		return;
	}
	// only pushState of it is a change (otheriwse the browser back button can get stuck on the current page)
	const locn = ""+window.location;
	if (href !== locn) {
		window.history.pushState({}, "", href);
		// update url vars
		DataStore.parseUrlVars(true);
	}
	// scroll to the page top
	if (options && options.scroll==='false') {
		// no scroll
	} else {
		window.scrollTo(0,0);
	}	
};


/** Which is the "open in new tab" modifier key - Ctrl or Meta (Command)? */
const clickModKey = window.navigator.platform.match(/^(Mac|iPhone|iPad|iPod)/) ? 'metaKey' : 'ctrlKey';

/**
 * To use this, set C.A = A;
 * @param {Object} x 
 * @param {string} x.href
 * @returns 
 */
const A = (x) => {
	if (!x) return null;
	const {href, children, onClick, ...args} = x;
	const doClick = e => {
		// Base <a> behaviour (ie open in new tab/window) on middle-, Ctrl- or Command-click
		if (e.shiftKey || e[clickModKey]) return;
		
		// No href means just an anchor tag, not a link - nowhere to navigate to when clicked
		if (!href) return;

		// Don't hijack the navigation event on links to other origins
		if (!href.includes(window.location.origin) && href.startsWith("http")) return;

		stopEvent(e);
		if (onClick) onClick(e);
		// Allow onClick functions to stop our events too
		if (!e.glrouterStopEvent) {
			goto(href);
		}
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

/**
 * Call this to change the routing behaviour from #page to /page
 */
const initRouter = () => {
	// Switch DataStore to /page
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
