'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _sjtest = require('sjtest');

var _DataClass = require('../DataClass');

var _C = require('../../../../../src-js/C.js');

var _Money = require('./Money');

var _Money2 = _interopRequireDefault(_Money);

var _DataStore = require('../../plumbing/DataStore');

var _DataStore2 = _interopRequireDefault(_DataStore);

var _wwutils = require('wwutils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/** impact utils */
var Donation = (0, _DataClass.defineType)(_C.C.TYPES.Donation);
var This = Donation;
exports.default = Donation;

// ref: https://stackoverflow.com/questions/18082/validate-decimal-numbers-in-javascript-isnumeric

function isNumeric(value) {
	return !isNaN(value - parseFloat(value));
}

// duck type: needs a value
Donation.isa = function (obj) {
	return (0, _DataClass.isa)(obj, _C.C.TYPES.Donation) || obj && isNumeric(obj.value);
};
Donation.assIsa = function (obj) {
	(0, _sjtest.assert)(Donation.isa(obj), "Donation.js - not a Donation " + obj);
	(0, _wwutils.blockProp)(obj, 'fundraiser', 'Donation.js - use Donation.fundRaiser()');
	return true;
};

Donation.getTotal = function (don) {
	// TODO + contributions - fees
	// TODO test
	var ttl = Donation.amount(don);
	if (don.contributions) {
		don.contributions.forEach(function (money) {
			return ttl = ttl + money;
		});
	}
	if (don.fees) {
		don.fees.forEach(function (money) {
			return ttl = ttl - money;
		});
	}
	return ttl;
};

/**
 * @param {?Donation} don 
 * @returns ?String can be null for anonymous donors
 */
Donation.donorName = function (don) {
	if (!don) return null;
	This.assIsa(don);
	// did they ask to be anonymous?
	if (don.anonymous) return null;
	if (!don.donor) return don.donorName; // draft
	return don.donor.name || don.donor.id && _wwutils.XId.prettyName(don.donor.id) || null;
};

/**
 * 
 * @param {Donation} don 
 * @returns {Money}
 */
Donation.amount = function (don) {
	return This.assIsa(don) && don.amount;
};

/**
 * @param {Donation} don 
 * @returns fundraiser ID or null
 */
Donation.fundRaiser = function (don) {
	return This.assIsa(don) && don.fundRaiser;
};

Donation.make = function () {
	var base = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

	// to must be a charity
	if (base.to) {
		var charity = _DataStore2.default.getValue('data', _C.C.TYPES.NGO, base.to);
		if (!charity) console.error("Donation not to a charity?! " + base.to, base);
	}
	var ma = _extends({
		'@type': _C.C.TYPES.Donation,
		/* The user's contribution (this is what the user pays; not what the charity recieves) */
		amount: _Money2.default.make(),
		id: (0, _DataClass.nonce)()
	}, base);
	Donation.assIsa(ma);
	return ma;
};