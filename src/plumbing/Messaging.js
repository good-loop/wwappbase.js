'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.notifyUser = undefined;

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _DataStore = require('./DataStore');

var _DataStore2 = _interopRequireDefault(_DataStore);

var _printer = require('../utils/printer');

var _printer2 = _interopRequireDefault(_printer);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var notifyUser = function notifyUser(msgOrError) {
	var msg = void 0;
	if (_lodash2.default.isError(msgOrError)) {
		msg = { type: 'error', text: msgOrError.message || 'Error' };
	} else
		// if (_.isString(msgOrError)) 
		{
			msg = { text: _printer2.default.str(msgOrError) };
		}
	var mid = msg.id || _printer2.default.str(msg);
	msg.id = mid;

	var msgs = _DataStore2.default.getValue('misc', 'messages-for-user') || {};
	msgs[mid] = msg; //{type:'error', text: action+" failed: "+(err && err.responseText)};
	_DataStore2.default.setValue(['misc', 'messages-for-user'], msgs);
}; /**
    * Provides a set of standard functions for managing notifications and other user messages.
    * 
    * Because this is "below" the level of react components, it does not include and UI -- see MessageBar.jsx
    */

var Messaging = {
	notifyUser: notifyUser
};
window.Messaging = Messaging;
exports.notifyUser = notifyUser;
exports.default = Messaging;