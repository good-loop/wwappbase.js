'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _sjtest = require('sjtest');

var _DataClass = require('../DataClass');

var _Money = require('./Money');

var _Money2 = _interopRequireDefault(_Money);

var _wwutils = require('wwutils');

var _C = require('../../../../../src-js/C.js');

var _md = require('md5');

var _md2 = _interopRequireDefault(_md);

var _Ticket = require('./Ticket');

var _Ticket2 = _interopRequireDefault(_Ticket);

var _DataStore = require('../../plumbing/DataStore');

var _DataStore2 = _interopRequireDefault(_DataStore);

var _ActionMan = require('../../plumbing/ActionMan');

var _ActionMan2 = _interopRequireDefault(_ActionMan);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/** impact utils */
var FundRaiser = (0, _DataClass.defineType)(_C.C.TYPES.FundRaiser);
/** `This` makes it easier to copy-paste code between similar classes */
var This = FundRaiser;
exports.default = FundRaiser;


This.isa = function (obj) {
	return (0, _DataClass.isa)(obj, This.type)
	// sneaky place to add safety checks
	&& (0, _wwutils.blockProp)(obj, 'charity', This.type + ' - use charityId()') && (0, _wwutils.blockProp)(obj, 'event', This.type + ' - use eventId()') && true;
};

This.oxid = function (obj) {
	return obj.oxid || obj.owner && obj.owner.xid;
};

This.eventId = function (obj) {
	return obj.eventId;
};
This.charityId = function (obj) {
	return obj.charityId;
};

/**
 * @returns {?NGO}
 */
This.charity = function (item) {
	var cid = This.charityId(item);
	if (!cid) {
		console.warn("FundRaiser.js - No charity!", item);
		return null;
	}
	var spec = { type: _C.C.TYPES.NGO, id: cid, status: _C.C.KStatus.PUBLISHED };
	var pvCharity = _ActionMan2.default.getDataItem(spec);
	return pvCharity.value;
};

var nextTarget = function nextTarget(number) {
	// ...people will definitely feel patronised if we encourage them to shoot for £1, so set a minimum.
	// so £150 = "Aim for £200!", £200+ = "Aim for £500!", £500+ = "Aim for £1000!"
	var target = Math.max(Math.pow(10, Math.ceil(Math.log10(number))), 100);
	if (number > target * 0.5) return target;
	if (number > target * 0.2) return target * 0.5;
	return target * 0.2;
};

This.target = function (item) {
	This.assIsa(item);

	if (item.userTarget && item.userTarget.value) return item.userTarget;

	if (item.target && item.target.value) return item.target;

	item.target = _Money2.default.make({ value: nextTarget(This.donated(item).value) });

	// TODO more than the total donations
	return item.target;
};

/**
 * @returns {Money} the total donated
 */
This.donated = function (item) {
	This.assIsa(item);
	// TODO rely on the server summing and storing the donations.
	// -- to avoid having to load all (might be 1000s for a popular fundraiser).
	(0, _sjtest.assMatch)(item.donated, "?Money");
	return item.donated;
};

/**
 * event + email => fund-raiser
 * Important: This is duplicated in Java
 * 
 * TODO what if there is no email?
 */
FundRaiser.getIdForTicket = function (ticket) {
	// NB: hash with salt to protect the users email
	(0, _sjtest.assMatch)(_Ticket2.default.eventId(ticket), String, ticket);
	(0, _sjtest.assMatch)(ticket.attendeeEmail, String, ticket);
	return _Ticket2.default.eventId(ticket) + '.' + (0, _md2.default)('user:' + _Ticket2.default.oxid(ticket));
};

FundRaiser.make = function (base) {
	(0, _sjtest.assert)(base.eventId, base);
	var ma = _extends({
		'@type': _C.C.TYPES.FundRaiser
	}, base);
	FundRaiser.assIsa(ma);
	return ma;
};