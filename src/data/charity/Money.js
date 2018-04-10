'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _sjtest = require('sjtest');

var _DataClass = require('../DataClass');

var _C = require('../../../../../src-js/C.js');

/** impact utils */
var Money = {};
var This = Money;
exports.default = Money;

/* 

{
	currency: {String}
	value: {String|Number} The Java backend stores values as String and uses BigDecimal to avoid numerical issues.
	The front end generally handles them as Number, but sometimes as String.
}

*/
// ref: https://stackoverflow.com/questions/18082/validate-decimal-numbers-in-javascript-isnumeric

var isNumeric = function isNumeric(value) {
	return !isNaN(value - parseFloat(value));
};

/**
 * 
 * @param {?Money} ma 
 * @returns {Number}
 */
Money.value = function (ma) {
	if (!ma) return 0;
	if (ma.value === undefined) {
		// Patch bad server data?
		if (ma.value100) ma.value = ma.value100 / 100;else return 0;
	}
	return parseFloat(ma.value);
};

// duck type: needs a value
Money.isa = function (obj) {
	if (!obj) return false;
	if ((0, _DataClass.isa)(obj, _C.C.TYPES.Money)) return true;
	// allow blank values
	if (isNumeric(obj.value) || obj.value === '') return true;
};

Money.assIsa = function (obj, msg) {
	return (0, _sjtest.assert)(Money.isa(obj), "Money.js - not Money " + (msg || '') + " " + JSON.stringify(obj));
};

Money.make = function () {
	var base = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

	var item = _extends({
		value: 0, // default
		currency: 'GBP' }, base, { // Base comes after defaults so it overrides
		'@type': _C.C.TYPES.Money // @type always last so it overrides any erroneous base.type
	});

	Money.assIsa(item);
	return item;
};

/**
 * Check currencies match. Case insensitive.
 */
var assCurrencyEq = function assCurrencyEq(a, b, msg) {
	var m = "Money.js assCurrencyEq " + (msg || '') + " a:" + JSON.stringify(a) + "  b:" + JSON.stringify(b);
	Money.assIsa(a, m);
	Money.assIsa(b, m);
	// allow no-currency to padd
	if (!a.currency || !b.currency) {
		return true;
	}
	(0, _sjtest.assert)(typeof a.currency === 'string' && typeof b.currency === 'string', m);
	(0, _sjtest.assert)(a.currency.toUpperCase() === b.currency.toUpperCase(), m);
};

// Will fail if not called on 2 Moneys of the same currency
Money.add = function (amount1, amount2) {
	Money.assIsa(amount1);
	Money.assIsa(amount2);
	assCurrencyEq(amount1, amount2, "add()");
	return Money.make(_extends({}, amount1, {
		value: amount1.value + amount2.value
	}));
};

// Will fail if not called on 2 Moneys of the same currency
Money.sub = function (amount1, amount2) {
	Money.assIsa(amount1);
	Money.assIsa(amount2);
	assCurrencyEq(amount1, amount2, "sub");
	return Money.make(_extends({}, amount1, {
		value: amount1.value - amount2.value
	}));
};

/** Must be called on a Money and a scalar */
Money.mul = function (amount, multiplier) {
	Money.assIsa(amount);
	(0, _sjtest.assert)(isNumeric(multiplier), "Money.js - mul() " + multiplier);
	// TODO Assert that multiplier is numeric (kind of painful in JS)
	return Money.make(_extends({}, amount, {
		value: amount.value * multiplier
	}));
};

/** 
 * Called on two Moneys
 * @returns {Number}
 */
Money.divide = function (total, part) {
	Money.assIsa(total);
	Money.assIsa(part);
	assCurrencyEq(total, part);
	return Money.value(total) / Money.value(part);
};