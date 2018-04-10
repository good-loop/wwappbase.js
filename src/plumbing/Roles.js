'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _youAgain = require('you-again');

var _youAgain2 = _interopRequireDefault(_youAgain);

var _DataStore = require('./DataStore');

var _DataStore2 = _interopRequireDefault(_DataStore);

var _sjtest = require('sjtest');

var _promiseValue = require('promise-value');

var _promiseValue2 = _interopRequireDefault(_promiseValue);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// TODO switch from storing can:x to role:x with app-defined cans

/**
 * @returns {PromiseValue<String[]>}
 */
var getRoles = function getRoles() {
	if (!_youAgain2.default.isLoggedIn()) {
		return (0, _promiseValue2.default)([]);
	}
	var uxid = _youAgain2.default.getId();
	if (!uxid) {
		// debug paranoia
		console.error("Roles.js huh? " + _youAgain2.default.isLoggedIn() + " but " + _youAgain2.default.getId());
		return (0, _promiseValue2.default)([]);
	}
	var shared = _DataStore2.default.fetch(['misc', 'roles', uxid], function () {
		var req = _youAgain2.default.getSharedWith({ prefix: "role:*" });
		return req.then(function (res) {
			if (!res.success) {
				console.error(res);
				return null;
			}
			var shares = res.cargo;
			var roles = shares.filter(function (s) {
				return s.item && s.item.substr(0, 5) === 'role:';
			}).map(function (s) {
				return s.item.substr(5);
			});
			roles = Array.from(new Set(roles)); // de dupe
			return roles;
		});
	});
	return shared;
};

/**
 * Can the current user do this?
 * Will fetch by ajax if unset.
 * 
 * Example:
 * ```
 * 	let {promise,value} = Roles.iCan('eat:sweets');
 * 	if (value) { eat sweets }
 * 	else if (value === false) { no sweets }
 * 	else { waiting on ajax }	
 * ```
 * 
 * @returns {PromiseValue<Boolean>}
 */
var iCan = function iCan(capability) {
	(0, _sjtest.assMatch)(capability, String);
	var proles = getRoles();
	if (proles.value) {
		for (var i = 0; i < proles.value.length; i++) {
			var cans = cans4role[proles.value[i]];
			if (!cans) {
				console.error("Roles.js - unknown role: " + proles.value[i]);
				continue;
			}
			if (cans.indexOf(capability) !== -1) return (0, _promiseValue2.default)(true);
		}
		return (0, _promiseValue2.default)(false);
	}
	// ajax...
	return proles.promise.then(function (res) {
		return iCan(capability);
	});
};

var cans4role = {};

var defineRole = function defineRole(role, cans) {
	(0, _sjtest.assMatch)(role, String);
	(0, _sjtest.assMatch)(cans, "String[]");
	cans4role[role] = cans;
};

var Roles = {
	iCan: iCan,
	defineRole: defineRole,
	getRoles: getRoles
};

exports.default = Roles;