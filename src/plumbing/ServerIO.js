'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _jquery = require('jquery');

var _jquery2 = _interopRequireDefault(_jquery);

var _sjtest = require('sjtest');

var _wwutils = require('wwutils');

var _C = require('../../../../src-js/C.js');

var _youAgain = require('you-again');

var _youAgain2 = _interopRequireDefault(_youAgain);

var _NGO = require('../data/charity/NGO');

var _NGO2 = _interopRequireDefault(_NGO);

var _DataStore = require('./DataStore');

var _DataStore2 = _interopRequireDefault(_DataStore);

var _Messaging = require('./Messaging');

var _Messaging2 = _interopRequireDefault(_Messaging);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Error Logging - but only the first error


// Try to avoid using this for modularity!
window.onerror = _lodash2.default.once(function (messageOrEvent, source, lineno, colno, error) {
	// NB: source & line num are not much use in a minified file
	var msg = error ? "" + error + "\n\n" + error.stack : "" + messageOrEvent;
	_jquery2.default.ajax('/log', { data: {
			msg: window.location + ' ' + msg + ' user-id: ' + _youAgain2.default.getId(), // NB: browser type (user agent) will be sent as a header
			type: "error"
		} });
}); /** 
     * Wrapper for server calls.
     *
     */


var ServerIO = {};
exports.default = ServerIO;
// for debug

window.ServerIO = ServerIO;

// allow switching backend during testing
ServerIO.base = null;
// 'https://app.sogive.org';


/**
 * @param query {!String} query string
 * @param status {?KStatus} optional to request draft
 */
ServerIO.search = function (_ref) {
	var q = _ref.q,
	    prefix = _ref.prefix,
	    from = _ref.from,
	    size = _ref.size,
	    status = _ref.status,
	    recommended = _ref.recommended;

	// assMatch( q || prefix, String);
	return ServerIO.load('/search.json', { data: { q: q, prefix: prefix, from: from, size: size, status: status, recommended: recommended } });
};

ServerIO.getCharity = function (charityId, status) {
	return ServerIO.getDataItem({ type: _C.C.TYPES.NGO, id: charityId, status: status });
};

ServerIO.donate = function (data) {
	// Anything to assert here?
	return ServerIO.post('/donation', data);
};

ServerIO.getDonations = function (_ref2) {
	var from = _ref2.from,
	    to = _ref2.to,
	    _ref2$status = _ref2.status,
	    status = _ref2$status === undefined ? _C.C.KStatus.PUBLISHED : _ref2$status;

	var params = {
		data: {
			from: from, to: to,
			status: status,
			sort: 'date-desc'
		}
	};
	return ServerIO.load('/donation/list', params);
};

/**
 * TODO delete and just use Crud.js
 */
ServerIO.saveCharity = function (charity, status) {
	(0, _sjtest.assert)(_NGO2.default.isa(charity), charity);
	var params = {
		data: { action: 'save', item: JSON.stringify(charity), status: status },
		method: 'PUT' };
	return ServerIO.load('/charity/' + (0, _wwutils.encURI)(_NGO2.default.id(charity)) + '.json', params);
};

/**
 * TODO handle charity or fundraiser
 */
ServerIO.getDonationDraft = function (_ref3) {
	var from = _ref3.from,
	    charity = _ref3.charity,
	    fundRaiser = _ref3.fundRaiser;

	(0, _sjtest.assMatch)(charity || fundRaiser, String);
	var to = charity;
	var q = fundRaiser ? "fundRaiser:" + fundRaiser : null;
	var status = _C.C.KStatus.DRAFT;
	return ServerIO.load('/donation/list.json', { data: { from: from, to: to, q: q, status: status }, swallow: true });
};

/**
 * @param charity {name:String}
 */
ServerIO.addCharity = function (charity) {
	var status = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _C.C.KStatus.DRAFT;

	var params = {
		data: { action: 'new', item: JSON.stringify(charity), status: status },
		method: 'PUT' };
	return ServerIO.load('/charity.json', params);
};

ServerIO.discardEdits = function (charity, status) {
	(0, _sjtest.assert)(_NGO2.default.isa(charity), charity);
	var params = {
		data: { action: 'discard-edits', status: status }
	};
	return ServerIO.load('/charity/' + (0, _wwutils.encURI)(_NGO2.default.id(charity)) + '.json', params);
};

ServerIO.upload = function (file, progress, load) {
	// Provide a pre-constructed XHR so we can insert progress/load callbacks
	var xhr = function xhr() {
		var request = _jquery2.default.ajaxSettings.xhr();
		request.onProgress = progress;
		request.onLoad = load; // ??@Roscoe - Any particular reason for using onLoad instead of .then? ^Dan
		return request;
	};

	var data = new FormData(); // This is a browser native thing: https://developer.mozilla.org/en-US/docs/Web/API/FormData
	data.append('upload', file);

	return ServerIO.load('/upload.json', {
		xhr: xhr,
		data: data,
		type: 'POST',
		contentType: false,
		processData: false,
		swallow: true
	});
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
ServerIO.load = function (url, params) {
	(0, _sjtest.assMatch)(url, String);
	console.log("ServerIO.load", url, params);
	params = ServerIO.addDefaultParams(params);
	// sanity check: no Objects except arrays
	_lodash2.default.values(params.data).map(function (v) {
		return (0, _sjtest.assert)(!_lodash2.default.isObject(v) || _lodash2.default.isArray(v), v);
	});
	// sanity check: status
	(0, _sjtest.assert)(!params.data.status || _C.C.KStatus.has(params.data.status), params.data.status);
	// add the base
	if (url.substring(0, 4) !== 'http' && ServerIO.base) {
		url = ServerIO.base + url;
	}
	params.url = url;
	// send cookies & add auth
	_youAgain2.default.sign(params);
	// debug: add stack
	if (window.DEBUG) {
		try {
			var stack = new Error().stack;
			// stacktrace, chop leading "Error at Object." bit
			params.data.stacktrace = ("" + stack).replace(/\s+/g, ' ').substr(16);
		} catch (error) {
			// oh well
		}
	}
	// Make the ajax call
	var defrd = _jquery2.default.ajax(params); // The AJAX request.
	if (params.swallow) {
		// no message display
		return defrd;
	}
	defrd = defrd.then(ServerIO.handleMessages).fail(function (response, huh, bah) {
		console.error('fail', url, params, response, huh, bah);
		// error message
		var text = response.status === 404 ? "404: Sadly that content could not be found." : "Could not load " + params.url + " from the server";
		if (response.responseText && !(response.status >= 500)) {
			// NB: dont show the nginx error page for a 500 server fail
			text = response.responseText;
		}
		var msg = {
			id: 'error from ' + params.url,
			type: 'error',
			text: text
		};
		// HACK hide details
		if (msg.text.indexOf('\n----') !== -1) {
			var i = msg.text.indexOf('\n----');
			msg.details = msg.text.substr(i);
			msg.text = msg.text.substr(0, i);
		}
		// bleurgh - a frameworky dependency
		(0, _Messaging.notifyUser)(msg);
		return response;
	});
	return defrd;
};

ServerIO.post = function (url, data) {
	return ServerIO.load(url, { data: data, method: 'POST' });
};

ServerIO.handleMessages = function (response) {
	console.log('handleMessages', response);
	var newMessages = response && response.messages;
	if (!newMessages || newMessages.length === 0) {
		return response;
	}
	newMessages.forEach(function (msg) {
		return (0, _Messaging.notifyUser)(msg);
	});
	return response;
};

ServerIO.addDefaultParams = function (params) {
	if (!params) params = {};
	if (!params.data) params.data = {};
	return params;
};

ServerIO.importDataSet = function (dataset) {
	(0, _sjtest.assert)(_lodash2.default.isString(dataset));
	return ServerIO.load('/import.json', { data: { dataset: dataset } });
};