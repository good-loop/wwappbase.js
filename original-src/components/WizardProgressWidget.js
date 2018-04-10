'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.PrevButton = exports.NextButton = exports.WizardProgressWidget = exports.WizardStage = exports.Wizard = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _DataStore = require('../plumbing/DataStore');

var _DataStore2 = _interopRequireDefault(_DataStore);

var _Misc = require('./Misc');

var _Misc2 = _interopRequireDefault(_Misc);

var _sjtest = require('sjtest');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

// TODO refactor a la Misc.CardAccordion

var WizardProgressWidget = function WizardProgressWidget(_ref) {
	var stageNum = _ref.stageNum,
	    completed = _ref.completed,
	    stages = _ref.stages,
	    stagePath = _ref.stagePath;

	if (!stageNum) stageNum = 0;
	return _react2.default.createElement(
		'div',
		{ className: 'WizardProgressWidget' },
		stages.map(function (stage, i) {
			return _react2.default.createElement(Stage, { key: i, stage: stage, stageNum: stageNum, i: i, completed: completed, stagePath: stagePath });
		})
	);
};

var Stage = function Stage(_ref2) {
	var i = _ref2.i,
	    stage = _ref2.stage,
	    stageNum = _ref2.stageNum,
	    stagePath = _ref2.stagePath,
	    completed = _ref2.completed;

	// NB: if no completed info, assume all before stageNum are fine
	var complete = completed ? completed[i] : i < stageNum;
	var c = '';
	if (i == stageNum) {
		c = 'active';
	} else if (complete) {
		c = 'complete';
	}

	var maybeSetStage = function maybeSetStage() {
		return complete && stagePath && _DataStore2.default.setValue(stagePath, i);
	};

	return _react2.default.createElement(
		'div',
		{ className: 'Stage ' + c, onClick: maybeSetStage },
		_react2.default.createElement(
			'h5',
			{ className: 'text-center above' },
			stage.title
		),
		_react2.default.createElement(
			'center',
			null,
			_react2.default.createElement(
				'span',
				{ className: 'marker' },
				'\u2B24'
			)
		),
		_react2.default.createElement('hr', { className: 'line' }),
		_react2.default.createElement(
			'h5',
			{ className: 'text-center below' },
			stage.title
		)
	);
};

var WizardStage = function WizardStage(_ref3) {
	var stageKey = _ref3.stageKey,
	    stageNum = _ref3.stageNum,
	    children = _ref3.children;

	if (!stageNum) stageNum = 0;
	if (stageKey != stageNum) {
		// allow "1" == 1		
		return null; //<p>k:{stageKey} n:{stageNum}</p>;
	}
	return _react2.default.createElement(
		'div',
		{ className: 'WizardStage' },
		children
	);
};

/**
 * 
 * @param {
 * 	maxStage: {Number}
 * }
 */
var NextButton = function NextButton(_ref4) {
	var completed = _ref4.completed,
	    stagePath = _ref4.stagePath,
	    rest = _objectWithoutProperties(_ref4, ['completed', 'stagePath']);

	var bsClass = completed ? 'primary' : null;
	return _react2.default.createElement(NextPrevTab, _extends({ stagePath: stagePath, bsClass: bsClass, diff: 1, text: _react2.default.createElement(
			'span',
			null,
			'Next ',
			_react2.default.createElement(_Misc2.default.Icon, { glyph: 'menu-right' })
		) }, rest));
};
var PrevButton = function PrevButton(_ref5) {
	var stagePath = _ref5.stagePath,
	    rest = _objectWithoutProperties(_ref5, ['stagePath']);

	return _react2.default.createElement(NextPrevTab, _extends({ stagePath: stagePath, diff: -1, text: _react2.default.createElement(
			'span',
			null,
			_react2.default.createElement(_Misc2.default.Icon, { glyph: 'menu-left' }),
			' Previous'
		) }, rest));
};

var NextPrevTab = function NextPrevTab(_ref6) {
	var stagePath = _ref6.stagePath,
	    diff = _ref6.diff,
	    text = _ref6.text,
	    _ref6$bsClass = _ref6.bsClass,
	    bsClass = _ref6$bsClass === undefined ? 'default' : _ref6$bsClass,
	    maxStage = _ref6.maxStage,
	    rest = _objectWithoutProperties(_ref6, ['stagePath', 'diff', 'text', 'bsClass', 'maxStage']);

	(0, _sjtest.assMatch)(stagePath, 'String[]');
	(0, _sjtest.assMatch)(diff, Number);
	(0, _sjtest.assert)(text, 'WizardProgressWidget.js - no button text');
	var stage = parseInt(_DataStore2.default.getValue(stagePath) || 0);

	if (stage === 0 && diff < 0) return null; // no previous on start
	if (maxStage && stage >= maxStage && diff > 0) return null; // no next on end

	var changeTab = function changeTab() {
		var n = stage + diff;
		_DataStore2.default.setValue(stagePath, n);
	};

	// use Bootstrap pull class to left/right float
	var pull = diff > 0 ? 'pull-right' : 'pull-left';

	return _react2.default.createElement(
		'button',
		_extends({ className: 'btn btn-' + bsClass + ' btn-lg ' + pull, onClick: changeTab }, rest),
		text
	);
};

var Wizard = function Wizard(_ref7) {
	var widgetName = _ref7.widgetName,
	    stagePath = _ref7.stagePath,
	    children = _ref7.children;

	// NB: React-BS provides Accordion, but it does not work with modular panel code. So sod that.
	// TODO manage state
	var wcpath = stagePath || ['widget', widgetName || 'Wizard', 'stage'];
	var stageNum = _DataStore2.default.getValue(wcpath);
	if (!stageNum) stageNum = 0; // default to first kid open
	if (!children) {
		return _react2.default.createElement('div', { className: 'Wizard' });
	}
	// filter null, undefined
	children = children.filter(function (x) {
		return !!x;
	});
	var stages = children.map(function (kid, i) {
		return { title: kid.props && kid.props.title ? kid.props.title : 'Step ' + i };
	});
	var kids = _react2.default.Children.map(children, function (Kid, i) {
		// clone with stageNum
		return _react2.default.cloneElement(Kid, { stageNum: stageNum, stageKey: i });
	});
	return _react2.default.createElement(
		'div',
		{ className: 'Wizard' },
		_react2.default.createElement(WizardProgressWidget, { stages: stages, stagePath: stagePath, stageNum: stageNum }),
		kids
	);
};

exports.Wizard = Wizard;
exports.WizardStage = WizardStage;
exports.WizardProgressWidget = WizardProgressWidget;
exports.NextButton = NextButton;
exports.PrevButton = PrevButton;
exports.default = Wizard;