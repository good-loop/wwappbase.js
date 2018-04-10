'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _sjtest = require('sjtest');

var _DataClass = require('./DataClass');

var _wwutils = require('wwutils');

var _Money = require('./charity/Money');

var _Money2 = _interopRequireDefault(_Money);

var _C = require('../../../../src-js/C.js');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Basket = (0, _DataClass.defineType)(_C.C.TYPES.Basket);
var This = Basket;
exports.default = Basket;

// To get a Basket, use ActionMan.getBasketPV

// Basket is normally DRAFT (PUBLISHED = paid for)

Basket.isa = function (obj) {
	return (0, _DataClass.isa)(obj, Basket.type)
	// sneaky place to add safety checks
	&& (0, _wwutils.blockProp)(obj, 'charity', 'Basket.js - use Basket.charityId()') && true;
};

This.eventId = function (obj) {
	return obj.eventId;
};
This.charityId = function (obj) {
	return obj.charityId;
};

Basket.idForUxid = function (uxid) {
	return "for_" + uxid;
};

/**
 * @returns {!Object[]}
 */
Basket.getItems = function (basket) {
	if (!basket.items) basket.items = [];
	return basket.items;
};

/** Add up the prices of all the items in the basket 
 * @returns {Money} never null
*/
Basket.getTotal = function (basket) {
	// Using this clumsy forEach instead of a reduce because this makes it clearer
	// that the total's Money object (thus currency) is based on the first item
	var total = null;
	Basket.getItems(basket).forEach(function (item) {
		_Money2.default.assIsa(item.price);
		// skip over any NaNs
		if (isNaN(item.price.value)) {
			console.warn("Basket.js getTotal: NaN", basket, item);
			return;
		}
		if (total === null) {
			total = item.price;
		} else {
			total = _Money2.default.add(total, item.price);
		}
	});
	if (total && basket.hasTip && _Money2.default.isa(basket.tip)) {
		total = _Money2.default.add(total, basket.tip);
	}
	return total || _Money2.default.make();
};

Basket.make = function () {
	var base = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

	// event??
	var ma = _extends({
		items: [],
		hasTip: true
	}, base, {
		'@type': Basket.type
	});
	Basket.assIsa(ma);
	return ma;
};