/** 
 * Wrapper for server calls.
 * This exports the same object as ServerIO.js -- it provides a generic base which ServerIO.js builds on.
 */
import _ from 'lodash';
import $ from 'jquery';
import SJTest from 'sjtest';
import {assert, assMatch} from 'sjtest';
import C from '../../C.js';
import {encURI} from 'wwutils';

import Login from 'you-again';

// Try to avoid using this for modularity!
import {notifyUser} from './Messaging';

const ServerIO = {};
export default ServerIO;
// for debug
window.ServerIO = ServerIO;

// Allow for local to point at live for debugging
ServerIO.APIBASE = ''; // Normally use this! -- but ServerIO.js may override for testing

/** 
 * Call this from ServerIO.js 
 * Safety check - if we deploy test code, it will complain. */
ServerIO.checkBase = () => {
	if (ServerIO.APIBASE && C.isProduction()) {
		const err = new Error("ServerIO.js - ServerIO.APIBASE is using a test setting! Oops "+ServerIO.APIBASE+" NB: Reset it to ''");
		ServerIO.APIBASE = ''; // clear it
		console.warn(err);
	}
	// TODO include datalog here too in notify
	if (ServerIO.APIBASE && ! C.isProduction()) {
		notifyUser("Using Server: "+ServerIO.APIBASE);
	}
	// datalog endpoint
	if (ServerIO.DATALOG_ENDPOINT && C.isProduction() && 
			(ServerIO.DATALOG_ENDPOINT.indexOf('test') !== -1 || ServerIO.DATALOG_ENDPOINT.indexOf('local') !== -1)
		) {
		const err = new Error("ServerIO.js - ServerIO.DATALOG_ENDPOINT is using a test setting! Oops "+ServerIO.DATALOG_ENDPOINT);
		ServerIO.DATALOG_ENDPOINT = 'https://lg.good-loop.com/data';
		console.warn(err);
	}
	if (ServerIO.DATALOG_ENDPOINT && ! C.isProduction() && ServerIO.DATALOG_ENDPOINT.indexOf('https://lg') !== -1) {
		console.warn("Using production DataLog Server: "+ServerIO.DATALOG_ENDPOINT); // this is common enough
	}
	// profiler
	if (ServerIO.PROFILER_ENDPOINT && C.isProduction() && 
			(ServerIO.PROFILER_ENDPOINT.indexOf('test') !== -1 || ServerIO.PROFILER_ENDPOINT.indexOf('local') !== -1)
		) {
		const err = new Error("ServerIO.js - ServerIO.PROFILER_ENDPOINT is using a test setting! Oops "+ServerIO.PROFILER_ENDPOINT);
		ServerIO.PROFILER_ENDPOINT = 'https://profiler.good-loop.com/profile';
		console.warn(err);
	}
	if (ServerIO.PROFILER_ENDPOINT && ! C.isProduction() && ServerIO.PROFILER_ENDPOINT.indexOf('https://profiler') !== -1) {
		console.warn("Using production Profiler Server: "+ServerIO.PROFILER_ENDPOINT);
	}
};


// Error Logging - but only the first error
window.onerror = _.once(function(messageOrEvent, source, lineno, colno, error) {
	// NB: source & line num are not much use in a minified file
	let msg = error? ""+error+"\n\n"+error.stack : ""+messageOrEvent;
	$.ajax('/log', {data: {
		msg: window.location+' '+msg+' user-id: '+Login.getId(), // NB: browser type (user agent) will be sent as a header
		type: "error"
	}});
});
// quiet asserts in production
if (C.isProduction()) {
	SJTest.assertFailed = msg => {
		// we usually pass in an array from ...msg
		if (msg.length === 1) msg = msg[0];
		console.error("assert", msg);
		// A nice string?
		let smsg;
		try {
			smsg = JSON.stringify(msg);
		} catch(err) {
			smsg = ""+msg;
		}
		window.onerror(smsg, null, null, null, new Error("assert-failed: "));
	};
}


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
 * TODO refactor merge with Crud.js ServerIO.list
 * ??Should we force filters into a query string `q`, or use JSON objects??
 * @returns {Promise}
 */
ServerIO.search = function(type, filter) {
	assert(C.TYPES.has(type), type);
	let servlet = ServerIO.getServletForType(type);
	let url = '/'+servlet+'/_list.json';
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
	// HACK route charity requests to SoGive
	if (type==='NGO' && C.app.service !== 'sogive') {
		id = sogiveid(id);
		return 'https://app.sogive.org/charity/'+encURI(id)+'.json'
			+(status? '?status='+status : '');
	}
	let servlet = ServerIO.getServletForType(type);
	let url = '/'+servlet+'/'+ (ServerIO.dataspace? ServerIO.dataspace+'/' : '') + encURI(id)+'.json'
		+(status? '?status='+status : '');	
	return url;
};
// HACK match mismatches
const sogiveid = id => {
	let sid = {
		'battersea_dogs_and_cats_home': 'battersea-dogs-and-cats-home'
	}[id];
	if (sid) return sid;
	return id;
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
	// prepend the API base url? e.g. to route all traffic from a local dev build to the live backend.
	if (ServerIO.APIBASE && url.indexOf('http') === -1) {
		url = ServerIO.APIBASE+url;
	}
	console.log("ServerIO.load", url, params);
	params = ServerIO.addDefaultParams(params);
	// sanity check: no Objects except arrays
	_.values(params.data).map(
		v => assert( ! _.isObject(v) || _.isArray(v), v)
	);
	// sanity check: status
	assert( ! params.data.status || C.KStatus.has(params.data.status), params.data.status);
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
	// detect code-200-but-error responses
	defrd = defrd
		.then(response => {
			// check for success markers from JsonResponse or JSend
			if (response.success === false || response.status==='error' || response.status==='fail') {
				throw response;
			}
			// notify user of anything
			if ( ! params.swallow) {
				ServerIO.handleMessages(response);
			}
			return response;
		})
		// on fail (inc a code-200-but-really-failed thrown above)
		.catch(response => {
			console.error('fail',url,params,response);
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
			if ( ! params.swallow) {
				notifyUser(msg);
			}
			// carry on error handling
			throw response;
		});
	return defrd;
};


ServerIO.post = function(url, data) {
	return ServerIO.load(url, {data, method: 'POST'});
};

ServerIO.put = function(url, data) {
	return ServerIO.load(url, {data, method: 'PUT'});
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
