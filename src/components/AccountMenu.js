'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _reactBootstrap = require('react-bootstrap');

var _youAgain = require('you-again');

var _youAgain2 = _interopRequireDefault(_youAgain);

var _C = require('../../../../src-js/C.js');

var _DataStore = require('../plumbing/DataStore');

var _DataStore2 = _interopRequireDefault(_DataStore);

var _LoginWidget = require('./LoginWidget/LoginWidget.js');

var _Misc = require('./Misc');

var _Misc2 = _interopRequireDefault(_Misc);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var doLogout = function doLogout() {
	_youAgain2.default.logout();
};

/*
The top-right menu
*/


// import {XId,yessy,uid} from '../js/util/orla-utils.js';

var AccountMenu = function AccountMenu(_ref) {
	var pending = _ref.pending,
	    active = _ref.active;

	if (pending) return _react2.default.createElement(_Misc2.default.Loading, null);
	if (!_youAgain2.default.isLoggedIn()) {
		return _react2.default.createElement(
			'ul',
			{ id: 'top-right-menu', className: 'nav navbar-nav navbar-right' },
			_react2.default.createElement(
				'li',
				null,
				_react2.default.createElement(_LoginWidget.LoginLink, null)
			)
		);
	}
	var user = _youAgain2.default.getUser();
	return _react2.default.createElement(
		'ul',
		{ id: 'top-right-menu', className: 'nav navbar-nav navbar-right' },
		_react2.default.createElement(
			'li',
			{ className: 'dropdown' + (active ? ' active' : '') },
			_react2.default.createElement(
				'a',
				{ className: 'dropdown-toggle', 'data-toggle': 'dropdown', role: 'button', 'aria-haspopup': 'true', 'aria-expanded': 'false' },
				user.name || user.xid,
				'\xA0',
				_react2.default.createElement('span', { className: 'caret' })
			),
			_react2.default.createElement(
				'ul',
				{ className: 'dropdown-menu' },
				_react2.default.createElement(
					'li',
					null,
					_react2.default.createElement(
						'a',
						{ href: '#account' },
						'Account'
					)
				),
				_react2.default.createElement('li', { role: 'separator', className: 'divider' }),
				_react2.default.createElement(
					'li',
					null,
					_react2.default.createElement(
						'a',
						{ href: '#dashboard', onClick: function onClick() {
								return doLogout();
							} },
						'Log out'
					)
				)
			)
		)
	);
};

exports.default = AccountMenu;