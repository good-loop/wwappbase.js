'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _sjtest = require('sjtest');

var _DataClass = require('../DataClass');

var _Money = require('./Money');

var _Money2 = _interopRequireDefault(_Money);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/** Data model functions for the NGO data-type */

var Project = (0, _DataClass.defineType)('Project');
var This = Project;
exports.default = Project;


Project.overall = 'overall';

Project.name = function (ngo) {
	return ngo.name;
};
Project.year = function (ngo) {
	return This.assIsa(ngo, Project.type) && ngo.year;
};

Project.isOverall = function (project) {
	return Project.assIsa(project) && project.name && project.name.toLowerCase() === Project.overall;
};

/**
 * 
 @return {Output[]} never null
 */
Project.outputs = function (project) {
	Project.assIsa(project);
	return project.outputs || [];
};

Project.make = function (base) {
	var proj = {
		inputs: [{ "@type": "Money", "name": "annualCosts", "currency": "GBP" }, { "@type": "Money", "name": "fundraisingCosts", "currency": "GBP" }, { "@type": "Money", "name": "tradingCosts", "currency": "GBP" }, { "@type": "Money", "name": "incomeFromBeneficiaries", "currency": "GBP" }],
		outputs: []
	};
	proj['@type'] = Project.type;
	proj = _lodash2.default.extend(proj, base);
	// ensure year is the right type
	proj.year = parseInt(proj.year);
	return proj;
};

Project.getLatest = function (projects) {
	if (!projects) return null;
	var psorted = _lodash2.default.sortBy(projects, Project.year);
	return psorted[psorted.length - 1];
};

Project.getTotalCost = function (project) {
	var currency = project.inputs.reduce(function (curr, input) {
		return curr || input.currency;
	}, null);
	var value = project.inputs.reduce(function (total, input) {
		if (deductibleInputs.indexOf(input.name) < 0) {
			return total + (input.value || 0);
		}
		return total - (input.value || 0);
	}, 0);
	return _Money2.default.make({ currency: currency, value: value });
};

var deductibleInputs = ['incomeFromBeneficiaries', 'fundraisingCosts', 'tradingCosts'];