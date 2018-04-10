'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _sjtest = require('sjtest');

var _DataClass = require('./DataClass');

var _wwutils = require('wwutils');

var _Money = require('./charity/Money');

var _Money2 = _interopRequireDefault(_Money);

var _C = require('../../../../src-js/C.js');

var _youAgain = require('you-again');

var _youAgain2 = _interopRequireDefault(_youAgain);

var _DataStore = require('../plumbing/DataStore');

var _DataStore2 = _interopRequireDefault(_DataStore);

var _ServerIO = require('../plumbing/ServerIO');

var _ServerIO2 = _interopRequireDefault(_ServerIO);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Transfer = (0, _DataClass.defineType)(_C.C.TYPES.Transfer);
var This = Transfer;
exports.default = Transfer;

/** Add up the prices of all the items in the basket 
 * @returns {Money} never null
*/

Transfer.getTotal = function (list, to) {
	(0, _sjtest.assMatch)(to, String);
	// Using this clumsy forEach instead of a reduce because this makes it clearer
	// that the total's Money object (thus currency) is based on the first item
	var total = null;
	list.forEach(function (item) {
		This.assIsa(item);
		var amount = item.amount;
		_Money2.default.assIsa(amount);
		if (item.to !== to) {
			// TODO user with multiple IDs, eg email+Twitter
			// Login.iam(to)
			amount = _Money2.default.mul(amount, -1);
		}
		if (total === null) {
			total = amount;
		} else {
			total = _Money2.default.add(total, amount);
		}
	});
	return total || _Money2.default.make();
};

/**
 * TODO do this server-side
 */
Transfer.getCredit = function (uxid) {
	if (!uxid) uxid = _youAgain2.default.getId();
	if (!uxid) return null;
	var pvCreditToMe = _DataStore2.default.fetch(['list', 'Transfer', 'toFrom:' + _youAgain2.default.getId()], function () {
		return _ServerIO2.default.load('/credit/list', { data: { toFrom: _youAgain2.default.getId() } });
	});
	if (pvCreditToMe.value) {
		// sum them
		var cred = Transfer.getTotal(pvCreditToMe.value.hits, uxid);
		return cred;
	}
	return null;
};