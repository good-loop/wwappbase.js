'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _DataClass = require('../DataClass');

var _sjtest = require('sjtest');

var _wwutils = require('wwutils');

var _Project = require('./Project');

var _Project2 = _interopRequireDefault(_Project);

var _Output = require('./Output');

var _Output2 = _interopRequireDefault(_Output);

var _Money = require('./Money');

var _Money2 = _interopRequireDefault(_Money);

var _hashmap = require('hashmap');

var _hashmap2 = _interopRequireDefault(_hashmap);

var _Citation = require('./Citation');

var _Citation2 = _interopRequireDefault(_Citation);

var _easyEnums = require('easy-enums');

var _easyEnums2 = _interopRequireDefault(_easyEnums);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Each Charity (NGO -- which is the thing.org type) has projects.
 * "overall" is a project.
 * Each project has inputs and outputs. 
 * Each output is augmented with impact data.
 * There is a representative project -- this gives the impact that's reported.
 */

/** Data model functions for the NGO data-type */

var NGO = (0, _DataClass.defineType)('NGO');
var This = NGO;
exports.default = NGO;

/**
 * Mostly you should use #displayName()!
 */

NGO.displayName = function (ngo) {
	return ngo.displayName || ngo.name || NGO.id(ngo);
};
NGO.description = function (ngo) {
	return (0, _DataClass.isa)(ngo, 'NGO') && ngo.description;
};
NGO.image = function (ngo) {
	return NGO.assIsa(ngo) && ngo.images;
};
NGO.summaryDescription = function (ngo) {
	return ngo.summaryDescription;
};
NGO.logo = function (item) {
	return item.logo;
};

NGO.PROPS = new _easyEnums2.default('uk_giftaid');

/**
 * Get the summary or description, capped at 280 chars. Can be blank never null.
 */
NGO.shortDescription = function (ngo) {
	return (0, _wwutils.ellipsize)(ngo.summaryDescription || ngo.description || '', 280);
};
NGO.registrationNumbers = function (ngo) {
	// TODO OSCR, companies house
	if (ngo.englandWalesCharityRegNum) return [{ regulator: 'Charity Commission', id: ngo.englandWalesCharityRegNum }];
	return [];
};
/**
 * @return {?Project} the representative project, or null if the charity is not ready.
 */
NGO.getProject = function (ngo) {
	NGO.assIsa(ngo);
	if (!NGO.isReady(ngo)) {
		return null;
	}
	var projects = NGO.getProjects2(ngo);
	// Get most recent, if more than one
	var repProject = projects.reduce(function (best, current) {
		if (!current) return best;
		if (!best) return current;
		return best.year > current.year ? best : current;
	}, null);
	// console.log("getProject", repProject, "from", projects);
	return repProject;
};

NGO.isReady = function (ngo) {
	NGO.assIsa(ngo);
	if (ngo.ready) return true;
	// HACK: handle older data, where ready was per-project
	// TODO upgrade the data
	if (ngo.ready === false) return false;
	if (ngo.projects) {
		if (ngo.projects.filter(function (p) {
			return p.ready;
		}).length) {
			return true;
		}
	}
	return false;
};

/**
 * Prefer: representative, then overall, then any
 * @return {Project[]}
 */
NGO.getProjects2 = function (ngo) {
	var projects = ngo.projects;

	if (!projects) {
		// Wot no projects? Could be a new addition
		NGO.assIsa(ngo);
		return [];
	}
	(0, _sjtest.assert)(_lodash2.default.isArray(projects), ngo);
	// We used to filter for ready, and never show unready. However ready/unready is now set at the charity level
	var readyProjects = projects; //.filter(p => p.ready);

	// Representative and ready for use?
	var repProjects = readyProjects.filter(function (p) {
		return p.isRep;
	});
	if (repProjects.length) return repProjects;

	// ...or fall back.
	var oProjects = readyProjects.filter(function (p) {
		return _Project2.default.isOverall(p);
	});
	if (oProjects.length) return oProjects;

	return readyProjects;
};

NGO.noPublicDonations = function (ngo) {
	return NGO.isa(ngo) && ngo.noPublicDonations;
};

/**
 * @return {Money}
 */
NGO.costPerBeneficiary = function (_ref) {
	var charity = _ref.charity,
	    project = _ref.project,
	    output = _ref.output;

	// Is an override present? Forget calculation and just return that.
	if (output && _Money2.default.isa(output.costPerBeneficiary)) {
		return output.costPerBeneficiary;
	}
	return NGO.costPerBeneficiaryCalc({ charity: charity, project: project, output: output });
};

/**
 * This ignores the override (if set)
 */
NGO.costPerBeneficiaryCalc = function (_ref2) {
	var charity = _ref2.charity,
	    project = _ref2.project,
	    output = _ref2.output;

	var outputCount = output.number;
	if (!outputCount) return null;
	var projectCost = _Project2.default.getTotalCost(project);
	if (!projectCost) {
		console.warn("No project cost?!", project);
		return null;
	}
	_Money2.default.assIsa(projectCost);
	if (!_lodash2.default.isNumber(outputCount)) {
		console.error("NGO.js - Not a number?! " + outputCount, "from", output);
		return 1 / 0; // NaN
	}
	(0, _sjtest.assMatch)(outputCount, Number, "NGO.js outputCount not a Number?! " + outputCount);
	var costPerOutput = _Money2.default.make(projectCost);
	costPerOutput.value = projectCost.value / outputCount;
	costPerOutput.value100 = Math.round(100 * costPerOutput.value);
	return costPerOutput;
};

/**
 * @returns {Citation[]} all the citations found
 */
NGO.getCitations = function (charity) {
	var refs = [];
	recurse(charity, function (node) {
		if (node['@type'] === 'Citation') {
			refs.push(node);
		} else if (node.source) {
			console.warn("converting to citation", node);
			refs.push(_Citation2.default.make(node));
		}
	});
	refs = _lodash2.default.uniq(refs);
	return refs;
};

/**
 * @param fn (value, key) -> `false` if you want to stop recursing deeper down this branch. Note: falsy will not stop recursion.
 * @returns nothing -- operates via side-effects
 */
var recurse = function recurse(obj, fn, seen) {
	if (!obj) return;
	if (_lodash2.default.isString(obj) || _lodash2.default.isNumber(obj) || _lodash2.default.isBoolean(obj)) {
		return;
	}
	// no loops
	if (!seen) seen = new _hashmap2.default();
	if (seen.has(obj)) return;
	seen.set(obj, true);

	var keys = Object.keys(obj);
	keys.forEach(function (k) {
		var v = obj[k];
		if (v === null || v === undefined) {
			return;
		}
		var ok = fn(v, k);
		if (ok !== false) {
			recurse(v, fn, seen);
		}
	});
};