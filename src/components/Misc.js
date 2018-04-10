'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _reactBootstrap = require('react-bootstrap');

var _sjtest = require('sjtest');

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _easyEnums = require('easy-enums');

var _easyEnums2 = _interopRequireDefault(_easyEnums);

var _wwutils = require('wwutils');

var _promiseValue = require('promise-value');

var _promiseValue2 = _interopRequireDefault(_promiseValue);

var _reactDropzone = require('react-dropzone');

var _reactDropzone2 = _interopRequireDefault(_reactDropzone);

var _DataStore = require('../plumbing/DataStore');

var _DataStore2 = _interopRequireDefault(_DataStore);

var _ActionMan = require('../plumbing/ActionMan');

var _ActionMan2 = _interopRequireDefault(_ActionMan);

var _ServerIO = require('../plumbing/ServerIO');

var _ServerIO2 = _interopRequireDefault(_ServerIO);

var _printer = require('../utils/printer');

var _printer2 = _interopRequireDefault(_printer);

var _C = require('../../../../src-js/C.js');

var _Money = require('../data/charity/Money');

var _Money2 = _interopRequireDefault(_Money);

var _reactAutocomplete = require('react-autocomplete');

var _reactAutocomplete2 = _interopRequireDefault(_reactAutocomplete);

var _DataClass = require('../data/DataClass');

var _md = require('md5');

var _md2 = _interopRequireDefault(_md);

var _Settings = require('../plumbing/Settings');

var _Settings2 = _interopRequireDefault(_Settings);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

// FormControl removed in favour of basic <inputs> while debugging input lag

// import I18n from 'easyi18n';


var Misc = {};

/**
E.g. "Loading your settings...""
*/
Misc.Loading = function (_ref) {
	var text = _ref.text;
	return _react2.default.createElement(
		'div',
		null,
		_react2.default.createElement('span', { className: 'glyphicon glyphicon-cog spinning' }),
		' Loading ',
		text || '',
		'...'
	);
};

/**
 * 
 * @param {
 * 	TODO?? noPadding: {Boolean} switch off Bootstrap's row padding.
 * }
 */
Misc.Col2 = function (_ref2) {
	var children = _ref2.children;
	return _react2.default.createElement(
		'div',
		{ className: 'container-fluid' },
		_react2.default.createElement(
			'div',
			{ className: 'row' },
			_react2.default.createElement(
				'div',
				{ className: 'col-md-6 col-sm-6' },
				children[0]
			),
			_react2.default.createElement(
				'div',
				{ className: 'col-md-6 col-sm-6' },
				children[1]
			)
		)
	);
};

var CURRENCY = {
	gbp: "£",
	usd: "$"
};
/**
 * Money span, falsy displays as 0
 * 
 * @param amount {Money|Number}
 */
Misc.Money = function (_ref3) {
	var amount = _ref3.amount,
	    minimumFractionDigits = _ref3.minimumFractionDigits,
	    _ref3$maximumFraction = _ref3.maximumFractionDigits,
	    maximumFractionDigits = _ref3$maximumFraction === undefined ? 2 : _ref3$maximumFraction,
	    maximumSignificantDigits = _ref3.maximumSignificantDigits;

	if (!amount) amount = 0;
	if (_lodash2.default.isNumber(amount) || _lodash2.default.isString(amount)) {
		amount = { value: amount, currency: 'GBP' };
	}
	var value = amount ? amount.value : 0;
	if (maximumFractionDigits === 0) {
		// because if maximumSignificantDigits is also set, these two can conflict
		value = Math.round(value);
	}
	var snum = new Intl.NumberFormat(_Settings2.default.locale, { maximumFractionDigits: maximumFractionDigits, minimumFractionDigits: minimumFractionDigits, maximumSignificantDigits: maximumSignificantDigits }).format(value);
	// let snum;	
	// if ( ! precision) {
	// 	let sv2 = amount.value.toFixed(2);
	// 	snum = printer.prettyNumber2_commas(sv2);
	// } else {	
	// 	snum = printer.prettyNumber(amount.value, precision);
	// }
	if (!minimumFractionDigits) {
		// remove .0 and .00
		if (snum.substr(snum.length - 2) === '.0') snum = snum.substr(0, snum.length - 2);
		if (snum.substr(snum.length - 3) === '.00') snum = snum.substr(0, snum.length - 3);
	}
	// pad .1 to .10
	if (snum.match(/\.\d$/)) snum += '0';

	var currencyCode = (amount.currency || 'gbp').toLowerCase();
	return _react2.default.createElement(
		'span',
		{ className: 'money' },
		_react2.default.createElement(
			'span',
			{ className: 'currency-symbol' },
			CURRENCY[currencyCode]
		),
		_react2.default.createElement(
			'span',
			{ className: 'amount' },
			snum
		)
	);
};
/**
 * Handle a few formats, inc gson-turned-a-Time.java-object-into-json
 * null is also accepted.
 */
Misc.Time = function (_ref4) {
	var time = _ref4.time;

	if (!time) return null;
	try {
		if (_lodash2.default.isString(time)) {
			return _react2.default.createElement(
				'span',
				null,
				new Date(time).toLocaleDateString()
			);
		}
		if (time.ut) {
			return _react2.default.createElement(
				'span',
				null,
				new Date(time.ut).toLocaleDateString()
			);
		}
		return _react2.default.createElement(
			'span',
			null,
			_printer2.default.str(time)
		);
	} catch (err) {
		return _react2.default.createElement(
			'span',
			null,
			_printer2.default.str(time)
		);
	}
};

/** eg a Twitter logo */
Misc.Logo = function (_ref5) {
	var service = _ref5.service,
	    size = _ref5.size,
	    transparent = _ref5.transparent,
	    bgcolor = _ref5.bgcolor,
	    color = _ref5.color;

	(0, _sjtest.assert)(service, 'Misc.Logo');
	if (service === 'twitter' || service === 'facebook' || service === 'instagram') {
		return _react2.default.createElement(Misc.Icon, { fa: service + "-square", size: size === 'small' ? '2x' : '4x', className: 'color-' + service });
	}
	var klass = "img-rounded logo";
	if (size) klass += " logo-" + size;
	var file = '/img/' + service + '-logo.svg';
	if (service === 'instagram') file = '/img/' + service + '-logo.png';
	if (service === _C.C.app.service) {
		file = _C.C.app.logo;
		if (transparent === false) file = '/img/SoGive-Light-70px.png';
	}
	return _react2.default.createElement('img', { alt: service, 'data-pin-nopin': 'true', className: klass, src: file });
}; // ./Logo

/**
 * Font-Awesome or Glyphicon icons
 */
Misc.Icon = function (_ref6) {
	var glyph = _ref6.glyph,
	    fa = _ref6.fa,
	    size = _ref6.size,
	    className = _ref6.className,
	    other = _objectWithoutProperties(_ref6, ['glyph', 'fa', 'size', 'className']);

	if (glyph) {
		return _react2.default.createElement('span', _extends({ className: 'glyphicon glyphicon-' + glyph + (size ? ' fa-' + size : '') + (className ? ' ' + className : ''),
			'aria-hidden': 'true' }, other));
	}
	return _react2.default.createElement('i', _extends({ className: 'fa fa-' + fa + (size ? ' fa-' + size : '') + (className ? ' ' + className : ''),
		'aria-hidden': 'true' }, other));
};

/**
 * Input bound to DataStore
 * 
 * @param saveFn {Function} {path, prop, item, value} You are advised to wrap this with e.g. _.debounce(myfn, 500).
 * NB: we cant debounce here, cos it'd be a different debounce fn each time.
 * label {?String}
 * @param path {String[]} The DataStore path to item, e.g. [data, NGO, id]
 * @param item The item being edited. Can be null, and it will be fetched by path.
 * @param prop The field being edited 
 * @param dflt {?Object} default value Beware! This may not get saved if the user never interacts.
 * @param modelValueFromInput {?Function} See standardModelValueFromInput
 * @param required {?Boolean} If set, this field should be filled in before a form submit. 
* 		TODO mark that somehow
 */
Misc.PropControl = function (_ref7) {
	var _ref7$type = _ref7.type,
	    type = _ref7$type === undefined ? "text" : _ref7$type,
	    path = _ref7.path,
	    prop = _ref7.prop,
	    label = _ref7.label,
	    help = _ref7.help,
	    error = _ref7.error,
	    recursing = _ref7.recursing,
	    stuff = _objectWithoutProperties(_ref7, ['type', 'path', 'prop', 'label', 'help', 'error', 'recursing']);

	(0, _sjtest.assMatch)(prop, "String|Number");
	(0, _sjtest.assMatch)(path, Array);
	var proppath = path.concat(prop);

	// HACK: catch bad dates and make an error message
	// TODO generalise this with a validation function
	if (Misc.ControlTypes.isdate(type) && !error && !recursing) {
		var _value = _DataStore2.default.getValue(proppath);
		if (_value) {
			try {
				var sdate = "" + new Date(_value);
				if (sdate === 'Invalid Date') {
					error = 'Please use the date format yyyy-mm-dd';
				}
			} catch (er) {
				error = 'Please use the date format yyyy-mm-dd';
			}
		} else {
			var rawPath = path.concat(prop + "_raw");
			var rawValue = _DataStore2.default.getValue(rawPath);
			// raw but no date suggests the server removed it
			if (rawValue) error = 'Please use the date format yyyy-mm-dd';
		}
	}

	// label / help? show it and recurse
	// NB: Checkbox has a different html layout :( -- handled below
	if ((label || help || error) && !Misc.ControlTypes.ischeckbox(type) && !recursing) {
		// Minor TODO help block id and aria-described-by property in the input
		var labelText = label || '';
		var helpIcon = help ? _react2.default.createElement(Misc.Icon, { glyph: 'question-sign', title: help }) : '';
		// NB: The label and PropControl are on the same line to preserve the whitespace in between for inline forms.
		// NB: pass in recursing error to avoid an infinite loop with the date error handling above.
		return _react2.default.createElement(
			'div',
			{ className: 'form-group' + (error ? ' has-error' : '') },
			_react2.default.createElement(
				'label',
				{ htmlFor: stuff.name },
				labelText,
				' ',
				helpIcon
			),
			_react2.default.createElement(Misc.PropControl, _extends({
				type: type, path: path, prop: prop, error: error }, stuff, { recursing: true
			})),
			error ? _react2.default.createElement(
				'span',
				{ className: 'help-block' },
				error
			) : null
		);
	}

	var item = stuff.item,
	    bg = stuff.bg,
	    dflt = stuff.dflt,
	    saveFn = stuff.saveFn,
	    modelValueFromInput = stuff.modelValueFromInput,
	    otherStuff = _objectWithoutProperties(stuff, ['item', 'bg', 'dflt', 'saveFn', 'modelValueFromInput']);

	if (!modelValueFromInput) modelValueFromInput = standardModelValueFromInput;
	(0, _sjtest.assert)(!type || Misc.ControlTypes.has(type), 'Misc.PropControl: ' + type);
	(0, _sjtest.assert)(_lodash2.default.isArray(path), 'Misc.PropControl: not an array:' + path);
	(0, _sjtest.assert)(path.indexOf(null) === -1 && path.indexOf(undefined) === -1, 'Misc.PropControl: null in path ' + path);
	// // item ought to match what's in DataStore - but this is too noisy when it doesn't
	// if (item && item !== DataStore.getValue(path)) {
	// 	console.warn("Misc.PropControl item != DataStore version", "path", path, "item", item);
	// }
	if (!item) {
		item = _DataStore2.default.getValue(path) || {};
	}
	var value = item[prop] === undefined ? dflt : item[prop];

	// Checkbox?
	if (Misc.ControlTypes.ischeckbox(type)) {
		var _onChange = function _onChange(e) {
			// console.log("onchange", e); // minor TODO DataStore.onchange recognise and handle events
			var val = e && e.target && e.target.checked;
			_DataStore2.default.setValue(proppath, val);
			if (saveFn) saveFn({ path: path, prop: prop, item: item, value: val });
		};
		if (value === undefined) value = false;
		var _helpIcon = help ? _react2.default.createElement(Misc.Icon, { glyph: 'question-sign', title: help }) : null;
		return _react2.default.createElement(
			'div',
			null,
			_react2.default.createElement(
				_reactBootstrap.Checkbox,
				_extends({ checked: value, onChange: _onChange }, otherStuff),
				label,
				' ',
				_helpIcon
			),
			error ? _react2.default.createElement(
				'span',
				{ className: 'help-block' },
				error
			) : null
		);
	} // ./checkbox

	// Yes-no radio buttons? (eg in the Gift Aid form)
	if (type === 'yesNo') {
		var _onChange2 = function _onChange2(e) {
			// console.log("onchange", e); // minor TODO DataStore.onchange recognise and handle events
			var val = e && e.target && e.target.value && e.target.value !== 'false';
			_DataStore2.default.setValue(proppath, val);
			if (saveFn) saveFn({ path: path, prop: prop, item: item, value: val });
		};

		// Null/undefined doesn't mean "no"! Don't check either option until we have a value.
		var noChecked = value !== null && value !== undefined && !value;

		return _react2.default.createElement(
			'div',
			{ className: 'form-group' },
			_react2.default.createElement(
				_reactBootstrap.Radio,
				{ value: true, name: prop, onChange: _onChange2, checked: value, inline: true },
				'Yes'
			),
			_react2.default.createElement(
				_reactBootstrap.Radio,
				{ value: false, name: prop, onChange: _onChange2, checked: noChecked, inline: true },
				'No'
			)
		);
	}

	if (value === undefined) value = '';

	// £s
	// NB: This is a bit awkward code -- is there a way to factor it out nicely?? The raw vs parsed/object form annoyance feels like it could be a common case.
	if (type === 'Money') {
		var acprops = _extends({ prop: prop, value: value, path: path, proppath: proppath, item: item, bg: bg, dflt: dflt, saveFn: saveFn, modelValueFromInput: modelValueFromInput }, otherStuff);
		return _react2.default.createElement(PropControlMoney, acprops);
	} // ./£
	// text based
	var onChange = function onChange(e) {
		console.log("event", e, e.type);
		// TODO a debounced property for "do ajax stuff" to hook into. HACK blur = do ajax stuff
		_DataStore2.default.setValue(['transient', 'doFetch'], e.type === 'blur');
		var mv = modelValueFromInput(e.target.value, type, e.type);
		_DataStore2.default.setValue(proppath, mv);
		if (saveFn) saveFn({ path: path, value: mv });
		e.preventDefault();
		e.stopPropagation();
	};

	if (type === 'arraytext') {
		// Pretty hacky: Value stored as ["one", "two", "three"] but displayed as "one two three"
		// Currently used for entering list of unit-variants for publisher
		var arrayChange = function arrayChange(e) {
			var oldString = _DataStore2.default.getValue(proppath);
			var newString = e.target.value;

			// Split into space-separated tokens
			var newValue = newString.split(' ');
			// Remove falsy entries, if deleting (ie newString is substring of oldString) but not if adding
			// allows us to go 'one' (['one']) -> "one " ('one', '') -> "one two" ('one', 'two')
			if (oldString.indexOf(newString) >= 0) {
				newValue = newValue.filter(function (val) {
					return val;
				});
			}

			_DataStore2.default.setValue(proppath, newValue);
			if (saveFn) saveFn({ path: path });
			e.preventDefault();
			e.stopPropagation();
		};
		return _react2.default.createElement(FormControl, _extends({ type: type, name: prop, value: value.join(' '), onChange: arrayChange }, otherStuff));
	}

	if (type === 'textarea') {
		return _react2.default.createElement('textarea', _extends({ className: 'form-control', name: prop, onChange: onChange }, otherStuff, { value: value }));
	}
	if (type === 'json') {
		var spath = ['transient'].concat(proppath);
		var svalue = _DataStore2.default.getValue(spath) || JSON.stringify(value);
		var onJsonChange = function onJsonChange(e) {
			console.log("event", e.target && e.target.value, e, e.type);
			_DataStore2.default.setValue(spath, e.target.value);
			try {
				var vnew = JSON.parse(e.target.value);
				_DataStore2.default.setValue(proppath, vnew);
				if (saveFn) saveFn({ path: path });
			} catch (err) {
				console.warn(err);
				// TODO show error feedback
			}
			e.preventDefault();
			e.stopPropagation();
		};
		return _react2.default.createElement('textarea', _extends({ className: 'form-control', name: prop, onChange: onJsonChange }, otherStuff, { value: svalue }));
	}

	if (type === 'img') {
		return _react2.default.createElement(
			'div',
			null,
			_react2.default.createElement(FormControl, _extends({ type: 'url', name: prop, value: value, onChange: onChange }, otherStuff)),
			_react2.default.createElement(
				'div',
				{ className: 'pull-right', style: { background: bg, padding: bg ? '20px' : '0' } },
				_react2.default.createElement(Misc.ImgThumbnail, { url: value, style: { background: bg } })
			),
			_react2.default.createElement('div', { className: 'clearfix' })
		);
	}

	if (type === 'imgUpload') {
		var uploadAccepted = function uploadAccepted(accepted, rejected) {
			var progress = function progress(event) {
				return console.log('UPLOAD PROGRESS', event.loaded);
			};
			var load = function load(event) {
				return console.log('UPLOAD SUCCESS', event);
			};

			accepted.forEach(function (file) {
				_ServerIO2.default.upload(file, progress, load).done(function (response) {
					_DataStore2.default.setValue(path.concat(prop), response.cargo.url);
				});
			});

			rejected.forEach(function (file) {
				// TODO Inform the user that their file had a Problem
			});
		};

		return _react2.default.createElement(
			'div',
			null,
			_react2.default.createElement(FormControl, _extends({ type: 'url', name: prop, value: value, onChange: onChange }, otherStuff)),
			_react2.default.createElement(
				'div',
				{ className: 'pull-left' },
				_react2.default.createElement(
					_reactDropzone2.default,
					{
						className: 'DropZone',
						accept: 'image/jpeg, image/png',
						style: {},
						onDrop: uploadAccepted
					},
					'Drop a JPG or PNG image here'
				)
			),
			_react2.default.createElement(
				'div',
				{ className: 'pull-right', style: { background: bg, padding: bg ? '20px' : '0' } },
				_react2.default.createElement(Misc.ImgThumbnail, { style: { background: bg }, url: value })
			),
			_react2.default.createElement('div', { className: 'clearfix' })
		);
	} // ./imgUpload

	if (type === 'url') {
		return _react2.default.createElement(
			'div',
			null,
			_react2.default.createElement(FormControl, _extends({ type: 'url', name: prop, value: value, onChange: onChange, onBlur: onChange }, otherStuff)),
			_react2.default.createElement(
				'div',
				{ className: 'pull-right' },
				_react2.default.createElement(
					'small',
					null,
					value ? _react2.default.createElement(
						'a',
						{ href: value, target: '_blank' },
						'open in a new tab'
					) : null
				)
			),
			_react2.default.createElement('div', { className: 'clearfix' })
		);
	}

	// date
	// NB dates that don't fit the mold yyyy-MM-dd get ignored by the date editor. But we stopped using that
	//  && value && ! value.match(/dddd-dd-dd/)
	if (type === 'date') {
		var _acprops = _extends({ prop: prop, item: item, value: value, onChange: onChange }, otherStuff);
		return _react2.default.createElement(PropControlDate, _acprops);
	}

	if (type === 'select') {
		var options = otherStuff.options,
		    defaultValue = otherStuff.defaultValue,
		    labels = otherStuff.labels,
		    rest = _objectWithoutProperties(otherStuff, ['options', 'defaultValue', 'labels']);

		(0, _sjtest.assert)(options, 'Misc.PropControl: no options for select ' + [prop, otherStuff]);
		(0, _sjtest.assert)(options.map, 'Misc.PropControl: options not an array ' + options);
		// Make an option -> nice label function
		// the labels prop can be a map or a function
		var labeller = function labeller(v) {
			return v;
		};
		if (labels) {
			labeller = _lodash2.default.isFunction(labels) ? labels : function (v) {
				return labels[v] || v;
			};
		}
		// make the options html
		var domOptions = options.map(function (option) {
			return _react2.default.createElement(
				'option',
				{ key: "option_" + option, value: option },
				labeller(option)
			);
		});
		var sv = value || defaultValue;
		return _react2.default.createElement(
			'select',
			_extends({ className: 'form-control', name: prop, value: sv, onChange: onChange }, rest),
			sv ? null : _react2.default.createElement('option', null),
			domOptions
		);
	}
	if (type === 'autocomplete') {
		var _acprops2 = _extends({ prop: prop, value: value, path: path, proppath: proppath, item: item, bg: bg, dflt: dflt, saveFn: saveFn, modelValueFromInput: modelValueFromInput }, otherStuff);
		return _react2.default.createElement(PropControlAutocomplete, _acprops2);
	}
	// normal
	// NB: type=color should produce a colour picker :)
	return _react2.default.createElement(FormControl, _extends({ type: type, name: prop, value: value, onChange: onChange }, otherStuff));
}; //./PropControl

Misc.ControlTypes = new _easyEnums2.default("img imgUpload textarea text select autocomplete password email url color Money checkbox" + " yesNo location date year number arraytext address postcode json");

/**
 * Strip commas £/$/euro and parse float
 * @param {*} v 
 * @returns Number. undefined/null are returned as-is.
 */
var numFromAnything = function numFromAnything(v) {
	if (v === undefined || v === null) return v;
	if (_lodash2.default.isNumber(v)) return v;
	// strip any commas, e.g. 1,000
	if (_lodash2.default.isString(v)) {
		v = v.replace(/,/g, "");
		// £ / $ / euro
		v = v.replace(/^(-)?[£$\u20AC]/, "$1");
	}
	return parseFloat(v);
};

var PropControlMoney = function PropControlMoney(_ref8) {
	var prop = _ref8.prop,
	    value = _ref8.value,
	    path = _ref8.path,
	    proppath = _ref8.proppath,
	    item = _ref8.item,
	    bg = _ref8.bg,
	    dflt = _ref8.dflt,
	    saveFn = _ref8.saveFn,
	    modelValueFromInput = _ref8.modelValueFromInput,
	    otherStuff = _objectWithoutProperties(_ref8, ['prop', 'value', 'path', 'proppath', 'item', 'bg', 'dflt', 'saveFn', 'modelValueFromInput']);

	// special case, as this is an object.
	// Which stores its value in two ways, straight and as a x100 no-floats format for the backend
	// Convert null and numbers into MA objects
	if (!value || _lodash2.default.isString(value) || _lodash2.default.isNumber(value)) {
		value = _Money2.default.make({ value: value });
	}
	// prefer raw, so users can type incomplete answers!
	var v = value.raw || value.value;
	if (v === undefined || v === null || _lodash2.default.isNaN(v)) {
		// allow 0, which is falsy
		v = '';
	}
	//Money.assIsa(value); // type can be blank
	// handle edits
	var onMoneyChange = function onMoneyChange(e) {
		var newVal = numFromAnything(e.target.value);
		value.raw = e.target.value;
		value.value = newVal;
		_DataStore2.default.setValue(proppath, value, true); // force update 'cos editing the object makes this look like a no-op
		// console.warn("£", value, proppath);
		if (saveFn) saveFn({ path: path, value: value });
	};
	var curr = CURRENCY[value && value.currency] || _react2.default.createElement(
		'span',
		null,
		'\xA3'
	);
	var currency = void 0;
	var changeCurrency = otherStuff.changeCurrency !== false;
	if (changeCurrency) {
		// TODO other currencies
		currency = _react2.default.createElement(
			_reactBootstrap.DropdownButton,
			{ disabled: otherStuff.disabled, title: curr, componentClass: _reactBootstrap.InputGroup.Button, id: 'input-dropdown-addon-' + JSON.stringify(proppath) },
			_react2.default.createElement(
				_reactBootstrap.MenuItem,
				{ key: '1' },
				curr
			)
		);
	} else {
		currency = _react2.default.createElement(
			_reactBootstrap.InputGroup.Addon,
			null,
			curr
		);
	}
	delete otherStuff.changeCurrency;
	(0, _sjtest.assert)(v === 0 || v || v === '', [v, value]);
	// make sure all characters are visible
	var minWidth = ("" + v).length / 1.5 + "em";
	return _react2.default.createElement(
		_reactBootstrap.InputGroup,
		null,
		currency,
		_react2.default.createElement(FormControl, _extends({ name: prop, value: v, onChange: onMoneyChange }, otherStuff, { style: { minWidth: minWidth } }))
	);
}; // ./£


var PropControlDate = function PropControlDate(_ref9) {
	var prop = _ref9.prop,
	    item = _ref9.item,
	    value = _ref9.value,
	    onChange = _ref9.onChange,
	    otherStuff = _objectWithoutProperties(_ref9, ['prop', 'item', 'value', 'onChange']);

	// NB dates that don't fit the mold yyyy-MM-dd get ignored by the native date editor. But we stopped using that.
	// NB: parsing incomplete dates causes NaNs
	var datePreview = null;
	if (value) {
		try {
			var date = new Date(value);
			// use local settings??
			datePreview = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
		} catch (er) {
			// bad date
			datePreview = 'Invalid date';
		}
	}

	// HACK: also set the raw text in _raw. This is cos the server may have to ditch badly formatted dates.
	// NB: defend against _raw_raw
	var rawProp = prop.substr(prop.length - 4, prop.length) === '_raw' ? null : prop + '_raw';
	if (!value && item && rawProp) value = item[rawProp];
	var onChangeWithRaw = function onChangeWithRaw(e) {
		if (item && rawProp) {
			item[rawProp] = e.target.value;
		}
		onChange(e);
	};

	// let's just use a text entry box -- c.f. bugs reported https://github.com/winterstein/sogive-app/issues/71 & 72
	// Encourage ISO8601 format
	if (!otherStuff.placeholder) otherStuff.placeholder = 'yyyy-mm-dd, e.g. today is ' + isoDate(new Date());
	return _react2.default.createElement(
		'div',
		null,
		_react2.default.createElement(FormControl, _extends({ type: 'text', name: prop, value: value, onChange: onChangeWithRaw }, otherStuff)),
		_react2.default.createElement(
			'div',
			{ className: 'pull-right' },
			_react2.default.createElement(
				'i',
				null,
				datePreview
			)
		),
		_react2.default.createElement('div', { className: 'clearfix' })
	);
};

var SECOND = 1000;
var MINUTE = 60 * SECOND;
var HOUR = 60 * MINUTE;
var DAY = 24 * HOUR;
var WEEK = 7 * DAY;
var YEAR = 365 * DAY;

Misc.RelativeDate = function (_ref10) {
	var date = _ref10.date,
	    rest = _objectWithoutProperties(_ref10, ['date']);

	var dateObj = new Date(date);
	var now = new Date();

	var diff = now.getTime() - dateObj.getTime();
	var relation = diff > 0 ? 'ago' : 'in the future';
	diff = Math.abs(diff);
	var absoluteDate = dateObj.toLocaleString('en-GB');
	var count = 'less than one';
	var counter = 'second';

	var calcCount = function calcCount(divisor) {
		return Math.round(diff / divisor);
	};

	if (diff > YEAR) {
		count = calcCount(YEAR);
		counter = 'year';
	} else if (diff > 4 * WEEK) {
		// months is fiddly, so let Date handle it
		count = now.getMonth() - dateObj.getMonth() + 12 * (now.getYear() - dateObj.getYear());
		counter = 'month';
	} else if (diff > WEEK) {
		count = calcCount(WEEK);
		counter = 'week';
	} else if (diff > DAY) {
		count = calcCount(DAY);
		counter = 'day';
	} else if (diff > HOUR) {
		count = calcCount(HOUR);
		counter = 'hour';
	} else if (diff > MINUTE) {
		count = calcCount(MINUTE);
		counter = 'minute';
	} else if (diff > SECOND) {
		count = calcCount(SECOND);
		counter = 'second';
	}

	if (count > 1) {
		counter += 's';
	}

	return _react2.default.createElement(
		'span',
		_extends({ title: absoluteDate }, rest),
		count,
		' ',
		counter,
		' ',
		relation
	);
};

var weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
var shortWeekdays = weekdays.map(function (weekday) {
	return weekday.substr(0, 3);
});
var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
var shortMonths = months.map(function (month) {
	return month.substr(0, 3);
});

var oh = function oh(n) {
	return n < 10 ? '0' + n : n;
};

Misc.LongDate = function (_ref11) {
	var date = _ref11.date;

	if (_lodash2.default.isString(date)) date = new Date(date);
	return _react2.default.createElement(
		'span',
		null,
		weekdays[date.getDay()] + ' ' + date.getDate() + ' ' + months[date.getMonth()] + ' ' + date.getFullYear()
	);
};

/**
 * Human-readable, unambiguous date+time string which doesn't depend on toLocaleString support
 */
Misc.dateTimeString = function (d) {
	return d.getDate() + ' ' + shortMonths[d.getMonth()] + ' ' + d.getFullYear() + ' ' + oh(d.getHours()) + ':' + oh(d.getMinutes());
};

Misc.AvatarImg = function (_ref12) {
	var peep = _ref12.peep,
	    props = _objectWithoutProperties(_ref12, ['peep']);

	if (!peep) return null;
	var img = peep.img,
	    name = peep.name;

	var className = props.className,
	    alt = props.alt,
	    rest = _objectWithoutProperties(props, ['className', 'alt']);

	var id = (0, _DataClass.getId)(peep);

	name = name || id && _wwutils.XId.id(id) || 'anon';
	alt = alt || 'Avatar for ' + name;

	if (!img) {
		// try a gravatar -- maybe 20% will have one c.f. http://euri.ca/2013/how-many-people-use-gravatar/index.html#fnref-1104-3
		if (id && _wwutils.XId.service(id) === 'email') {
			var e = _wwutils.XId.id(id);
			img = 'https://www.gravatar.com/avatar/' + (0, _md2.default)(e);
		}
		// security paranoia -- but it looks like Gravatar dont set a tracking cookie
		// let html = `<img className='AvatarImg' alt=${'Avatar for '+name} src=${src} />`;
		// return <iframe title={nonce()} src={'data:text/html,' + encodeURIComponent(html)} />;
	}

	return _react2.default.createElement('img', _extends({ className: 'AvatarImg img-thumbnail ' + className, alt: alt, src: img }, rest));
};

/**
 * wraps the reactjs autocomplete widget
 */
var PropControlAutocomplete = function PropControlAutocomplete(_ref13) {
	var prop = _ref13.prop,
	    value = _ref13.value,
	    options = _ref13.options,
	    getItemValue = _ref13.getItemValue,
	    renderItem = _ref13.renderItem,
	    path = _ref13.path,
	    proppath = _ref13.proppath,
	    item = _ref13.item,
	    bg = _ref13.bg,
	    dflt = _ref13.dflt,
	    saveFn = _ref13.saveFn,
	    modelValueFromInput = _ref13.modelValueFromInput,
	    otherStuff = _objectWithoutProperties(_ref13, ['prop', 'value', 'options', 'getItemValue', 'renderItem', 'path', 'proppath', 'item', 'bg', 'dflt', 'saveFn', 'modelValueFromInput']);

	// a place to store the working state of this widget
	var widgetPath = ['widget', 'autocomplete'].concat(path);
	if (!getItemValue) getItemValue = function getItemValue(s) {
		return s;
	};
	if (!renderItem) renderItem = function renderItem(a) {
		return _printer2.default.str(a);
	};
	var type = 'autocomplete';
	var items = _lodash2.default.isArray(options) ? options : _DataStore2.default.getValue(widgetPath) || [];
	// NB: typing sends e = an event, clicking an autocomplete sends e = a value
	var onChange2 = function onChange2(e, optItem) {
		console.log("event", e, e.type, optItem);
		// TODO a debounced property for "do ajax stuff" to hook into. HACK blur = do ajax stuff
		_DataStore2.default.setValue(['transient', 'doFetch'], e.type === 'blur');
		// typing sneds an event, clicking an autocomplete sends a value
		var val = e.target ? e.target.value : e;
		var mv = modelValueFromInput(val, type, e.type);
		_DataStore2.default.setValue(proppath, mv);
		if (saveFn) saveFn({ path: path, value: mv });
		// e.preventDefault();
		// e.stopPropagation();
	};
	var onChange = function onChange(e, optItem) {
		onChange2(e, optItem);
		if (!e.target.value) return;
		if (!_lodash2.default.isFunction(options)) return;
		var optionsOutput = options(e.target.value);
		var pvo = (0, _promiseValue2.default)(optionsOutput);
		pvo.promise.then(function (oo) {
			_DataStore2.default.setValue(widgetPath, oo);
			// also save the info in data
			oo.forEach(function (opt) {
				return (0, _DataClass.getType)(opt) && (0, _DataClass.getId)(opt) ? _DataStore2.default.setValue(['data', (0, _DataClass.getType)(opt), (0, _DataClass.getId)(opt)], opt) : null;
			});
		});
		// NB: no action on fail - the user just doesn't get autocomplete		
	};

	return _react2.default.createElement(_reactAutocomplete2.default, {
		inputProps: { className: otherStuff.className || 'form-control' },
		getItemValue: getItemValue,
		items: items,
		renderItem: renderItem,
		value: value,
		onChange: onChange,
		onSelect: onChange2
	});
}; //./autocomplete

/**
 * A button which sets a DataStore address to a specific value
 * 
 * e.g.
 * <SetButton path={['widget','page']} value='2'>Next</SetButton>
 * is roughly equivalent to
 * <div onClick={() => DataStore.setValue(['widget','page'], 2)}>Next</div>
 * 
 * ??maybe phase this out in favour of just the direct use?? ^DW
 */
Misc.SetButton = function (_ref14) {
	var path = _ref14.path,
	    value = _ref14.value,
	    children = _ref14.children,
	    className = _ref14.className;

	(0, _sjtest.assert)(path && path.length);
	var doSet = function doSet() {
		_DataStore2.default.setValue(path, value);
	};
	return _react2.default.createElement(
		'span',
		{ className: className, onClick: doSet },
		children
	);
};

/**
 * Convert inputs (probably text) into the model's format (e.g. numerical)
 * @param eventType "change"|"blur" More aggressive edits should only be done on "blur"
 * @returns the model value/object to be stored in DataStore
 */
var standardModelValueFromInput = function standardModelValueFromInput(inputValue, type, eventType) {
	if (!inputValue) return inputValue;
	// numerical?
	if (type === 'year') {
		return parseInt(inputValue);
	}
	if (type === 'number') {
		return numFromAnything(inputValue);
	}
	// add in https:// if missing
	if (type === 'url' && eventType === 'blur') {
		if (inputValue.indexOf('://') === -1 && inputValue[0] !== '/' && 'http'.substr(0, inputValue.length) !== inputValue.substr(0, 4)) {
			inputValue = 'https://' + inputValue;
		}
	}
	return inputValue;
};

/**
 * @param d {Date}
 * @returns {String}
 */
var isoDate = function isoDate(d) {
	return d.toISOString().replace(/T.+/, '');
};

/**
 * 
 * @param {
 * 	url: {?String} The image url. If falsy, return null
 * 	style: {?Object}
 * }
 */
Misc.ImgThumbnail = function (_ref15) {
	var url = _ref15.url,
	    style = _ref15.style;

	if (!url) return null;
	// add in base (NB this works with style=null)
	style = Object.assign({ width: '100px', maxHeight: '200px' }, style);
	return _react2.default.createElement('img', { className: 'img-thumbnail', style: style, alt: 'thumbnail', src: url });
};

/**
 * This replaces the react-bootstrap version 'cos we saw odd bugs there. 
 * Plus since we're providing state handling, we don't need a full component.
 */
var FormControl = function FormControl(_ref16) {
	var value = _ref16.value,
	    type = _ref16.type,
	    required = _ref16.required,
	    otherProps = _objectWithoutProperties(_ref16, ['value', 'type', 'required']);

	if (value === null || value === undefined) value = '';

	if (type === 'color' && !value) {
		// workaround: this prevents a harmless but annoying console warning about value not being an rrggbb format
		return _react2.default.createElement('input', _extends({ className: 'form-control', type: type }, otherProps));
	}
	// add css classes for required fields
	var klass = 'form-control' + (required ? value ? ' form-required' : ' form-required blank' : '');
	return _react2.default.createElement('input', _extends({ className: klass, type: type, value: value }, otherProps));
};

/** Hack: a debounced auto-save function for the save/publish widget */
var saveDraftFn = _lodash2.default.debounce(function (_ref17) {
	var type = _ref17.type,
	    id = _ref17.id;

	_ActionMan2.default.saveEdits(type, id);
	return true;
}, 5000);

/**
 * Just a convenience for a Bootstrap panel
 */
Misc.Card = function (_ref18) {
	var title = _ref18.title,
	    glyph = _ref18.glyph,
	    icon = _ref18.icon,
	    children = _ref18.children,
	    onHeaderClick = _ref18.onHeaderClick,
	    collapse = _ref18.collapse,
	    titleChildren = _ref18.titleChildren,
	    props = _objectWithoutProperties(_ref18, ['title', 'glyph', 'icon', 'children', 'onHeaderClick', 'collapse', 'titleChildren']);

	var h3 = _react2.default.createElement(
		'h3',
		{ className: 'panel-title' },
		icon ? _react2.default.createElement(Misc.Icon, { glyph: glyph, fa: icon }) : null,
		title || '',
		' ',
		onHeaderClick ? _react2.default.createElement(Misc.Icon, { className: 'pull-right', glyph: 'triangle-' + (collapse ? 'bottom' : 'top') }) : null
	);
	return _react2.default.createElement(
		'div',
		{ className: 'Card panel panel-default' },
		_react2.default.createElement(
			'div',
			{ className: onHeaderClick ? "panel-heading btn-link" : "panel-heading", onClick: onHeaderClick },
			h3,
			titleChildren
		),
		_react2.default.createElement(
			'div',
			{ className: 'panel-body' + (collapse ? ' collapse' : '') },
			children
		)
	);
};

/**
 * 
 * @param {?String} widgetName - Best practice is to give the widget a name.
 * @param {Misc.Card[]} children
 */
Misc.CardAccordion = function (_ref19) {
	var widgetName = _ref19.widgetName,
	    children = _ref19.children,
	    multiple = _ref19.multiple,
	    start = _ref19.start;

	// NB: React-BS provides Accordion, but it does not work with modular panel code. So sod that.
	// TODO manage state
	var wcpath = ['widget', widgetName || 'CardAccordion', 'open'];
	var open = _DataStore2.default.getValue(wcpath);
	if (!open) open = [true]; // default to first kid open
	if (!children) {
		return _react2.default.createElement('div', { className: 'CardAccordion' });
	}
	(0, _sjtest.assert)(_lodash2.default.isArray(open), "Misc.jsx - CardAccordion - open not an array", open);
	// filter null, undefined
	children = children.filter(function (x) {
		return !!x;
	});
	var kids = _react2.default.Children.map(children, function (Kid, i) {
		var collapse = !open[i];
		var onHeaderClick = function onHeaderClick(e) {
			if (!multiple) {
				// close any others
				open = [];
			}
			open[i] = collapse;
			_DataStore2.default.setValue(wcpath, open);
		};
		// clone with click
		return _react2.default.cloneElement(Kid, { collapse: collapse, onHeaderClick: onHeaderClick });
	});
	return _react2.default.createElement(
		'div',
		{ className: 'CardAccordion' },
		kids
	);
};

/**
 * save buttons
 * TODO auto-save on edit -- copy from sogive
 */
Misc.SavePublishDiscard = function (_ref20) {
	var type = _ref20.type,
	    id = _ref20.id,
	    hidden = _ref20.hidden;

	(0, _sjtest.assert)(_C.C.TYPES.has(type), 'Misc.SavePublishDiscard');
	(0, _sjtest.assMatch)(id, String);
	var localStatus = _DataStore2.default.getLocalEditsStatus(type, id);
	var isSaving = _C.C.STATUS.issaving(localStatus);
	var item = _DataStore2.default.getData(type, id);
	// request a save?
	if (_C.C.STATUS.isdirty(localStatus) && !isSaving) {
		saveDraftFn({ type: type, id: id });
	}
	// if nothing has been edited, then we can't publish, save, or discard
	// NB: modified is a persistent marker, managed by the server, for draft != published
	var noEdits = item && _C.C.KStatus.isPUBLISHED(item.status) && _C.C.STATUS.isclean(localStatus) && !item.modified;

	// Sometimes we just want to autosave drafts!
	if (hidden) return _react2.default.createElement('span', null);
	var vis = { visibility: isSaving ? 'visible' : 'hidden' };

	return _react2.default.createElement(
		'div',
		{ className: 'SavePublishDiscard', title: item && item.status },
		_react2.default.createElement(
			'div',
			null,
			_react2.default.createElement(
				'small',
				null,
				'Status: ',
				item && item.status,
				', Modified: ',
				localStatus,
				' ',
				isSaving ? "saving..." : null
			)
		),
		_react2.default.createElement(
			'button',
			{ className: 'btn btn-default', disabled: isSaving || _C.C.STATUS.isclean(localStatus), onClick: function onClick() {
					return _ActionMan2.default.saveEdits(type, id);
				} },
			'Save Edits ',
			_react2.default.createElement('span', { className: 'glyphicon glyphicon-cd spinning', style: vis })
		),
		'\xA0',
		_react2.default.createElement(
			'button',
			{ className: 'btn btn-primary', disabled: isSaving || noEdits, onClick: function onClick() {
					return _ActionMan2.default.publishEdits(type, id);
				} },
			'Publish Edits ',
			_react2.default.createElement('span', { className: 'glyphicon glyphicon-cd spinning', style: vis })
		),
		'\xA0',
		_react2.default.createElement(
			'button',
			{ className: 'btn btn-warning', disabled: isSaving || noEdits, onClick: function onClick() {
					return _ActionMan2.default.discardEdits(type, id);
				} },
			'Discard Edits ',
			_react2.default.createElement('span', { className: 'glyphicon glyphicon-cd spinning', style: vis })
		),
		'\xA0',
		_react2.default.createElement(
			'button',
			{ className: 'btn btn-danger', disabled: isSaving, onClick: function onClick() {
					return _ActionMan2.default.delete(type, id);
				} },
			'Delete ',
			_react2.default.createElement('span', { className: 'glyphicon glyphicon-cd spinning', style: vis })
		)
	);
};

/**
 * 
 * @param {Boolean} once If set, this button can only be clicked once.
 */
Misc.SubmitButton = function (_ref21) {
	var path = _ref21.path,
	    url = _ref21.url,
	    once = _ref21.once,
	    _ref21$className = _ref21.className,
	    className = _ref21$className === undefined ? 'btn btn-primary' : _ref21$className,
	    onSuccess = _ref21.onSuccess,
	    children = _ref21.children;

	(0, _sjtest.assMatch)(url, String);
	(0, _sjtest.assMatch)(path, 'String[]');
	var tpath = ['transient', 'SubmitButton'].concat(path);

	var formData = _DataStore2.default.getValue(path);
	// DataStore.setValue(tpath, C.STATUS.loading);
	var params = {
		data: formData
	};
	var doSubmit = function doSubmit(e) {
		_DataStore2.default.setValue(tpath, _C.C.STATUS.saving);
		_ServerIO2.default.load(url, params).then(function (res) {
			_DataStore2.default.setValue(tpath, _C.C.STATUS.clean);
		}, function (err) {
			_DataStore2.default.setValue(tpath, _C.C.STATUS.dirty);
		});
	};

	var localStatus = _DataStore2.default.getValue(tpath);
	// show the success message instead?
	if (onSuccess && _C.C.STATUS.isclean(localStatus)) {
		return onSuccess;
	}
	var isSaving = _C.C.STATUS.issaving(localStatus);
	var vis = { visibility: isSaving ? 'visible' : 'hidden' };
	var disabled = isSaving || once && localStatus;
	var title = 'Submit the form';
	if (disabled) title = isSaving ? "saving..." : "Submitted :) To avoid errors, you cannot re-submit this form";
	return _react2.default.createElement(
		'button',
		{ onClick: doSubmit,
			className: className,
			disabled: disabled,
			title: title
		},
		children,
		_react2.default.createElement('span', { className: 'glyphicon glyphicon-cd spinning', style: vis })
	);
};

exports.default = Misc;
// // TODO rejig for export {
// 	PropControl: Misc.PropControl
// };