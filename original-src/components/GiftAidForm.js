'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _reactBootstrap = require('react-bootstrap');

var _DataStore = require('../plumbing/DataStore');

var _DataStore2 = _interopRequireDefault(_DataStore);

var _Misc = require('./Misc');

var _Misc2 = _interopRequireDefault(_Misc);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// @Flow
var giftAidTaxpayerLabel = 'I confirm that I am a UK taxpayer and I understand that if I pay less Income Tax and/or Capital Gains Tax in the current tax year than the amount of Gift Aid claimed on all my donations it is my responsibility to pay the difference.';
var giftAidOwnMoneyLabel = 'This is my own money. I am not paying in donations made by a third party e.g. money collected at an event, in the pub, a company donation or a donation from a friend or family member.';
var giftAidNoCompensationLabel = 'I am not receiving anything in return for my donation e.g. book, auction prize, ticket to an event, or donating as part of a sweepstake, raffle or lottery.';

var GiftAidForm = function GiftAidForm(_ref) {
	var formPath = _ref.formPath;

	var _DataStore$getValue = _DataStore2.default.getValue(formPath),
	    giftAid = _DataStore$getValue.giftAid;

	// Gift Aiding? Check all these!


	var giftAidChecks = giftAid ? _react2.default.createElement(
		_reactBootstrap.FormGroup,
		null,
		_react2.default.createElement(
			'p',
			null,
			'Please tick all the following to confirm your donation is eligible for Gift Aid.'
		),
		_react2.default.createElement(_Misc2.default.PropControl, { prop: 'giftAidTaxpayer', label: giftAidTaxpayerLabel, path: formPath, type: 'checkbox' }),
		_react2.default.createElement(_Misc2.default.PropControl, { prop: 'giftAidOwnMoney', label: giftAidOwnMoneyLabel, path: formPath, type: 'checkbox' }),
		_react2.default.createElement(_Misc2.default.PropControl, { prop: 'giftAidNoCompensation', label: giftAidNoCompensationLabel, path: formPath, type: 'checkbox' }),
		_react2.default.createElement(
			'p',
			null,
			'Please provide the following details to enable your selected charity to process Gift Aid.'
		),
		_react2.default.createElement(_Misc2.default.PropControl, { prop: 'name', label: 'Name', placeholder: 'Enter your name', path: formPath, type: 'text' }),
		_react2.default.createElement(_Misc2.default.PropControl, { prop: 'address', label: 'Address', placeholder: 'Enter your address', path: formPath, type: 'address' }),
		_react2.default.createElement(_Misc2.default.PropControl, { prop: 'postcode', label: 'Postcode', placeholder: 'Enter your postcode', path: formPath, type: 'postcode' }),
		_react2.default.createElement(
			'small',
			null,
			'I understand that my name and address may be shared with the charity for processing Gift Aid.'
		)
	) : '';

	return _react2.default.createElement(
		'div',
		{ className: 'col-xs-12 gift-aid' },
		_react2.default.createElement(_Misc2.default.PropControl, { prop: 'giftAid', label: 'Yes, add Gift Aid', path: formPath, type: 'checkbox' }),
		giftAidChecks,
		_react2.default.createElement(
			'small',
			null,
			_react2.default.createElement(
				'a',
				{ target: '_blank', href: 'https://www.gov.uk/donating-to-charity/gift-aid' },
				'Find out more about Gift Aid'
			)
		)
	);
};

exports.default = GiftAidForm;