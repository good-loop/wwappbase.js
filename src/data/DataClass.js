'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.nonce = exports.Meta = exports.getId = exports.getType = exports.isa = exports.defineType = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; /**
                                                                                                                                                                                                                                                                  */

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _sjtest = require('sjtest');

var _wwutils = require('wwutils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Coding Style??
 * 
 * These files are all about defining a convention, so let's set some rules??
 * 
 * 
 */

/**
 * check the type!
 */
var isa = function isa(obj, typ) {
	if (!_lodash2.default.isObject(obj) || obj.length) return false;
	return getType(obj) === typ;
};

/**
 * Uses schema.org or gson class to get the type.
 * Or null
 */
var getType = function getType(item) {
	// schema.org type?
	var type = item['@type'];
	if (type) return type;
	// Java class from FlexiGson?
	var klass = item['@class'];
	if (!klass) return null;
	type = klass.substr(klass.lastIndexOf('.') + 1);
	return type;
};

/**
 * Prefers a plain .id but also supports schema.org @id.
 * null returns null
 */
var getId = function getId(item) {
	if (!item) return null;
	if (item.id && item['@id'] && item.id !== item['@id']) {
		console.warn("conflicting id/@id item ids " + item.id + " vs " + item['@id'], item);
	}
	return item.id || item['@id'];
};

/**
 * access functions for source, help, notes??
 */
var Meta = {};

/** {notes, source} if set
 * Never null (may create an empty map). Do NOT edit the returned value! */
// If foo is an object and bar is a primitive node, then foo.bar has meta info stored at foo.meta.bar
Meta.get = function (obj, fieldName) {
	if (!fieldName) {
		return obj.meta || {};
	}
	var fv = obj[fieldName];
	if (fv && fv.meta) return fv.meta;
	if (obj.meta && obj.meta[fieldName]) {
		return obj.meta[fieldName];
	}
	// nope
	return {};
};

/**
 * nonce vs uid? nonce is shorter (which is nice) and it avoids -s (which upset ES searches if type!=keyword)
 * @param {*} n 
 * @returns random url-safe nonce of the requested length.
 * 
 * Let's see:
 * 60^6 ~ 50 bn
 * But the birthday paradox gives n^2 pairings, so consider n^2 for likelihood of a clash.
 * For n = 1000 items, this is safe. For n = 1m items, 6 chars isn't enough - add a timestamp to avoid the all-to-all pairings.
 */
var nonce = function nonce() {
	var n = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 6;

	var s = [];
	var az = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
	for (var i = 0; i < n; i++) {
		s[i] = az.substr(Math.floor(Math.random() * az.length), 1);
	}
	return s.join("");
};

/**
 * Setup the "standard" DataClass functions.
 * @param {!String} type 
 */
var defineType = function defineType(type) {
	(0, _sjtest.assMatch)(type, String);
	var This = {};
	This.type = type;
	This['@type'] = 'DataClass';
	This.isa = function (obj) {
		return isa(obj, type);
	};
	This.assIsa = function (obj, msg) {
		return (0, _sjtest.assert)(This.isa(obj), (msg || '') + " " + type + " expected, but got " + obj);
	};
	This.name = function (obj) {
		return obj && obj.name;
	};
	/** convenience for getId() */
	This.id = function (obj) {
		return This.assIsa(obj) && getId(obj);
	};
	This.make = function () {
		var base = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

		return _extends({
			'@type': This.type
		}, base);
	};
	return This;
};

exports.defineType = defineType;
exports.isa = isa;
exports.getType = getType;
exports.getId = getId;
exports.Meta = Meta;
exports.nonce = nonce;