'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _sjtest = require('sjtest');

var _DataClass = require('../DataClass');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Citation = {};
exports.default = Citation;

// duck type: needs URL and year

Citation.isa = function (obj) {
	return (0, _DataClass.isa)(obj, 'Citation') || obj.url && _lodash2.default.isNumber(obj.year);
};
Citation.assIsa = function (obj) {
	return (0, _sjtest.assert)(Citation.isa(obj));
};

Citation.make = function () {
	var base = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

	var cit = {};
	Object.assign(cit, base);
	cit['@type'] = 'Citation';
	return cit;
};