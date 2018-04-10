'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _jquery = require('jquery');

var _jquery2 = _interopRequireDefault(_jquery);

var _sjtest = require('sjtest');

var _C = require('../C.js');

var _C2 = _interopRequireDefault(_C);

var _DataStore = require('./DataStore');

var _DataStore2 = _interopRequireDefault(_DataStore);

var _DataClass = require('../data/DataClass');

var _youAgain = require('you-again');

var _youAgain2 = _interopRequireDefault(_youAgain);

var _wwutils = require('wwutils');

var _ServerIO = require('./ServerIO');

var _ServerIO2 = _interopRequireDefault(_ServerIO);

var _ActionMan = require('./ActionMan');

var _ActionMan2 = _interopRequireDefault(_ActionMan);

var _Messaging = require('./Messaging');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; } /** Add "standard crud functions" to ServerIO and ActionMan */

/**
 * @returns Promise
 */
_ActionMan2.default.crud = function (type, id, action, item) {
	if (!type) type = (0, _DataClass.getType)(item);
	if (!id) id = (0, _DataClass.getId)(item);
	(0, _sjtest.assMatch)(id, String);
	(0, _sjtest.assert)(_C2.default.TYPES.has(type), type);
	(0, _sjtest.assert)(_C2.default.CRUDACTION.has(action), type);
	if (!item) item = _DataStore2.default.getData(type, id);
	if (!(0, _DataClass.getId)(item)) {
		(0, _sjtest.assert)(id === 'new', id);
		item.id = id;
	}
	// new item? then change the action
	if (id === _C2.default.newId && action === 'save') {
		action = 'new';
	}
	// mark the widget as saving
	_DataStore2.default.setLocalEditsStatus(type, id, _C2.default.STATUS.saving);
	// call the server
	return _ServerIO2.default.crud(type, item, action).then(_DataStore2.default.updateFromServer.bind(_DataStore2.default)).then(function (res) {
		// success :)
		var navtype = (_C2.default.navParam4type ? _C2.default.navParam4type[type] : null) || type;
		if (action === 'delete') {
			_DataStore2.default.setUrlValue(navtype, null);
		} else if (id === _C2.default.newId) {
			// id change!
			// updateFromServer should have stored the new item
			// So just repoint the focus
			var serverId = (0, _DataClass.getId)(res.cargo);
			_DataStore2.default.setFocus(type, serverId); // deprecated			
			_DataStore2.default.setUrlValue(navtype, serverId);
		}
		// clear the saving flag
		_DataStore2.default.setLocalEditsStatus(type, id, _C2.default.STATUS.clean);
		return res;
	}).fail(function (err) {
		// bleurgh
		console.warn(err);
		// TODO factor out message code
		(0, _Messaging.notifyUser)(new Error(action + " failed: " + (err && err.responseText)));
		// mark the object as dirty
		_DataStore2.default.setLocalEditsStatus(type, id, _C2.default.STATUS.dirty);
		return err;
	});
}; // ./crud

_ActionMan2.default.saveEdits = function (type, pubId, item) {
	return _ActionMan2.default.crud(type, pubId, 'save', item);
};

_ActionMan2.default.publishEdits = function (type, pubId, item) {
	return _ActionMan2.default.crud(type, pubId, 'publish', item).then(function (res) {
		// invalidate any cached list of this type
		_DataStore2.default.invalidateList(type);
		return res;
	}); // ./then	
};

_ActionMan2.default.discardEdits = function (type, pubId) {
	return _ActionMan2.default.crud(type, pubId, 'discard-edits');
};

_ActionMan2.default.delete = function (type, pubId) {
	// ?? put a safety check in here??
	return _ActionMan2.default.crud(type, pubId, 'delete').then(function (e) {
		console.warn("deleted!", type, pubId, e);
		// remove the local version
		_DataStore2.default.setValue(['data', type, pubId], null);
		// invalidate any cached list of this type
		_DataStore2.default.invalidateList(type);
		return e;
	});
};

// ServerIO //
var servlet4type = function servlet4type(type) {
	var stype = type.toLowerCase();
	// NGO = charity
	if (stype === 'ngo') stype = 'charity';
	// "advert"" can fall foul of adblocker!	
	if (stype === 'advert') stype = 'vert';
	if (stype === 'advertiser') stype = 'vertiser';
	return stype;
};

_ServerIO2.default.crud = function (type, item, action) {
	(0, _sjtest.assert)(_C2.default.TYPES.has(type), type);
	(0, _sjtest.assert)(item && (0, _DataClass.getId)(item), item);
	(0, _sjtest.assert)(_C2.default.CRUDACTION.has(action), type);
	var params = {
		method: 'POST',
		data: {
			action: action,
			type: type,
			item: JSON.stringify(item)
		}
	};
	if (action === 'new') {
		params.data.name = item.name; // pass on the name so server can pick a nice id if action=new
	}
	var stype = servlet4type(type);
	// NB: load() includes handle messages
	return _ServerIO2.default.load('/' + stype + '/' + (0, _wwutils.encURI)((0, _DataClass.getId)(item)) + '.json', params);
};
_ServerIO2.default.saveEdits = function (type, item) {
	return _ServerIO2.default.crud(type, item, 'save');
};
_ServerIO2.default.publishEdits = function (type, item) {
	return _ServerIO2.default.crud(type, item, 'publish');
};
_ServerIO2.default.discardEdits = function (type, item) {
	return _ServerIO2.default.crud(type, item, 'discard-edits');
};

/**
 * get an item from the backend -- does not save it into DataStore
 */
_ServerIO2.default.getDataItem = function (_ref) {
	var type = _ref.type,
	    id = _ref.id,
	    status = _ref.status,
	    swallow = _ref.swallow,
	    other = _objectWithoutProperties(_ref, ['type', 'id', 'status', 'swallow']);

	(0, _sjtest.assert)(_C2.default.TYPES.has(type), 'Crud.js - ServerIO - bad type: ' + type);
	if (!status) {
		console.warn("Crud.js - ServerIO.getDataItem: no status - this is unwise! Editor pages should specify DRAFT. type: " + type + " id: " + id);
	}
	(0, _sjtest.assMatch)(id, String);
	var params = { data: _extends({ status: status }, other), swallow: swallow };
	return _ServerIO2.default.load('/' + servlet4type(type) + '/' + (0, _wwutils.encURI)(id) + '.json', params);
};
/**
 * get an item from DataStore, or call the backend if not there (and save it into DataStore)
 */
_ActionMan2.default.getDataItem = function (_ref2) {
	var type = _ref2.type,
	    id = _ref2.id,
	    status = _ref2.status,
	    other = _objectWithoutProperties(_ref2, ['type', 'id', 'status']);

	(0, _sjtest.assert)(_C2.default.TYPES.has(type), 'Crud.js - ActionMan - bad type: ' + type);
	(0, _sjtest.assMatch)(id, String);
	return _DataStore2.default.fetch(['data', type, id], function () {
		return _ServerIO2.default.getDataItem(_extends({ type: type, id: id, status: status }, other));
	});
};

var CRUD = {};
exports.default = CRUD;