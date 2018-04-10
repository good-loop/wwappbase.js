'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.CreateButton = undefined;

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _reactDom = require('react-dom');

var _reactDom2 = _interopRequireDefault(_reactDom);

var _sjtest = require('sjtest');

var _sjtest2 = _interopRequireDefault(_sjtest);

var _youAgain = require('you-again');

var _youAgain2 = _interopRequireDefault(_youAgain);

var _printer = require('../utils/printer.js');

var _printer2 = _interopRequireDefault(_printer);

var _wwutils = require('wwutils');

var _C = require('../C');

var _C2 = _interopRequireDefault(_C);

var _Roles = require('../Roles');

var _Roles2 = _interopRequireDefault(_Roles);

var _Misc = require('./Misc');

var _Misc2 = _interopRequireDefault(_Misc);

var _DataStore = require('../plumbing/DataStore');

var _DataStore2 = _interopRequireDefault(_DataStore);

var _ServerIO = require('../plumbing/ServerIO');

var _ServerIO2 = _interopRequireDefault(_ServerIO);

var _DataClass = require('../data/DataClass');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Provide a list of items of a given type.
 * Clicking on an item sets it as the nav value.
 * Get the item id via:
 * 
 * 	const path = DataStore.getValue(['location','path']);
 * 	const itemId = path[1];
 *  let pvItem = itemId? ActionMan.getDataItem(itemId) : null;
 * 
 * 
 * @param status {?String} e.g. "Draft"
 * @param servlet {?String} e.g. "publisher" Normally unset, and taken from the url.
 * @param ListItem {?React component} if set, replaces DefaultListItem
 */
var ListLoad = function ListLoad(_ref) {
	var type = _ref.type,
	    status = _ref.status,
	    servlet = _ref.servlet,
	    navpage = _ref.navpage,
	    q = _ref.q,
	    ListItem = _ref.ListItem,
	    checkboxes = _ref.checkboxes;

	(0, _sjtest.assert)(_C2.default.TYPES.has(type), "ListLoad - odd type " + type);
	(0, _sjtest.assert)(!status || _C2.default.KStatus.has(status), "ListLoad - odd status " + status);
	var path = _DataStore2.default.getValue(['location', 'path']);
	var id = path[1];
	if (id) return null;
	if (!servlet) servlet = _DataStore2.default.getValue('location', 'path')[0]; //type.toLowerCase();
	if (!navpage) navpage = servlet;
	if (!servlet) {
		console.warn("ListLoad - no servlet? type=" + type);
		return null;
	}
	(0, _sjtest.assMatch)(servlet, String);
	(0, _sjtest.assMatch)(navpage, String);
	// store the lists in a separate bit of appstate
	// from data. 
	// Downside: new events dont get auto-added to lists
	// Upside: clearer
	var pvItems = _DataStore2.default.fetch(['list', type, 'all'], function () {
		return _ServerIO2.default.load('/' + servlet + '/list.json', { data: { status: status, q: q } }).then(function (res) {
			// console.warn(res);
			return res.cargo.hits;
		});
	});
	if (!pvItems.resolved) {
		return _react2.default.createElement(_Misc2.default.Loading, { text: type.toLowerCase() + 's' });
	}
	if (!ListItem) {
		ListItem = DefaultListItem;
	}
	console.warn("items", pvItems.value);
	var listItems = pvItems.value.map(function (item) {
		return _react2.default.createElement(ListItem, { key: (0, _DataClass.getId)(item) || JSON.stringify(item),
			type: type,
			servlet: servlet,
			navpage: navpage,
			item: item,
			onPick: onPick,
			checkboxes: checkboxes });
	});
	return _react2.default.createElement(
		'div',
		null,
		pvItems.value.length === 0 ? 'No results found' : null,
		listItems
	);
};

var onPick = function onPick(_ref2) {
	var event = _ref2.event,
	    navpage = _ref2.navpage,
	    id = _ref2.id;

	if (event) {
		event.stopPropagation();
		event.preventDefault();
	}
	(0, _wwutils.modifyHash)([navpage, id]);
};

/**
 * These can be clicked or control-clicked :(
 */
var DefaultListItem = function DefaultListItem(_ref3) {
	var type = _ref3.type,
	    servlet = _ref3.servlet,
	    navpage = _ref3.navpage,
	    item = _ref3.item,
	    checkboxes = _ref3.checkboxes;

	if (!navpage) navpage = servlet;
	var id = (0, _DataClass.getId)(item);
	var itemUrl = (0, _wwutils.modifyHash)([servlet, id], null, true);
	var checkedPath = ['widget', 'ListLoad', type, 'checked'];
	return _react2.default.createElement(
		'div',
		{ className: 'ListItemWrapper' },
		checkboxes ? _react2.default.createElement(
			'div',
			{ className: 'pull-left' },
			_react2.default.createElement(_Misc2.default.PropControl, { title: 'TODO mass actions', path: checkedPath, type: 'checkbox', prop: id })
		) : null,
		_react2.default.createElement(
			'a',
			{ href: itemUrl,
				onClick: function onClick(event) {
					return onPick({ event: event, navpage: navpage, id: id });
				},
				className: 'ListItem btn btn-default status-' + item.status
			},
			_C2.default.KStatus.isPUBLISHED(item.status) ? _react2.default.createElement(
				'span',
				{ className: 'text-success' },
				_react2.default.createElement(_Misc2.default.Icon, { glyph: 'tick' })
			) : item.status,
			item.name || id,
			_react2.default.createElement('br', null),
			_react2.default.createElement(
				'small',
				null,
				'id: ',
				id
			)
		)
	);
};

/**
 * Make a local blank, and set the nav url
 * Does not save (Crud will probably do that once you make an edit)
 * @param {
 * 	base: {?Object} use to make the blank.
 * 	make: {?Function} use to make the blank. base -> base
 * }
 */
var createBlank = function createBlank(_ref4) {
	var type = _ref4.type,
	    navpage = _ref4.navpage,
	    base = _ref4.base,
	    make = _ref4.make;

	(0, _sjtest.assert)(!(0, _DataClass.getId)(base), "ListLoad - createBlank - no ID (could be an object reuse bug) " + type);
	// Call the make?
	if (make) {
		base = make(base);
	}
	if (!base) base = {};
	// make an id?
	if (!(0, _DataClass.getId)(base)) {
		var _id = (0, _DataClass.nonce)(8);
		base.id = _id;
	}
	var id = (0, _DataClass.getId)(base);
	if (!(0, _DataClass.getType)(base)) base['@type'] = type;
	// poke a new blank into DataStore
	_DataStore2.default.setValue(['data', type, id], base);
	// set the id
	onPick({ navpage: navpage, id: id });
	// invalidate lists
	_DataStore2.default.invalidateList(type);
};

var CreateButton = function CreateButton(_ref5) {
	var type = _ref5.type,
	    navpage = _ref5.navpage,
	    base = _ref5.base,
	    make = _ref5.make;

	if (!navpage) navpage = _DataStore2.default.getValue('location', 'path')[0];
	return _react2.default.createElement(
		'button',
		{ className: 'btn btn-default', onClick: function onClick() {
				return createBlank({ type: type, navpage: navpage, base: base, make: make });
			} },
		_react2.default.createElement(_Misc2.default.Icon, { glyph: 'plus' }),
		' Create'
	);
};

exports.CreateButton = CreateButton;
exports.default = ListLoad;