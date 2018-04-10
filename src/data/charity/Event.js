'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _sjtest = require('sjtest');

var _DataClass = require('../DataClass');

var _C = require('../../C');

var _C2 = _interopRequireDefault(_C);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/** impact utils */
var Event = (0, _DataClass.defineType)(_C2.default.TYPES.Event);
exports.default = Event;


Event.make = function () {
	var base = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

	var ma = _extends({
		'@type': _C2.default.TYPES.Event
	}, base);
	Event.assIsa(ma);
	return ma;
};