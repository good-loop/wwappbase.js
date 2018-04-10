'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _sjtest = require('sjtest');

var _DataClass = require('../DataClass');

var _wwutils = require('wwutils');

var _Money = require('./Money');

var _Money2 = _interopRequireDefault(_Money);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Ticket = (0, _DataClass.defineType)('Ticket');
var This = Ticket;
exports.default = Ticket;


This.isa = function (obj) {
	return (0, _DataClass.isa)(obj, This.type)
	// sneaky place to add safety checks
	&& (0, _wwutils.blockProp)(obj, 'charity', This.type + ' - use charityId()') && (0, _wwutils.blockProp)(obj, 'event', This.type + ' - use eventId()') && true;
};

This.eventId = function (obj) {
	return obj.eventId;
};
This.charityId = function (obj) {
	return obj.charityId;
};

This.oxid = function (item) {
	return item.attendeeEmail + '@email';
};

/**
 * 
 */
Ticket.make = function (base, eventId) {
	(0, _sjtest.assMatch)(eventId, String);
	var obj = _extends({
		eventId: eventId,
		price: _Money2.default.make()
	}, base, {
		// Use a fresh ID
		id: eventId + '.' + (0, _DataClass.nonce)()
	});
	obj['@type'] = This.type;
	This.assIsa(obj);
	return obj;
};