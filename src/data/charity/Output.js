'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _sjtest = require('sjtest');

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _DataClass = require('../DataClass');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* Output type, which also does Impact: 
{
	name {String}
	number: {Number} Number of units output, e.g. the number of malaria nets
	cost: {Money} total cost, ie cost = costPerOutput * number
	costPerOutput {Money}
	amount: {String} non-numerical descriptions of how much was output
	confidence {String}
	description: {String}
	start: {Date}
	end: {Date}
	order: {Number} for display lists
	year: {Number}
}
*/

/** impact utils */
var Output = (0, _DataClass.defineType)('Output');
var This = Output;
exports.default = Output;


Output.number = function (obj) {
	return This.assIsa(obj) && obj.number;
};
Output.cost = function (obj) {
	return This.assIsa(obj) && obj.cost;
};

Output.make = function () {
	var base = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

	(0, _sjtest.assMatch)(base.amount, "?String", base);
	return _extends({
		'@type': This.type
	}, base);
};

/**
 * A scaled version 
 * @param donationAmount {Money}
 */
Output.scaleByDonation = function (output, donationAmount) {
	// deep copy
	var impact = _lodash2.default.cloneDeep(output);
	// TODO scaled by donationAmount
	// TODO change units if necc
	// TODO Java needs a mirror of this :(
	console.error("scale!", impact, donationAmount);
	return impact;
};