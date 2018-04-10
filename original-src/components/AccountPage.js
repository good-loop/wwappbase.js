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

var _DataStore = require('../plumbing/DataStore');

var _DataStore2 = _interopRequireDefault(_DataStore);

var _ServerIO = require('../plumbing/ServerIO');

var _ServerIO2 = _interopRequireDefault(_ServerIO);

var _Roles = require('../plumbing/Roles');

var _Roles2 = _interopRequireDefault(_Roles);

var _Misc = require('./Misc');

var _Misc2 = _interopRequireDefault(_Misc);

var _GiftAidForm = require('./GiftAidForm');

var _GiftAidForm2 = _interopRequireDefault(_GiftAidForm);

var _wwutils = require('wwutils');

var _Transfer = require('../data/Transfer');

var _Transfer2 = _interopRequireDefault(_Transfer);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var AccountPage = function AccountPage() {
	var proles = _Roles2.default.getRoles();
	var roles = proles.value;
	var pvCreditToMe = _DataStore2.default.fetch(['list', 'Transfer', 'to:' + _youAgain2.default.getId()], function () {
		return _ServerIO2.default.load('/credit/list', { data: { to: _youAgain2.default.getId() } });
	});
	// TODO link into My-Loop, and vice-versa
	// TODO store gift aid settings
	// 	<Misc.Card title='Gift Aid'>
	// 	<GiftAidForm />
	// </Misc.Card>
	return _react2.default.createElement(
		'div',
		{ className: '' },
		_react2.default.createElement(
			'h2',
			null,
			'My Account'
		),
		_react2.default.createElement(
			_Misc2.default.Card,
			{ title: 'Login' },
			'ID: ',
			_youAgain2.default.getId(),
			' ',
			_react2.default.createElement('br', null),
			'My donations: shown on the ',
			_react2.default.createElement(
				'a',
				{ href: '#dashboard' },
				'Dashboard'
			)
		),
		_react2.default.createElement(
			_Misc2.default.Card,
			{ title: 'Roles' },
			_react2.default.createElement(
				'p',
				null,
				'Roles determine what you can do. E.g. only editors can publish changes.'
			),
			proles.resolved ? _react2.default.createElement(
				'p',
				null,
				'No role'
			) : _react2.default.createElement(_Misc2.default.Loading, null),
			roles ? roles.map(function (role, i) {
				return _react2.default.createElement(RoleLine, { key: i + role, role: role });
			}) : null
		),
		pvCreditToMe.value && pvCreditToMe.value.hits ? _react2.default.createElement(CreditToMe, { credits: pvCreditToMe.value.hits }) : null,
		_Roles2.default.iCan(_C2.default.CAN.uploadCredit).value ? _react2.default.createElement(UploadCredit, null) : null
	);
};

var CreditToMe = function CreditToMe(_ref) {
	var credits = _ref.credits;

	var totalCred = _Transfer2.default.getCredit();
	return _react2.default.createElement(
		_Misc2.default.Card,
		{ title: 'Credit' },
		credits.map(function (cred) {
			return _react2.default.createElement(
				'div',
				{ key: cred.id },
				_react2.default.createElement(_Misc2.default.Money, { amount: cred.amount }),
				' from ',
				_wwutils.XId.prettyName(cred.from)
			);
		}),
		_react2.default.createElement(
			'div',
			null,
			'Total: ',
			_react2.default.createElement(_Misc2.default.Money, { amount: totalCred })
		)
	);
};

var UploadCredit = function UploadCredit() {
	var pvCredits = _DataStore2.default.fetch(['list', 'Transfer', 'from:' + _youAgain2.default.getId()], function () {
		return _ServerIO2.default.load('/credit/list', { data: { from: _youAgain2.default.getId() } });
	});
	var path = ['widget', 'UploadCredit', 'form'];
	return _react2.default.createElement(
		_Misc2.default.Card,
		{ title: 'Upload Credit' },
		pvCredits.value ? pvCredits.value.hits.map(function (transfer) {
			return _react2.default.createElement(
				'div',
				{ key: transfer.id },
				_react2.default.createElement(_Misc2.default.Money, { amount: transfer.amount }),
				' to ',
				transfer.to
			);
		}) : null,
		_react2.default.createElement(
			'p',
			null,
			'HACK: please paste 2-column csv text below, with the headers ',
			_react2.default.createElement(
				'code',
				null,
				'Email, Credit'
			)
		),
		_react2.default.createElement(_Misc2.default.PropControl, { path: path, prop: 'csv', label: 'CSV', type: 'textarea' }),
		_react2.default.createElement(
			_Misc2.default.SubmitButton,
			{ url: '/credit', path: path, once: true },
			'Submit'
		)
	);
};

var RoleLine = function RoleLine(_ref2) {
	var role = _ref2.role;

	return _react2.default.createElement(
		'div',
		{ className: 'well' },
		role
	);
};

exports.default = AccountPage;