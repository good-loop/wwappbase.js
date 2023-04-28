
import { useEffect, useState } from 'react';
import JSend from '../data/JSend';
import C from '../CBase';
import _ from 'lodash';
import PromiseValue from '../promise-value';

import DataClass, {getId, getType, getStatus} from '../data/DataClass';
import { assert, assMatch } from '../utils/assert';
import {parseHash, toTitleCase, is, space, yessy, getUrlVars, decURI, getObjectValueByPath, setObjectValueByPath, stopEvent} from '../utils/miscutils';
import KStatus from '../data/KStatus';
import { modifyPage } from './glrouter';

import DataDiff, { makeDataDiff, mergeDataDiffs } from './DataDiff';

const LOGO_BASE64 = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA3NTMuNzg2IDExNy4xMzY1Ij4KICA8ZyBmaWxsPSIjMWQxZDFiIj4KICAgIDxwYXRoIGQ9Ik0xODcuODQgNTcuMjVoMTUuNDV2MjUuNDZjLTcuMTYgNS4wOC0xNi45NSA3LjgtMjUuOTYgNy44LTE5LjcgMC0zNC4wOC0xMy4yNS0zNC4wOC0zMS45NCAwLTE4LjcgMTQuMzgtMzEuOTUgMzQuNDMtMzEuOTUgMTEuNTcgMCAyMC45MyAzLjk1IDI3LjAyIDExLjI0bC0xMS4xMiAxMEExOS4zNSAxOS4zNSAwIDAwMTc4LjU2IDQxYy0xMC42IDAtMTcuNjUgNi45NC0xNy42NSAxNy41NiAwIDEwLjM1IDcuMDYgMTcuNTUgMTcuNDggMTcuNTVhMjIuMzQgMjIuMzQgMCAwMDkuNDUtMi4wMnoiLz4KICAgIDxwYXRoIGQ9Ik0yNjIuMyA1OC41N2MwLTEwLjYyLTcuMzItMTcuNTUtMTYuNjgtMTcuNTVzLTE2LjY4IDYuOTMtMTYuNjggMTcuNTVjMCAxMC42MiA3LjMyIDE3LjU2IDE2LjY4IDE3LjU2czE2LjY5LTYuOTQgMTYuNjktMTcuNTZtLTUxLjAzIDBjMC0xOC40MyAxNC41Ni0zMS45NSAzNC4zNC0zMS45NXMzNC4zNSAxMy41MiAzNC4zNSAzMS45NS0xNC41NyAzMS45NS0zNC4zNSAzMS45NVMyMTEuMjggNzcgMjExLjI4IDU4LjU3Ii8+CiAgICA8cGF0aCBkPSJNMzM3LjA1IDU4LjU3YzAtMTAuNjItNy4zMy0xNy41NS0xNi42OS0xNy41NS05LjM2IDAtMTYuNjggNi45My0xNi42OCAxNy41NSAwIDEwLjYyIDcuMzIgMTcuNTYgMTYuNjggMTcuNTYgOS4zNyAwIDE2LjY5LTYuOTQgMTYuNjktMTcuNTZtLTUxLjAzIDBjMC0xOC40MyAxNC41Ny0zMS45NSAzNC4zNC0zMS45NSAxOS43OCAwIDM0LjM1IDEzLjUyIDM0LjM1IDMxLjk1cy0xNC41NyAzMS45NS0zNC4zNSAzMS45NWMtMTkuNzcgMC0zNC4zNC0xMy41Mi0zNC4zNC0zMS45NSIvPgogICAgPHBhdGggZD0iTTM5Mi40NiA3NS40MmMxMC41IDAgMTcuNTctNi4yMyAxNy41Ny0xNi44NSAwLTEwLjYyLTcuMDYtMTYuODUtMTcuNTYtMTYuODVoLTExLjA1djMzLjd6bS0yOC41Mi00Ny41N2gyOS4yM2MyMC40OCAwIDM0LjUyIDExLjg1IDM0LjUyIDMwLjcyIDAgMTguODctMTQuMDQgMzAuNzItMzQuNTIgMzAuNzJoLTI5LjIzeiIvPgogIDwvZz4KICA8cGF0aCBmaWxsPSIjMWQxZDFiIiBkPSJNNTEzLjE0IDc1LjUxaDI5LjV2MTMuNzhoLTQ2Ljk4VjI3Ljg1aDE3LjQ4eiIvPgogIDxnIGZpbGw9IiMxZDFkMWIiPgogICAgPHBhdGggZD0iTTU5Ni40NCA1OC41N2MwLTEwLjYyLTcuMzMtMTcuNTUtMTYuNjktMTcuNTUtOS4zNiAwLTE2LjY5IDYuOTMtMTYuNjkgMTcuNTUgMCAxMC42MiA3LjMzIDE3LjU2IDE2LjcgMTcuNTYgOS4zNSAwIDE2LjY4LTYuOTQgMTYuNjgtMTcuNTZtLTUxLjA0IDBjMC0xOC40MyAxNC41Ny0zMS45NSAzNC4zNS0zMS45NXMzNC4zNSAxMy41MiAzNC4zNSAzMS45NS0xNC41NyAzMS45NS0zNC4zNSAzMS45NVM1NDUuNCA3NyA1NDUuNCA1OC41NyIvPgogICAgPHBhdGggZD0iTTY3MS4xOCA1OC41N2MwLTEwLjYyLTcuMzItMTcuNTUtMTYuNjgtMTcuNTVzLTE2LjcgNi45My0xNi43IDE3LjU1YzAgMTAuNjIgNy4zMyAxNy41NiAxNi43IDE3LjU2IDkuMzYgMCAxNi42OC02Ljk0IDE2LjY4LTE3LjU2bS01MS4wMyAwYzAtMTguNDMgMTQuNTctMzEuOTUgMzQuMzUtMzEuOTUgMTkuNzcgMCAzNC4zNCAxMy41MiAzNC4zNCAzMS45NXMtMTQuNTcgMzEuOTUtMzQuMzQgMzEuOTVjLTE5Ljc4IDAtMzQuMzUtMTMuNTItMzQuMzUtMzEuOTUiLz4KICAgIDxwYXRoIGQ9Ik03MzYuMTMgNTAuNThjMC01LjctMy42My05LjA0LTEwLjg3LTkuMDRoLTkuNzF2MThoOS43MWM3LjI1IDAgMTAuODctMy4zNCAxMC44Ny04Ljk2bTE3LjY2IDBjMCAxMy45NS0xMC42IDIyLjY0LTI3LjQ2IDIyLjY0aC0xMC43OFY4OS4zaC0xNy40OFYyNy44NWgyOC4yNmMxNi44NiAwIDI3LjQ2IDguNjkgMjcuNDYgMjIuNzMiLz4KICA8L2c+CiAgPHBhdGggZmlsbD0iIzFkMWQxYiIgZD0iTTQ0Mi41MyA0OC42N2gzMi43MnYxOC4xMmgtMzIuNzJ6Ii8+CiAgPHBhdGggZmlsbD0iI2FmMjAwOSIgZD0iTTkzLjgzIDExLjM5YzEuODEgOC40LS45NyAxOS4yMy00LjA0IDI1LjI2YTY3LjQyIDY3LjQyIDAgMDEtOC40NCAxMi41Yy0xLjA2IDEuMjYtMi4xNSAyLjUtMy4yNiAzLjcyYTQ4Ljc0IDQ4Ljc0IDAgMDEtMS4zNS00LjExYy0xLjE0IDEuNC0yLjM0IDIuODItMy42NiA0LjI4YTQ2LjA4IDQ2LjA4IDAgMDAyLjMgNi4yNWMxLjU3IDMuNCA0LjM1IDkuNiA4LjQ3IDEwLjU0IDEuNTUuMzUgMi45NC0uNjEgMy44OC0zLjc3YTIyLjg5IDIyLjg5IDAgMDAuNjUtMy4wNSAzLjEyIDMuMTIgMCAwMTMuNjQtMi44MiA0LjU4IDQuNTggMCAwMTEuMzYuMzQgNC4yNCA0LjI0IDAgMDEyLjY4IDQuNTkgMTguNDIgMTguNDIgMCAwMS0yLjcyIDcuNDNjLTMgNC41Ni03LjkgNi40NS0xMi44NSA0LjY3YTE2LjA1IDE2LjA1IDAgMDEtNi4xMy00LjE2Yy0zLjI3LTMuNDQtNS40My03Ljg1LTcuMDgtMTIuMjQtLjE3LS40NC0uMzEtLjg5LS40Ny0xLjMzLTEuMiAxLjE3LTIuMzkgMi4zLTMuNTQgMy40YTQ5LjggNDkuOCAwIDAwMS42MSAzLjVjLTEuMTMgMS4xMy0yLjI4IDIuMjYtMy4zNyAzLjRhMjA0LjggMjA0LjggMCAwMC02LjQgNi45IDQ3LjE0IDQ3LjE0IDAgMDAtMy43LTIuOTJMNDcuODIgNzdhMzAuODQgMzAuODQgMCAwMTguNjMgOS43MyAyMy45NiAyMy45NiAwIDAxMS45NiA0LjQ0YzIuOTcgOS4yNy0uMiAyMS41Ni05LjkgMjUuMDNhNTkuNDUgNTkuNDUgMCAwMDEwLjQuOTQgNTguNSA1OC41IDAgMDAzNC45LTEwNS43NSIvPgogIDxwYXRoIGZpbGw9IiM3NzBmMDAiIGQ9Ik03NS41IDQzLjQ1YTc0LjYzIDc0LjYzIDAgMDAzLjQtNC4zNGM0LjM3LTYuMSA3LjE1LTEyLjU2IDcuMjYtMjAuMi4wNi0zLjUyLS42Ny05LjA0LTMuNjgtMTAuNDVhNC43NyA0Ljc3IDAgMDAtNC4zLjRjLS4xMy4wNi0uMjUuMTUtLjM3LjIyLTYuNiAzLjczLTcuMzMgMTUuMDItNy40NyAyMS41LS4wNiAyLjUuMDMgNS4wMi4yMSA3LjU0YTMuNDcgMy40NyAwIDAwLjA0LjY3IDcxLjIgNzEuMiAwIDAwMi40OSAxNC4yNWMxLjMxLTEuNDYgMi41Mi0yLjg4IDMuNjYtNC4yOHEtLjc1LTIuNjItMS4yNC01LjMxIi8+CiAgPHBhdGggZmlsbD0iIzc3MGYwMCIgZD0iTTUwLjg5IDczLjM5cS0xLjA2LS43NS0yLjE0LTEuNDdjMS40OC0xLjY5IDIuOTgtMy4zMyA0LjQyLTQuODggMi43Mi0yLjkyIDUuNTctNS43NSA4LjQzLTguNTkuMjYuOC41NCAxLjU5LjgzIDIuMzcuMjYuNjkuNTUgMS4zOC44NCAyLjA2bDMuNTUtMy4zOUE4NS43NyA4NS43NyAwIDAxNjIuOCA0MC4zYy0xLTkuNzEtLjc2LTIwLjQ1IDMuNS0yOS4zNGEyMS43NiAyMS43NiAwIDAxNi4yMy03LjY4IDE3LjkxIDE3LjkxIDAgMDExLjg0LTEuMjNBNTguOTcgNTguOTcgMCAwMDAgNTguNTdhNTguNDcgNTguNDcgMCAwMDI5LjE3IDUwLjU0Yy00LjQzLTguMTMtLjctMTkuNDUgNS42NS0yNS42bDEuMDYtLjk4YTMxLjcxIDMxLjcxIDAgMDEzLjQ4IDIuNTNjLjg4LS45MSAxLjgzLTEuODYgMi44NC0yLjgzYTEwMy43OCAxMDMuNzggMCAwMC02LjM2LTQuNjVjLTIuOS0xLjk1LTUuOTgtMy45NC04LjI2LTYuNjMtNy4xMi04LjM4LTguMDItMjIuMTItMS4wNi0zMC44NWExOS45NCAxOS45NCAwIDAxMi0yLjE5IDE2LjQgMTYuNCAwIDAxMTEuNzItNC42NmM2LjA3LjE0IDExLjk4IDMuNzQgMTUuNjggOS41NEEzLjU2IDMuNTYgMCAwMTU0LjU2IDQ4YTQuNjEgNC42MSAwIDAxLTEuNDIuNTQgMy44IDMuOCAwIDAxLTQuMDktMS43NmMtMy4xNy00Ljk3LTguMzktNi45OC0xMi44Ni00LjYzYTExLjEgMTEuMSAwIDAwLTMuNyAzLjIzbC0uMzYuNTRjLTQuMDQgNS45Ny0yLjk0IDE0LjY0IDEuNTcgMjAgMy43OCA0LjQ5IDkuMDQgNy40NCAxMy44NCAxMC44NGwuMjkuMjQgMy41Ny0zLjIzLS41MS0uMzgiLz4KICA8cGF0aCBmaWxsPSIjYWYyMDA5IiBkPSJNMzkuMzYgODUuMDZhMTkuNiAxOS42IDAgMDEyLjU0IDIuNWMuMTEuMTQtMi44OCAzLjIzLTMuMTggMy42YTE1LjcxIDE1LjcxIDAgMDAtMyA1Ljk2Yy0xLjAxIDQuMDctLjIgOS42MiAzLjkgMTEuNzggNi4yNyAzLjMgMTIuMjItNC4zMiAxMi4wMS0xMC40NC0uMTgtNS4zNS0yLjE2LTEwLjI4LTYuMjMtMTMuNjYtMS4wNy0uODktMi4xMy0xLjc0LTMuMi0yLjU4LTEgLjk4LTEuOTYgMS45Mi0yLjg0IDIuODMiLz4KPC9zdmc+Cg==";

/**
 * Hold data in a simple json tree, and provide some utility methods to update it - and to attach a listener.
 * E.g. in a top-of-the-app React container, you might do `DataStore.addListener((mystate) => this.setState(mystate));`
 */
class Store {
	
	callbacks = [];

	/** HACK: charcter to start a local path # or /  */
	localUrl = '#';

	constructor() {
		// init the "canonical" categories
		this.appstate = {
			// published data items
			data:{},
			// draft = draft, modified, and pending
			draft:{},
			trash:{},
			/**
			 * What are you looking at?
			 * This is for transient focus. It is NOT for navigation parameters
			 *  -- location and getUrlValue() are better for navigational focus.
			*/
			focus:{},
			/** e.g. form settings */
			widget:{},
			/**
			 * nav state, stored in the url (this gives nice shareable deep-linking urls)
			 */
			location:{},
			/** browser environment */
			env:{},
			misc:{},
			/** YouAgain share info */
			shares:{}
		};
		// init url vars
		this.parseUrlVars();
		// and listen to changes
		window.addEventListener('hashchange', () => {
			// console.log("DataStore hashchange");
			// NB: avoid a loopy call triggered from setUrlValue()
			// NB: `updating` can be true from other updates ??
			this.parseUrlVars( ! this.updating);
			return true;
		});
		this.initDebugLogging();
	}

	initDebugLogging () {
		const ogLog = console.log;
		const welcomeStyle = `font-size:50px; font-weight:bold; padding-bottom:30px; padding-left:30px;
				color: #fff;
  				text-shadow: -4px 4px #ef3550,
					-8px 8px #f48fb1,
					-12px 12px #7e57c2,
					-16px 16px #2196f3,
					-20px 20px #26c6da,
					-24px 24px #43a047,
					-28px 28px #eeff41,
					-32px 32px #f9a825,
					-36px 36px #ff5722;
				background: linear-gradient(to right, #ef5350, #f48fb1, #7e57c2, #2196f3, #26c6da, #43a047, #eeff41, #f9a825, #ff5722);`;
		//https://good-loop.com/img/logo/good-loop-logo-text.svg
		const logoStyle = 'background-image:url(' + LOGO_BASE64 + '); font-size:50px; color:rgba(0,0,0,0); background-position:center; background-repeat: no-repeat;';
		if (this._debug) ogLog("%c GOOD-LOOP%c\n%cfancy debug", logoStyle, '', welcomeStyle);
		//console.meme("I am in", "the Good-Loop debug console", "https://i.kym-cdn.com/photos/images/newsfeed/001/913/858/3d4.png", 680, 383)
		console.log = (...m) => {
			if (DataStore._debug) {
				const err = new Error("Debug");
				let stack = err.stack?.split("\n");
				stack.splice(1, 1); // Remove the reference to this function N.B: can't remove "Error" line without console not linking src correctly
				stack = stack.join("\n");
				const stackRegex = /at ((\w*)\.)?(.*) \((.*)\.js:[0-9]+:[0-9]+\)/m
				const [,,className,funcName] = stack?.match(stackRegex);
				// Include/Exclude by class and function (either-or)
				if (this._include && this._include.length) {
					if (!this._include.includes(className) && !this._include.includes(funcName)) return;
				}
				if (this._exclude && this._exclude.length) {
					if (this._exclude.includes(className) || this._exclude.includes(funcName)) return;
				}
				console.groupCollapsed("%c["+(className?className+":":"")+funcName+"]", "color:blue", ...m);
				ogLog(stack);
				console.groupEnd();
			}
		};
	}
	
	/**
	 * Keep navigation state in the url, after the hash, so we have shareable urls.
	 * To set a nav variable, use setUrlValue(key, value);
	 * 
	 * Stored as location: { path: String[], params: {key: value} }
	 * @param {?boolean} update Set false to avoid updates (e.g. in a loopy situation)
	 */
	parseUrlVars(update) {
		// Is path pre or post hash?
		let {path, params} = this.parseUrlVars2();
		// peel off eg publisher/myblog
		let location = {};
		location.path = path;
		let page = path? path[0] : null;
		location.page = page;
		if (path.length > 2) location.slug = path[1];
		if (path.length > 3) location.subslug = path[2];
		location.params = params;
		this.parseDebugOptions(params);
		this.setValue(['location'], location, update);
	}

	parseDebugOptions (params) {
		this._debug = params["gl.debug"] || params["debug"];
		this._stackTrace = params["gl.stacktrace"] || params["stacktrace"];
		this._include = params["gl.include"] || params["include"];
		this._exclude = params["gl.exclude"] || params["exclude"];
	}
	
	parseUrlVars2() {
		if (this.localUrl !== '/') {
			return parseHash();
		}
		const params = getUrlVars();
		let pathname = window.location.pathname;
		// HACK chop .html
		if (pathname.endsWith(".html")) pathname = pathname.substring(0, pathname.length-5);
		let path = pathname.length ? pathname.split('/').map(decURI) : [];				
		// HACK fish out key=value bits
		path = path.filter(bit => {
			if ( ! bit) return false;
			if (bit==="index") { // HACK: /index.html isn't part of the path
				return false;
			}
			let eqi = bit.indexOf("=");
			if (eqi===-1) return true;
			params[bit.substring(0, eqi)] = bit.substring(eqi+1);
			return false;
		});
		return {path, params};
	}


	/**
	 * Set a key=value in the url for navigation. This modifies the window.location and DataStore.appstore.location.params, and does an update.
	 * @param {String} key
	 * @param {?string|boolean|number|Date} value
	 * @returns {String} value
	 */
	setUrlValue(key, value, update) {
		assMatch(key, String);
		if (value instanceof Date) {
			value = value.toISOString();
		}
		if (value) assMatch(value, "String|Boolean|Number");
		// the modifyPage hack is in setValue() so that PropControl can use it too
		return this.setValue(['location', 'params', key], value, update);
	}


	/**
	 * Get a parameter setting from the url. Convenience for appstate.location.params.key. This is to match setUrlValue.
	 * See also getValue('location','path') for the path.
	 * Use `getValue('location','params')` for all the url parameters
	 * @param {String} key
	 * @returns {?string}
	 */
	getUrlValue(key) {
		assMatch(key, String);
		return this.getValue(['location', 'params', key]);
	}


	/**
	 * It is a good idea to wrap your callback in _.debounce()
	 */
	addListener(callback) {
		this.callbacks.push(callback);
	}


	/**
	 * Update and trigger the on-update callbacks.
	 * @param newState {?Object} This will do an overwrite merge with the existing state.
	 * Note: This means you cannot delete/clear an object using this - use direct modification instead.
	 * Can be null, which still triggers the on-update callbacks.
	 * @returns {boolean} `true` for convenience - can be chained with &&
	 */
	update(newState) {
		// set a flag to detect update loops
		const loopy = this.updating;
		this.updating = true;
		try {
			// merge in the new state
			if (newState) {
				_.merge(this.appstate, newState);
			}
			if (loopy) {
				console.log("DataStore.js update - nested call - deferred", new Error());
				_.defer(() => this.update()); // do the callbacks (again) once we exit the loop
				return;
			}
			// callbacks (e.g. React render)
			this.callbacks.forEach(fn => fn(this.appstate));
		} finally {
			this.updating = false;
		}
		return true; // can be chained with &&
	} // ./update

	/**
	 * Convenience for getting from the data sub-node (as opposed to e.g. focus or misc) of the state tree.
	 * 
	 * Warning: This does NOT load data from the server.
	 * @param statusTypeIdObject -- backwards compatible update to named params
	 * @param {!KStatus} status 
	 * @param type {!C.TYPES}
	 * @param {!String} id 
	 * @returns a "data-item", such as a person or document, or undefined.
	 */
	getData(statusTypeIdObject, type, id) {
		// HACK to allow old code for getData(status, type, id) to still work - May 2019
		if (statusTypeIdObject.type) type = statusTypeIdObject.type;
		else {
			console.warn("DataStore.getData - old inputs - please upgrade to named {status, type, id}", statusTypeIdObject, type, id);
		}
		if (statusTypeIdObject.id) id = statusTypeIdObject.id;
		// First arg may be status - but check it's valid & if not, fill in status from item object
		let status = statusTypeIdObject.status || statusTypeIdObject;
		if (!status || !KStatus.has(status)) status = getStatus(item);
		// end hack

		assert(KStatus.has(status), "DataStore.getData bad status: "+status);
		if ( ! C.TYPES.has(type)) console.warn("DataStore.getData bad type: "+type);
		assert(id, "DataStore.getData - No id?! getData "+type);
		const s = this.nodeForStatus(status);
		let item = this.getValue([s, type, id]);
		return item;
	}


	/**
	 * @param {Object} p
	 * @param {KStatus} p.status
	 * @param {!String} p.type
	 * @param {!Object} p.item
	 * @param {?Boolean} p.update
	 */
	setData(statusTypeItemUpdateObject, item, update = true) {
		assert(statusTypeItemUpdateObject, "setData - no path input?! "+statusTypeItemUpdateObject, item);
		// HACK to allow old code for setData(status, item, update = true) to still work - May 2019
		if (statusTypeItemUpdateObject.item) item = statusTypeItemUpdateObject.item;
		else {
			console.warn("DataStore.setData - old inputs - please upgrade to named {status, item, update}", statusTypeItemUpdateObject, item);
		}
		if (statusTypeItemUpdateObject.update !== undefined) update = statusTypeItemUpdateObject.update;
		// First arg may be status - but check it's valid & if not, fill in status from item object
		let status = statusTypeItemUpdateObject.status || statusTypeItemUpdateObject;
		if (!status || !KStatus.has(status)) status = getStatus(item);
		// end hack
		
		assert(item && getType(item) && getId(item), item, "DataStore.js setData()");
		assert(C.TYPES.has(getType(item)), item);
		
		const path = this.getPathForItem(status, item);
		this.setValue(path, item, update);
	}


	/**
	 * the DataStore path for this item, or null if item is null;
	 */
	getPathForItem(status, item) {
		if ( ! status || status === KStatus.ALL_BAR_TRASH ) status = getStatus(item); // ALL_BAR_TRASH has no node
		console.log("STATUS FOR " + getType(item)+":"+getId(item) + ":", status);
		assert(KStatus.has(status), "DataStore.getPath bad status: "+status);
		if ( ! item) {
			return null;
		}
		return this.getDataPath({status, type:getType(item), id:getId(item)});
	}


	/**
	 * the DataStore path for this item, or null if item is null. 
	 * You can pass in an item as all the args (but not if it uses `domain` as a prop!)
	 *  -- But WARNING: editors should always use status DRAFT
	 * @param {Object} p
	 * @param {KStatus} p.status
	 * @param {!C.TYPES} p.type 
	 * @param {!String} p.id 
	 * @param {?String} p.domain Only used by Profiler??
	 * @returns {String[]}
	 */
	getDataPath({status, type, id, domain, ...restOfItem}) {
		if ( ! KStatus.has(status)) {
			console.warn("DataStore.getPath bad status: "+status+" (treat as DRAFT)");
			status=KStatus.DRAFT;
		}
		if ( ! type) type = getType(restOfItem);
		assert(C.TYPES.has(type), "DataStore.js bad type: "+type);
		assMatch(id, String, "DataStore.js bad id "+id);
		const s = this.nodeForStatus(status);
		if (domain) {
			return [s, domain, type, id];
		} else {
			return [s, type, id];
		}
	}
	
	getDataPathClean({status, type, id, domain, ...restOfItem}) {
		let path = getDataPath({status, type, id, domain, ...restOfItem});
		return this.getCleanFromPath(path);
	}

	getCleanFromPath(path) {
		assert(this.isDataPath(path), "getCleanFromPath not a data path?? "+path);
		if (path[1] === 'clean') return path;
		let newPath = [...path];
		newPath.splice(1, 0, 'clean');
		return newPath;
	}

	isDataPath(path) {
		assert(_.isArray(path));
		if (path.length < 3) return false;
		if (path[0] !== 'draft' && path[0] !== 'data') return false;
		if (!C.TYPES.has(path[1])) return false;
		return true; // as far as we can tell
	}

	/**
	 * Get the details of a data item from it's full path
	 * @param {String[]} path 
	 * @returns {Object} { status, type, id, proppath }
	 */
	breakdownDataPath(path) {
		assert(this.isDataPath(path), "breakdownDataPath not a data path??", path);
		let proppath = [...path];
		const details = proppath.splice(0, 3);
		return {status:details[0], type:details[1], id:details[2], proppath};
	}

	/**
	 * The draft DataStore path for this item, or null if item is null. This is a convenience for `getDataPath(status:DRAFT, type, id)`.
	 * 
	 * NB: It does NOT support `domain` sharded items.
	 * 
	 * @param type {!C.TYPES}
	 * @param id {!String}
	 * @returns {String[]}
	 */
	getDataPathDraft(item) {
		return getDataPath({status:KStatus.DRAFT, type:getType(item), id:getId(item)});
	}


	/**
	 * @deprecated switch to getDataPath()
	 * the DataStore path for this item, or null if item is null;
	 */
	getPath(status, type, id, domain) {
		console.warn("DataStore.getPath() - Please switch to getDataPath({status, type, id, domain})", status, type, id, domain);
		return this.getDataPath({status, type, id, domain});
	}


	/**
	 * @returns {String} the appstate.X node for storing data items of this status.
	 */
	nodeForStatus(status) {
		assert(KStatus.has(status), "DataStore bad status: "+status);
		switch(status) {
			case KStatus.PUBLISHED: case KStatus.PUB_OR_ARC: // Hack: locally keep _maybe_archived with published
				return 'data';
			case KStatus.DRAFT: case KStatus.MODIFIED: case KStatus.PENDING: case KStatus.REQUEST_PUBLISH: case KStatus.ARCHIVED:
			case KStatus.PUB_OR_DRAFT: // we can't be ambiguous on where to store
				return 'draft';
			case KStatus.TRASH: return 'trash';
		}
		throw new Error("DataStore - odd status "+status);
	}


	getValue(...path) {
		assert(_.isArray(path), "DataStore.getValue - "+path);
		// If a path array was passed in, use it correctly.
		if (path.length===1 && _.isArray(path[0])) {
			path = path[0];
		}
		assert(this.appstate[path[0]],
			"DataStore.getValue: "+path[0]+" is not a json element in appstate - As a safety check against errors, the root element must already exist to use getValue()");
		let result = getObjectValueByPath(this.appstate, path);
		return result;
	}

	/**
	 * Update a single path=value.
	 * 
	 * Unlike update(), this can set {} or null values.
	 * 
	 * It also has a hack, where edits to [data, type, id, ...] (i.e. edits to data items) will
	 * also set the modified flag, [transient, type, id, localStatus] = dirty.
	 * This is a total hack, but handy.
	 * 
	 * @param {String[]} path This path will be created if it doesn't exist (except if value===null)
	 * @param {*} value The new value. Can be null to null-out a value.
	 * @param {boolean} update Set to false to switch off sending out an update. Set to true to force an update even if it looks like a no-op.
	 * @param {?boolean} mergeAll INTERNAL for when we want to ignore fancy merging in history diffs (e.g. undos)
	 * undefined is true-without-force
	 * @returns value
	 */
	// TODO handle setValue(pathbit, pathbit, pathbit, value) too
	setValue(path, value, update, mergeAll) {
		assert(_.isArray(path), "DataStore.setValue: "+path+" is not an array.");
		assert(this.appstate[path[0]],
			"DataStore.setValue: "+path[0]+" is not a node in appstate - As a safety check against errors, the root node must already exist to use setValue()");
		// console.log('DataStore.setValue', path, value);
		if (path[path.length-1] === this._debugProp || "/"+path.join("/") === this._debugPath)
			console.log("[DataStore DEBUG] setValue", path, value, new Error());
		const oldVal = this.getValue(path);
		if (oldVal === value && update !== true && ! _.isObject(value)) {
			// The no-op test only considers String and Number 'cos in place edits of objects are common and would cause problems here.
			// console.log("setValue no-op", path, value, "NB: beware of in-place edits - use update=true to force an update");
			return oldVal;
		}

		// DEBUG: log data/draft edits
		if (window.DEBUG && (path[0]==='draft' || path[0]==='data')) {
			console.log("DataStore.setValue", path, value, update, new Error("stacktrace"));
		}

		// HACK: modify the url?
		if (path[0] === 'location' && path[1] === 'params') {
			let newParams;
			assert(path.length === 3 || (path.length===2 && _.isObject(value)), "DataStore.js - path should be location.params.key was: "+path);
			if (path.length==3) {
				newParams = {};
				newParams[path[2]] = value;
			} else {
				newParams = value;
			}
			modifyPage(null, newParams);
		}

		// Do the set!
		setObjectValueByPath(this.appstate, path, value);

		// HACK: update a data value => mark it as modified
		// ...but not for setting the whole-object (path.length=3)
		// // (off?) ...or for value=null ??why? It's half likely that won't save, but why ignore it here??
		if (path[0] === 'data') console.warn("Modifying published property?? Won't register changes or save correctly!"); // let's not add a whole lot of logic for tracking changes to values that shouldn't be changed
		else if (path[0] === 'draft' && path.length > 3)
		{
			// chop path down to [data, type, id]
			const itemPath = path.slice(0, 3);
			const item = this.getValue(itemPath);
			if (DataStore.DATA_MODIFIED_PROPERTY) {
				if (getType(item) && getId(item)) {
					this.setLocalEditsStatus(getType(item), getId(item), C.STATUS.dirty, false);
				}
			}
			const trackers = DataDiff.getHistoryTrackers();
			if (DataDiff.DATA_LOCAL_DIFF_PROPERTY && trackers.length > 0) {
				if (getType(item) && getId(item)) {
					// Get path to just prop
					const propPath = path.slice(3, path.length);
					// Create history diff object for change
					const diff = makeDataDiff(propPath, oldVal, value);
					DataDiff.registerDataChange(getType(item), getId(item), diff, mergeAll, false);
				}
			}
		}
		// Tell e.g. React to re-render
		if (update !== false) {
			// console.log("setValue -> update", path, value);
			this.update();
		}
		return value;
	} // ./setValue()


	/**
	 * Convenience for getValue() || setValue(). It's like java's Map.putIfAbsent()
	 * @param {!string[]} path 
	 * @param {Object} value Set this IF there is no value already
	 * @param {?boolean} update 
	 * @returns the value
	 */
	setValueIfAbsent(path, value, update) {
		let v = this.getValue(path);
		if (v) return v;
		return this.setValue(path, value, update);
	}

	/**
	 * Has a data item been modified since loading?
	 * @param {string} type
	 * @param {string} id
	 * @returns {?string} "dirty", "clean", etc. -- see C.STATUS
	 */
	getLocalEditsStatus(type, id) {
		assert(C.TYPES.has(type), "DataStore.getLocalEditsStatus "+type);
		assert(id, "DataStore.getLocalEditsStatus: No id?! getData "+type);
		return this.getValue('transient', type, id, DataStore.DATA_MODIFIED_PROPERTY);
	}


	/**
	 * Has a data item been modified since loading?
	 * @param {C.TYPES} type
	 * @param {!String} id
	 * @param {C.STATUS} status loading clean dirty saving
	 * @param {?boolean} update Request a react rerender
	 * @return "dirty", "clean", etc. -- see C.STATUS
	 */
	setLocalEditsStatus(type, id, status, update) {
		assert(C.TYPES.has(type));
		assert(C.STATUS.has(status));
		assert(id, "DataStore.setLocalEditsStatus: No id?! getData "+type);
		if ( ! DataStore.DATA_MODIFIED_PROPERTY) return null;
		if (C.STATUS.issaveerror(status)) {
			console.log("ITEM "+type+":"+id+" IS BECOMING "+status+" OHHH YEAAAHH");
		}
		return this.setValue(['transient', type, id, DataStore.DATA_MODIFIED_PROPERTY], status, update);
	}

	/**
	 * @param {!String[]} path - the full path to the value being edited
	 * @returns {boolean} true if this path has been modified by a user-edit to a PropControl
	 */
	isModified(path) {
		const mpath = ['widget', 'modified'].concat(path);
		return this.getValue(mpath);
	}


	/**
	 * Has a path in DataStore been modified by the user? This is auto-set by PropControl -- NOT by DataStore.
	 * So if you use this with non-PropControl edits -- you must call it yourself.
	 * 
	 * Use-case: for business-logic that sets default values, so it can tell whether or not the user has made an edit.
	 * 
	 * @param {!String[]} path - the full path to the value being edited
	 * @param {?boolean} flag Defaults to true
	 * @see #setLocalEditsStatus() which is for ajax state
	 */
	setModified(path, flag=true) {
		// NB: dont trigger a render for this semi-internal state edit
		try {
			this.setValue(['widget', 'modified'].concat(path), flag, false);
		} catch(err) {
			// propcontrols that operate on "complex" json objects can lead to:
			// TypeError: Cannot create property 'country' on boolean 'true'
			// ignore
			console.log("(swallow) PropControl.setModified fail: "+err);
		}		
	}


	/**
	* Set widget.thing.show
	 * @param {String} thing The name of the widget.
	 * @param {Boolean} showing
	 */
	setShow(thing, showing) {
		assMatch(thing, String);
		this.setValue(['widget', thing, 'show'], showing);
	}


	/**
	 * Convenience for widget.thing.show
	 * @param {String} widgetName
	 * @returns {boolean} true if widget is set to show
	 */
	getShow(widgetName) {
		assMatch(widgetName, String);
		return this.getValue('widget', widgetName, 'show');
	}


	/**
	* Set focus.type Largely @deprecated by url-values (which give deep-linking)
	* @param {!C.TYPES} type
	 * @param {?String} id
	 */
	setFocus(type, id) {
		assert(C.TYPES.has(type), "DataStore.setFocus");
		assert( ! id || _.isString(id), "DataStore.setFocus: "+id);
		this.setValue(['focus', type], id);
	}


	/**
	 * Largely @deprecated by url-values (which give deep-linking)
	 */
	getFocus(type) {
		assert(C.TYPES.has(type), "DataStore.getFocus");
		return this.getValue('focus', type);
	}


	/**
	 * Get hits from the cargo, and store them under data.type.id
	 * @param {*} res
	 * @returns {Item[]} hits, can be empty
	 */
	updateFromServer(res, status) {
		console.log("updateFromServer", res);
		// must be bound to the store
		assert(this && this.appstate, "DataStore.updateFromServer: Use with .bind(DataStore)");
		let hits = res.hits || (JSend.data(res) && JSend.data(res).hits); // unwrap cargo
		if ( ! hits && JSend.isa(res) && JSend.data(res)) {
			hits = [JSend.data(res)]; // just the one?
		}
		if ( ! hits) return [];
		hits.forEach(item => {
			try {
				const type = getType(item);
				if ( ! type) {
					console.log("skip server object w/o type", item);
					return;
				}
				assert(C.TYPES.has(type), "DataStore.updateFromServer: bad type:" + type, item);
				const s = status || getStatus(item);
				assert(s, "DataStore.updateFromServer: no status in method call or item", item);
				const statusPath = this.nodeForStatus(s);
				const id = getId(item);
				assert(id, 'DataStore.updateFromServer: no id for', item, 'from', res);
				// Put the new item in the store, but don't trigger an update until all items are in.
				this.setValue([statusPath, type, id], item, false);
				// mark it as clean 'cos the setValue() above might have marked it dirty
				this.setLocalEditsStatus(type, id, C.STATUS.clean, false);
			} catch(err) {
				// swallow and carry on
				console.error(err);
			}
		});
		// OK, now trigger a redraw.
		this.update();
		return hits;
	} //./updateFromServer()

	/**
	 * get local, or fetch by calling fetchFn (but only once).
	 * Does not call update here and now, so it can be used inside a React render().
	 * 
	 * Warning: This will not modify appstate except for the path given, and transient.
	 * So if you fetch a list of data items, they will not be stored into appstate.data.
	 * The calling method should do this.
	 * NB: an advantage of this is that the server can return partial data (e.g. search results)
	 * without over-writing the fuller data.
	 * 
	 * @param {Object} p
	 * @param {!String[]} p.path
	 * @param {!Function} p.fetchFn () -> Promise/value, which will be wrapped using promise-value.
	 * fetchFn MUST return the value for path, or a promise for it. It should NOT set DataStore itself.
	 * As a convenience hack, this method will use `JSend` to extract `data` or `cargo` from fetchFn's return, so it can be used
	 * that bit more easily with Winterwell's "standard" json api back-end.
	 * If unset, the call will return an inprogress PV, but will not do a fresh fetch.
	 * @param {?Object} p.options
	 * @param {?Number} p.options.cachePeriod milliseconds. Normally unset. If set, cache the data for this long - then re-fetch.
	 * 	During a re-fetch, the old answer will still be instantly returned for a smooth experience.
	 * 	NB: Cache info is stored in `appstate.transient.fetchDate...`
	 * @param {?Boolean} p.options.localStorage
	 * @returns {!PromiseValue} (see promise-value.js)
	 */
	fetch(path, fetchFn, options, cachePeriod) { // TODO allow retry after 10 seconds
		if ( ! options) options = {};
		// backwards compatability Feb 2021
		if (typeof(options)==="number") {
			cachePeriod = options;
			options = {};
		}
		if (typeof(options)==="boolean") {
			options = {};
		}
		if (cachePeriod) {
			options.cachePeriod = cachePeriod; 
		}
		// end backwards compatability
		assert(path, "DataStore.js - missing input",path);

		// in the store?
		let item = this.getValue(path);
		if (item!==null && item!==undefined) {
			// out of date?
			if (options.cachePeriod) {
				if (options.cachePeriod < 1000) { // quietly avoid too short caches
					options.cachePeriod = 1000;
				}
				const now = new Date();
				const epath = ['transient', 'fetchDate'].concat(path);
				let fetchDate = this.getValue(epath);
				if ( ! fetchDate || fetchDate.getTime() < now.getTime() - options.cachePeriod) {
					// fetch a fresh copy
					// NB this bit can get called repeatedly whilst the response loads - which is fine 'cos fetch2() handles that. 
					const pv = this.fetch2(path, fetchFn, options.cachePeriod);
					// ...but (unless fetchFn returned instantly - which is unusual) carry on to return the cached value instantly
					if (pv.resolved) {
						return pv;
					}
				}
			}
			// Note: falsy or an empty list/object is counted as valid. It will not trigger a fresh load
			return new PromiseValue(item);
		}
		// Fetch it
		return this.fetch2(path, fetchFn, options.cachePeriod);
	} // ./fetch()


	/**
	 * Does the remote fetching work for fetch(). 
	 * Can be called repeatedly, and it will cache and return the same PromiseValue.
	 * @param {String[]} path
	 * @param {Function} fetchFn () => promiseOrValue or a PromiseValue. If `fetchFn` is unset (which is unusual), return in-progress or a failed PV.
	 * @param {?Number} cachePeriod
	 * @returns {!PromiseValue}
	 */
	fetch2(path, fetchFn, cachePeriod) {
		// only ask once
		const fpath = ['transient', 'PromiseValue'].concat(path);
		const prevpv = this.getValue(fpath);
		if (prevpv) {
			return prevpv;
		}
		if ( ! fetchFn) {
			return new PromiseValue(null); // nothing in-progress, so return a reject PV
		}
		let promiseOrValue = fetchFn();
		assert(promiseOrValue!==undefined, "fetchFn passed to DataStore.fetch() should return a promise or a value. Got: undefined. Missing return statement?");
		// Use PV to standardise the output from fetchFn()
		let pvPromiseOrValue = promiseOrValue instanceof PromiseValue? promiseOrValue : new PromiseValue(promiseOrValue);
		// pvPromiseOrValue.name = "pvPromiseOrValue_"+JSON.stringify(path); // DEBUG HACK
		// process the result async
		let promiseWithCargoUnwrap = pvPromiseOrValue.promise.then(res => {
			if ( ! res) return res;
			// HACK handle WW standard json wrapper: unwrap cargo
			// NB: success/fail is checked at the ajax level in ServerIOBase
			// TODO let's make unwrap a configurable setting
			if (JSend.isa(res)) {
				// console.log("unwrapping cargo to store at "+path, res);
				res = JSend.data(res) || res; // HACK: stops login widget forcing rerender on each key stroke
			}
			return res;
		}).catch(response => {
			// what if anything to do here??
			console.warn("DataStore fetch fail", path, response);
			// BV: Typically ServerIO will call notifyUser
			throw response;
		});
		// wrap this promise as a PV
		const pv = new PromiseValue(promiseWithCargoUnwrap);
		// pv.name = "pv_"+JSON.stringify(path); // DEBUG HACK
		pv.promise.then(res => {
			// set the DataStore
			// cache-period? then store the fetch time
			if (cachePeriod) {
				const epath = ['transient', 'fetchDate'].concat(path);
				this.setValue(epath, new Date(), false);
			}
			// This is done after the cargo-unwrap PV has resolved. So any calls to fetch() during render will get a resolved PV
			// even if res is null.
			this.setValue(path, res); // this should trigger an update (typically a React render update)
			// finally, clear the promise from DataStore
			this.setValue(fpath, null, false);
			return res;
		}).catch(res => {
			// keep the fpath promise to avoid repeated ajax calls??
			// update e.g. React
			this.update();
			throw res;
		});
		this.setValue(fpath, pv, false);
		return pv;
	} // ./fetch2()

	/**
	 * Remove any list(s) stored under ['list', type].
	 * 
	 * These lists are often cached results from the server - this method is called to invalidate the cache
	 * (and probably force a reload via other application-level code).
	 * 
	 * If more fine-grained control is provided, just call `setValue(['list', blah], null);` directly.
	 */
	invalidateList(type) {
		assMatch(type, String);
		const listWas = this.getValue(['list', type]);
		if (listWas) {
			this.setValue(['list', type], null);
			console.log('publish -> invalidate list', type, listWas);
		} else {
			console.log('publish -> no lists to invalidate');
		}
		// also remove any promises for these lists -- see fetch()
		let ppath = ['transient', 'PromiseValue', 'list', type];
		this.setValue(ppath, null, false);
	}

	/**
	 * Resolve a list against the data/draft node to get the data items.
	 * @param {Ref[]} listOfRefs
	 * @param {?string} preferStatus e.g. DRAFT to ask for drafts if possible -- which will give you the being-edited items
	 * @returns {Item[]}
	 */
	resolveDataList(listOfRefs, preferStatus) {
		if ( ! listOfRefs) return [];
		// ?? if the data item is missing -- what should go into the list?? null / the ref / a promise ??
		let items = listOfRefs.map(ref => this.resolveRef(ref, preferStatus));
		items = items.filter(i => !!i); // paranoia: no nulls
		return items;
	}

	/**
	 * 
	 * @param {!Ref} ref 
	 * @param {?string} preferStatus
	 * @returns {!Item|Ref} Robust: fallback to the input ref
	 */
	resolveRef(ref, preferStatus) {
		if ( ! ref) {
			return null;
		}
		let status = preferStatus || getStatus(ref);
		const type = getType(ref);
		const id = getId(ref);
		if ( ! (status && type && id)) {
			console.log("(use without resolve if possible) Bad ref in DataStore list - missing status|type|id", ref);
			return ref;
		}
		let item = this.getData({status,type,id});
		if (item) return item;
		if (preferStatus) {
			// try again?
			status = getStatus(ref);
			if (status && status !== preferStatus) {
				item = this.getData({status,type,id});
				if (item) return item;
			}
		}
		// falback to the input ref
		return ref;
	}

	/**
	 * Recursively resolve any DataItems in an object
	 * Also performs a free deep copy
	 * @param {*} obj 
	 */
	deepResolve (obj, status, path) {
		assert(path || status, "DataStore.deepResolve no path or status??", path, status);
		if (!status) {
			path.forEach(p => {
				if (['data', 'draft', ...KStatus.values].includes(p)) {
					if (status) console.warn("Conflicting ")
				}
			});
		}
		if (!obj) return obj;
		const id = getId(obj);
		const type = getType(obj);
		if (id && type && C.TYPES.has(type)) { // we have a DataItem!
			const dataObj = this.getData({id, type, status});
			return dataObj || _.cloneDeep(obj); // We might not have the DataItem already stored - in which case, make sure to stick to our deep copy promise
		}
		// We're not a DataItem... at this level, but maybe deeper!
		// Deep search array, while preserving array structure
		if (_.isArray(obj)) {
			const dataObj = obj.map(item => this.deepResolve(item, status));
			return dataObj;
		}
		// Deep search object and deep copy
		const keys = Object.keys(obj);
		if (keys.length) {
			const dataObj = {}; // We'll append to a fresh copy, meaning we're doing a deep clone too for no extra cost
			keys.forEach(key => {
				dataObj[key] = this.deepResolve(obj[key], status);
			});
			return dataObj;
		}
		// Looks like a primitive!
		return obj;
	}
} // ./Store

class Ref {
	status;
	type;
	id;
}
/**
 * Item could be anything - Advert, NGO, Person.
 * This class is to help in defining the DataStore API -- not for actual use.
 */
class Item extends DataClass {
	status;
	type;
	id;
	name;

	constructor() {
		DataClass._init(this, base);		
	}
}

const DataStore = new Store();
// create some of the common data nodes
DataStore.update({
	transient: {},
	data: {},
	draft: {},
	/**
	 * Use this for widget state info which the outside app can inspect.
	 * For purely internal state, use React's `useState()` instead.
	 * 
	 * E.g. see PropControl's modified flag
	 */
	widget: {},
	/**
	 * list should be: type (e.g. Advert) -> list-id (e.g. 'all' or 'q=foo') -> List
	 * Where List is {hits: refs[], total: Number}
	 * refs are {id, type, status}
	 * see List.js
	 * 
	 * And store the actual data objects in the data/draft node.
	 * 
	 * This way list displays always access up-to-date data.
	 */
	list: {}
});
/** When a data or draft item is edited => set a modified flag. Set to falsy if you want to disable this. */
DataStore.DATA_MODIFIED_PROPERTY = 'localStatus';
export default DataStore;

// provide getPath as a convenient export
// TODO move towards offering functions cos VS auto-complete seems to work better
/**
 * the DataStore path for this item, or null if item is null;
 * @param status WARNING - If you are editing, you need status=Draft!
 * @param type
 * @param id
 */
const getPath = DataStore.getPath.bind(DataStore);

/**
 * the DataStore path for this item, or null if item is null. 
 * You can pass in an item as all the args (but not if it uses `domain` as a prop!)
 *  -- But WARNING: editors should always use status DRAFT
 * @param {Object} p
 * @param {KStatus} p.status 
 * @param {!C.TYPES} p.type 
 * @param {!String} p.id 
 * @param {?String} p.domain Only used by Profiler?? 
 * @returns {String[]}
 */
const getDataPath = DataStore.getDataPath.bind(DataStore);


/**
 * DataStore path for list
 *  * 	// TODO have a filter-function fot lists, which can dynamically add/remove items
 * @param {Object} p
 * @param {?String} p.q search query
 * @param {?String} sort Optional sort e.g. "created-desc"
 * @returns [list, type, status, domain, query+prefix, period, sort]
 */
const getListPath = ({type,status,q,prefix,start,end,size,sort,domain, ...other}) => {
	// NB: we want fixed length paths, to avoid stored results overlapping with paths fragments.
	return [
		'list', type, status, 
		domain || 'nodomain', 
		space(q, prefix) || 'all', 
		space(start, end) || 'whenever', 
		size || '1k',
		yessy(other)? JSON.stringify(other) : 'normal',
		sort || 'unsorted'
	];
};

export const useValue = (...path) => {
	assert(_.isArray(path), "DataStore.getValue - "+path);
	// If a path array was passed in, use it correctly.
	if (path.length===1 && _.isArray(path[0])) {
		path = path[0];
	}
	const [val, setVal] = useState(getObjectValueByPath(DataStore.appstate, path));
	useEffect(() => {
		assert(DataStore.appstate[path[0]],
			"DataStore.getValue: "+path[0]+" is not a json element in appstate - As a safety check against errors, the root element must already exist to use getValue()");
		setVal(getObjectValueByPath(DataStore.appstate, path));
	},[getObjectValueByPath(DataStore.appstate, path), path]);

	return val;
}


/**
 * @param {String[]} path
 */
const getValue = DataStore.getValue.bind(DataStore); 
const setValue = DataStore.setValue.bind(DataStore);

const getUrlValue = DataStore.getUrlValue.bind(DataStore);

const isDataPath = DataStore.isDataPath.bind(DataStore); // unnecessary bind but just in case


export {
	getPath,
	getDataPath,
	getListPath,
	getValue, setValue,
	getUrlValue,
	isDataPath,
	Ref, Item
};
// accessible to debug
if (typeof(window) !== 'undefined') window.DataStore = DataStore;
