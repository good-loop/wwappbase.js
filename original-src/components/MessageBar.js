'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _reactDom = require('react-dom');

var _reactDom2 = _interopRequireDefault(_reactDom);

var _sjtest = require('sjtest');

var _sjtest2 = _interopRequireDefault(_sjtest);

var _printer = require('../utils/printer.js');

var _printer2 = _interopRequireDefault(_printer);

var _DataStore = require('../plumbing/DataStore');

var _DataStore2 = _interopRequireDefault(_DataStore);

var _C = require('../C.js');

var _C2 = _interopRequireDefault(_C);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var assert = _sjtest2.default.assert;
// Plumbing


var MessageBar = function MessageBar(_ref) {
	var messages = _ref.messages;

	if (!messages || messages.length === 0) return _react2.default.createElement('div', null);
	var messageUI = messages.map(function (m, mi) {
		return _react2.default.createElement(MessageBarItem, { key: 'mi' + mi, message: m });
	});
	return _react2.default.createElement(
		'div',
		{ className: 'MessageBar container' },
		messageUI
	);
}; // ./Messagebar


var MessageBarItem = function MessageBarItem(_ref2) {
	var message = _ref2.message;

	if (message.closed) {
		return _react2.default.createElement('div', null);
	}
	var alertType = message.type === "error" ? "alert alert-danger" : "alert alert-warning";
	return _react2.default.createElement(
		'div',
		{ className: alertType },
		message.text,
		_react2.default.createElement(
			'div',
			{ className: 'hidden' },
			'Details ',
			message.details
		),
		_react2.default.createElement(
			'button',
			{ onClick: function onClick(e) {
					message.closed = true;_DataStore2.default.update();
				}, type: 'button', className: 'close', 'aria-label': 'Close' },
			_react2.default.createElement(
				'span',
				{ 'aria-hidden': 'true' },
				'\xD7'
			)
		)
	);
};

exports.default = MessageBar;