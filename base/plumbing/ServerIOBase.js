/** 
 * Wrapper for server calls.
 * This exports the same object as ServerIO.js -- it provides a generic base which ServerIO.js builds on.
 */
import _ from 'lodash';
import $ from 'jquery';
import {assert, assMatch} from 'sjtest';
import C from '../../C.js';

import Login from 'you-again';

// Try to avoid using this for modularity!
import {notifyUser} from './Messaging';

// Allow for local to point at live for debugging
window.APIBASE = ''; // Normally use this! -- but ServerIO.js may override for testing

const ServerIO = {};
export default ServerIO;
// for debug
window.ServerIO = ServerIO;

// allow switching backend during testing
ServerIO.base = null;
	// 'https://app.sogive.org';

ServerIO.upload = function(file, progress, load) {
	// Provide a pre-constructed XHR so we can insert progress/load callbacks
	const xhr = () => {
		const request = $.ajaxSettings.xhr();
		request.onProgress = progress;
		request.onLoad = load; // ??@Roscoe - Any particular reason for using onLoad instead of .then? ^Dan
		return request;
	};

	const data = new FormData(); // This is a browser native thing: https://developer.mozilla.org/en-US/docs/Web/API/FormData
	data.append('upload', file);

	return ServerIO.load('/upload.json', {
		xhr,
		data,
		type: 'POST',
		contentType: false,
		processData: false,
		swallow: true,
	});
};



/**
 * ??Should we force filters into a query string `q`, or use JSON objects??
 */
ServerIO.search = function(type, filter) {
	assert(C.TYPES.has(type), type);
	let servlet = ServerIO.getServletForType(type);
	let url = '/'+servlet+'/list.json';
	let params = {
		data: {}
	};
	if (filter) {
		params.data.filter = JSON.stringify(filter);
		if (filter.q) params.data.q = filter.q;
	}
	return ServerIO.load(url, params);
};


/**
 * Note: this can be over-ridden to special case some types
 */
ServerIO.getUrlForItem = ({type, id, status}) => {
	let servlet = ServerIO.getServletForType(type);
	let url = '/'+servlet+'/'+encURI(id)+'.json';
	return url;
};
ServerIO.getServletForType = (type) => {
	return type.toLowerCase();
};

/**
 * Submits an AJAX request. This is the key base method
 *
 * @param {String} url The url to which the request should be made.
 *
 * @param {Object} [params] Optional map of settings to modify the request.
 * See <a href="http://api.jquery.com/jQuery.ajax/">jQuery.ajax</a> for details.
 * IMPORTANT: To specify form data, use params.data
 *
 * {
 * 	// Our parameters
 * 	swallow: true to swallow any messages returned by the server.   
 * 
 * 	// jQuery parameters (partial notes only)
 * 	data: {Object} data to send - this should be a simple key -> primitive-value map.   
 * 	xhr: {Function} Used for special requests, e.g. file upload
 * }
 
 *
 * @returns A <a href="http://api.jquery.com/jQuery.ajax/#jqXHR">jqXHR object</a>.
**/
ServerIO.load = function(url, params) {
	assMatch(url,String);
	// prepend the API base url? e.g. to route all traffic from a local dev build to the live app.sogive.org backend.
	if (APIBASE && url.indexOf('http') === -1) {
		url = APIBASE+url;
	}
	console.log("ServerIO.load", url, params);
	params = ServerIO.addDefaultParams(params);
	// sanity check: no Objects except arrays
	_.values(params.data).map(
		v => assert( ! _.isObject(v) || _.isArray(v), v)
	);
	// sanity check: status
	assert( ! params.data.status || C.KStatus.has(params.data.status), params.data.status);
	// add the base
	if (url.substring(0,4) !== 'http' && ServerIO.base) {
		url = ServerIO.base + url;
	}
	params.url = url;
	// send cookies & add auth
	Login.sign(params);
	// debug: add stack
	if (window.DEBUG) {
		try {
			const stack = new Error().stack;			
			// stacktrace, chop leading "Error at Object." bit
			params.data.stacktrace = (""+stack).replace(/\s+/g,' ').substr(16);
		} catch(error) {
			// oh well
		}
	}
	// Make the ajax call
	let defrd = $.ajax(params); // The AJAX request.
	if (params.swallow) {
		// no message display
		return defrd;
	}
	defrd = defrd
		.then(ServerIO.handleMessages)
		.fail(function(response, huh, bah) {
			console.error('fail',url,params,response,huh,bah);
			// error message
			let text = response.status===404? 
				"404: Sadly that content could not be found."
				: "Could not load "+params.url+" from the server";
			if (response.responseText && ! (response.status >= 500)) {
				// NB: dont show the nginx error page for a 500 server fail
				text = response.responseText;
			}
			let msg = {
				id: 'error from '+params.url,
				type:'error', 
				text
			};
			// HACK hide details
			if (msg.text.indexOf('\n----') !== -1) {
				let i = msg.text.indexOf('\n----');
				msg.details = msg.text.substr(i);
				msg.text = msg.text.substr(0, i);
			}
			// bleurgh - a frameworky dependency
			notifyUser(msg);
			return response;
		});
	return defrd;
};


ServerIO.post = function(url, data) {
	return ServerIO.load(url, {data, method:'POST'});
};

ServerIO.handleMessages = function(response) {
	console.log('handleMessages',response);
	const newMessages = response && response.messages;
	if ( ! newMessages || newMessages.length===0) {
		return response;
	}
	newMessages.forEach(msg => notifyUser(msg));
	return response;
};

ServerIO.addDefaultParams = function(params) {
	if ( ! params) params = {};
	if ( ! params.data) params.data = {};
	return params;
};
