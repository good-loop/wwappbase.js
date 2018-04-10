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

var _youAgain = require('you-again');

var _youAgain2 = _interopRequireDefault(_youAgain);

var _printer = require('../utils/printer.js');

var _printer2 = _interopRequireDefault(_printer);

var _C = require('../C');

var _C2 = _interopRequireDefault(_C);

var _Roles = require('../Roles');

var _Roles2 = _interopRequireDefault(_Roles);

var _Misc = require('./Misc');

var _Misc2 = _interopRequireDefault(_Misc);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var E404Page = function E404Page() {
	return _react2.default.createElement(
		'div',
		{ className: 'E404Page' },
		_react2.default.createElement(
			'h2',
			null,
			'Error 404: Page not found'
		),
		_react2.default.createElement(
			'p',
			null,
			'Sorry: ',
			_react2.default.createElement(
				'code',
				null,
				"" + window.location
			),
			'is not a valid page url.'
		)
	);
};

exports.default = E404Page;