'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _sjtest = require('sjtest');

var _youAgain = require('you-again');

var _youAgain2 = _interopRequireDefault(_youAgain);

var _promiseValue = require('promise-value');

var _promiseValue2 = _interopRequireDefault(_promiseValue);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _C = require('../../../../src-js/C.js');

var _ServerIO = require('./ServerIO');

var _ServerIO2 = _interopRequireDefault(_ServerIO);

var _DataStore = require('./DataStore');

var _DataStore2 = _interopRequireDefault(_DataStore);

var _DataClass = require('../data/DataClass');

var _NGO = require('../data/charity/NGO');

var _NGO2 = _interopRequireDefault(_NGO);

var _FundRaiser = require('../data/charity/FundRaiser');

var _FundRaiser2 = _interopRequireDefault(_FundRaiser);

var _Donation = require('../data/charity/Donation');

var _Donation2 = _interopRequireDefault(_Donation);

var _Project = require('../data/charity/Project');

var _Project2 = _interopRequireDefault(_Project);

var _Money = require('../data/charity/Money');

var _Money2 = _interopRequireDefault(_Money);

var _Ticket = require('../data/charity/Ticket');

var _Ticket2 = _interopRequireDefault(_Ticket);

var _Basket = require('../data/Basket');

var _Basket2 = _interopRequireDefault(_Basket);

var _Output = require('../data/charity/Output');

var _Output2 = _interopRequireDefault(_Output);

var _Citation = require('../data/charity/Citation');

var _Citation2 = _interopRequireDefault(_Citation);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var addCharity = function addCharity() {
	// TODO search the database for potential matches, and confirm with the user
	// get the info (just the name)
	var item = _DataStore2.default.appstate.widget.AddCharityWidget.form;
	(0, _sjtest.assert)(item.name);
	// TODO message the user!
	_ServerIO2.default.addCharity(item).then(function (res) {
		console.log("AddCharity", res);
		var charity = res.cargo;
		_DataStore2.default.setValue(['widget', 'AddCharityWidget', 'result', 'id'], _NGO2.default.id(charity));
	});
};

var addProject = function addProject(_ref) {
	var charity = _ref.charity,
	    isOverall = _ref.isOverall;

	(0, _sjtest.assert)(_NGO2.default.isa(charity));
	var item = _DataStore2.default.appstate.widget.AddProject.form;
	if (isOverall) item.name = _Project2.default.overall;
	var proj = _Project2.default.make(item);
	// add to the charity	
	if (!charity.projects) charity.projects = [];
	charity.projects.push(proj);
	// clear the form
	_DataStore2.default.setValue(['widget', 'AddProject', 'form'], {});
};

var removeProject = function removeProject(_ref2) {
	var charity = _ref2.charity,
	    project = _ref2.project;

	(0, _sjtest.assert)(_NGO2.default.isa(charity));
	var i = charity.projects.indexOf(project);
	charity.projects.splice(i, 1);
	// update
	_DataStore2.default.update();
};

var addInputOrOutput = function addInputOrOutput(_ref3) {
	var list = _ref3.list,
	    ioPath = _ref3.ioPath,
	    formPath = _ref3.formPath;

	(0, _sjtest.assert)(_lodash2.default.isArray(list), list);
	var item = _DataStore2.default.getValue(formPath);
	// Copy the form value to be safe against shared state? Not needed now setValue {} works.
	// item = Object.assign({}, item);
	// add to the list
	list.push(item);
	// clear the form
	_DataStore2.default.setValue(formPath, {});
};

var addDataSource = function addDataSource(_ref4) {
	var list = _ref4.list,
	    srcPath = _ref4.srcPath,
	    formPath = _ref4.formPath;

	(0, _sjtest.assert)(_lodash2.default.isArray(list), list);
	var citation = _Citation2.default.make(_DataStore2.default.getValue(formPath));

	list.push(citation);
	_DataStore2.default.setValue(srcPath, list);

	// clear the form
	_DataStore2.default.setValue(formPath, {});
};

var donate = function donate(_ref5) {
	var charity = _ref5.charity,
	    formPath = _ref5.formPath,
	    formData = _ref5.formData,
	    stripeResponse = _ref5.stripeResponse;

	var donationParams = {
		action: 'donate',
		charityId: _NGO2.default.id(charity),
		currency: formData.amount.currency,
		value: formData.amount.value,
		value100: Math.floor(formData.amount.value * 100),
		giftAid: formData.giftAid,
		name: formData.name,
		address: formData.address,
		postcode: formData.postcode,
		stripeToken: stripeResponse.id,
		stripeTokenType: stripeResponse.type,
		stripeEmail: stripeResponse.email
	};
	_Money2.default.assIsa(donationParams);

	// Add impact to submitted data
	var project = _NGO2.default.getProject(charity);
	if (project && project.outputs) {
		var donationImpacts = project.outputs.map(function (output) {
			return _Output2.default.scaleByDonation(output, donationParams);
		});
		donationParams.impacts = JSON.stringify(donationImpacts);
	}

	_ServerIO2.default.donate(donationParams).then(function (response) {
		_DataStore2.default.setValue(formPath, _extends({}, formData, {
			pending: false,
			complete: true
		}));
	}, function (error) {});

	_DataStore2.default.setValue(formPath, _extends({}, formData, {
		pending: true
	}));
};

/**
 * id=for{user.id}, becuase a user only has one basket
 */
var getBasketPV = function getBasketPV(uxid) {
	if (!uxid) {
		uxid = _youAgain2.default.getId() || _youAgain2.default.getTempId();
	}
	var bid = _Basket2.default.idForUxid(uxid);
	// Basket is normally DRAFT (PUBLISHED = paid for)
	var pvbasket = ActionMan.getDataItem({ type: _C.C.TYPES.Basket, id: bid, status: _C.C.KStatus.DRAFT, swallow: true });
	if (pvbasket.value) return pvbasket;
	// loading - or maybe we have to make a new basket
	var pGetMake = pvbasket.promise.fail(function (err) {
		console.log("make a new basket");
		var basket = _Basket2.default.make({ id: bid });
		_DataStore2.default.setData(basket);
		return basket;
	});
	return (0, _promiseValue2.default)(pGetMake);
};

/**
 * 
 * @param {!Basket} basket 
 * @param {!Ticket} item 
 */
var addToBasket = function addToBasket(basket, item) {
	console.log("addFromBasket", basket, item);
	(0, _sjtest.assert)(item, basket);
	_Basket2.default.assIsa(basket);
	(0, _sjtest.assert)(item.id, item); // need an ID
	// copy so we can safely modify elsewhere
	// copy a ticket
	if (_Ticket2.default.isa(item)) {
		item = _Ticket2.default.make(item, item.eventId);
	} else {
		console.log("addToBasket - not a Ticket", item);
		item = _lodash2.default.cloneDeep(item);
	}
	basket.items = (basket.items || []).concat(item);
	_DataStore2.default.setData(basket);
	return basket;
};

var removeFromBasket = function removeFromBasket(basket, item) {
	console.log("removeFromBasket", basket, item);
	(0, _sjtest.assert)(item);
	_Basket2.default.assIsa(basket);
	// remove the first matching item (Note: items can share an ID)	
	var i = basket.items.findIndex(function (itm) {
		return (0, _DataClass.getId)(itm) === (0, _DataClass.getId)(item);
	});
	if (i === -1) {
		return;
	}
	basket.items.splice(i, 1);
	_DataStore2.default.setData(basket);
	return basket;
};

var getBasketPath = function getBasketPath(uxid) {
	if (!uxid) {
		uxid = _youAgain2.default.getId() || _youAgain2.default.getTempId();
	}
	var bid = _Basket2.default.idForUxid(uxid);
	return ['data', _C.C.TYPES.Basket, bid];
};

/**
 * NB: uses a pseudo id of `draft-to:X`
 * 
 * {
 * 	item: {?NGO|FundRaiser},
 * 	charity: {?String} id
 * 	fundRaiser: {?String} id
 * }
 */
var getDonationDraft = function getDonationDraft(_ref6) {
	var item = _ref6.item,
	    charity = _ref6.charity,
	    fundRaiser = _ref6.fundRaiser;

	(0, _sjtest.assMatch)(charity, "?String");
	(0, _sjtest.assMatch)(fundRaiser, "?String");
	// ID info from item
	if (item) {
		if (_NGO2.default.isa(item)) charity = (0, _DataClass.getId)(item);
		if (_FundRaiser2.default.isa(item)) {
			fundRaiser = (0, _DataClass.getId)(item);
			// can we get a charity?
			var fCharity = _FundRaiser2.default.charityId(item);
			if (!charity) charity = fCharity;
			(0, _sjtest.assert)(charity === fCharity);
		}
	}
	// for fundraiser if known, or charity
	var forId = fundRaiser || charity;
	(0, _sjtest.assMatch)(forId, String, "getDonationDraft() expects an id string");
	// use a pseudo id to keep it in the local DataStore
	var from = _youAgain2.default.getId();
	return _DataStore2.default.fetch(['data', _C.C.TYPES.Donation, 'from:' + from, 'draft-to:' + forId], function () {
		return _ServerIO2.default.getDonationDraft({ from: from, charity: charity, fundRaiser: fundRaiser }).then(function (res) {
			console.warn("getDonationDraft", res, 'NB: take cargo.hits.0');
			var cargo = res.cargo;
			var dontn = cargo.hits && cargo.hits[0];
			if (!dontn) {
				// make a new draft donation
				dontn = _Donation2.default.make({
					to: charity,
					fundRaiser: fundRaiser,
					via: _FundRaiser2.default.isa(item) ? _FundRaiser2.default.oxid(item) : null,
					from: from,
					amount: _Money2.default.make({ value: 10, currency: 'gbp' }),
					coverCosts: true
				});
				console.warn('donationDraft-new', dontn);
			}
			// store in data by ID (the fetch stores under draft-to)
			_DataStore2.default.setData(dontn);
			return dontn;
		}); // ./then()
	}); // ./fetch()
};

var ActionMan = {
	addCharity: addCharity,
	addProject: addProject, removeProject: removeProject,
	addInputOrOutput: addInputOrOutput,
	addDataSource: addDataSource,
	donate: donate,
	getDonationDraft: getDonationDraft,
	getBasketPV: getBasketPV,
	addToBasket: addToBasket,
	removeFromBasket: removeFromBasket,
	getBasketPath: getBasketPath
};

exports.default = ActionMan;