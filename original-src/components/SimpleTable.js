'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _reactDom = require('react-dom');

var _reactDom2 = _interopRequireDefault(_reactDom);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _Misc = require('./Misc');

var _Misc2 = _interopRequireDefault(_Misc);

var _printer = require('../utils/printer');

var _printer2 = _interopRequireDefault(_printer);

var _DataStore = require('../plumbing/DataStore');

var _DataStore2 = _interopRequireDefault(_DataStore);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /*
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               	Copying a little bit of react-table
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               	Because react-table was causing my system to crash.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               	See https://github.com/react-tools/react-table#example
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               */

// import SJTest, {assert, assMatch} from 'sjtest';


var str = _printer2.default.str;

// class ErrorBoundary extends React.Component {
// https://reactjs.org/docs/error-boundaries.html

var SimpleTable = function (_React$Component) {
	_inherits(SimpleTable, _React$Component);

	function SimpleTable(props) {
		_classCallCheck(this, SimpleTable);

		return _possibleConstructorReturn(this, (SimpleTable.__proto__ || Object.getPrototypeOf(SimpleTable)).call(this, props));
	}

	_createClass(SimpleTable, [{
		key: 'componentWillMount',
		value: function componentWillMount() {
			this.setState({});
		}
	}, {
		key: 'render',
		value: function render() {
			var _this2 = this;

			var _props = this.props,
			    _props$tableName = _props.tableName,
			    tableName = _props$tableName === undefined ? 'SimpleTable' : _props$tableName,
			    data = _props.data,
			    columns = _props.columns,
			    className = _props.className;

			assert(_lodash2.default.isArray(columns), "SimpleTable.jsx - columns", columns);
			assert(!data || _lodash2.default.isArray(data), "SimpleTable.jsx - data must be an array of objects", data);

			var tableSettings = this.state; // DataStore.getValue('widget', tableName);
			if (!tableSettings) {
				tableSettings = {};
				_DataStore2.default.setValue(['widget', tableName], tableSettings, false);
			}
			if (tableSettings.sortBy !== undefined) {
				// TODO pluck the right column
				var column = columns[tableSettings.sortBy];
				var sortFn = function sortFn(a, b) {
					var av = getValue({ item: a, column: column });
					var bv = getValue({ item: b, column: column });
					return av < bv;
				};
				data = data.sort(sortFn);
				if (tableSettings.sortByReverse) {
					data = data.reverse();
				}
			} // sort
			var cn = 'table' + (className ? ' ' + className : '');

			return _react2.default.createElement(
				'table',
				{ className: cn },
				_react2.default.createElement(
					'tbody',
					null,
					_react2.default.createElement(
						'tr',
						null,
						columns.map(function (col, c) {
							return _react2.default.createElement(Th, { table: _this2, tableSettings: tableSettings, key: JSON.stringify(col), column: col, c: c });
						})
					),
					data ? data.map(function (d, i) {
						return _react2.default.createElement(Row, { key: "r" + i, item: d, row: i, columns: columns });
					}) : null
				)
			);
		}
	}]);

	return SimpleTable;
}(_react2.default.Component); // ./SimpleTable

// TODO onClick={} sortBy


var Th = function Th(_ref) {
	var column = _ref.column,
	    c = _ref.c,
	    table = _ref.table,
	    tableSettings = _ref.tableSettings;

	var sortByMe = "" + tableSettings.sortBy === "" + c;
	var onClick = function onClick(e) {
		console.warn('sort click', c, sortByMe, tableSettings);
		if (sortByMe) {
			table.setState({ sortByReverse: !tableSettings.sortByReverse });
			// tableSettings.sortByReverse = ! tableSettings.sortByReverse;
		} else {
			// table.setState({sortBy: c});
			table.setState({ sortByReverse: false });
			// tableSettings.sortByReverse = false;
		}
		table.setState({ sortBy: c });
		// tableSettings.sortBy = c;
	};
	return _react2.default.createElement(
		'th',
		{ onClick: onClick },
		column.Header || column.name || column.id || str(column),
		sortByMe ? _react2.default.createElement(_Misc2.default.Icon, { glyph: 'triangle-' + (tableSettings.sortByReverse ? 'top' : 'bottom') }) : null
	);
};

var Row = function Row(_ref2) {
	var item = _ref2.item,
	    row = _ref2.row,
	    columns = _ref2.columns;

	return _react2.default.createElement(
		'tr',
		null,
		columns.map(function (col) {
			return _react2.default.createElement(Cell, { key: JSON.stringify(col), row: row, column: col, item: item });
		})
	);
};

var getValue = function getValue(_ref3) {
	var item = _ref3.item,
	    row = _ref3.row,
	    column = _ref3.column;

	var accessor = column.accessor || column;
	var v = _lodash2.default.isFunction(accessor) ? accessor(item) : item[accessor];
	return v;
};

var Cell = function Cell(_ref4) {
	var item = _ref4.item,
	    row = _ref4.row,
	    column = _ref4.column;

	try {
		var v = getValue({ item: item, row: row, column: column });
		var render = column.Cell;
		if (!render) {
			if (column.editable) {
				render = function render(val) {
					return _react2.default.createElement(Editor, { value: val, row: row, column: column, item: item });
				};
			} else {
				render = function render(val) {
					return str(val);
				};
			}
		}
		return _react2.default.createElement(
			'td',
			null,
			render(v)
		);
	} catch (err) {
		// be robust
		console.error(err);
		return _react2.default.createElement(
			'td',
			null,
			str(err)
		);
	}
};

var Editor = function Editor(_ref5) {
	var row = _ref5.row,
	    column = _ref5.column,
	    value = _ref5.value,
	    item = _ref5.item;

	var path = column.path || _DataStore2.default.getPath(item);
	var prop = column.prop || _lodash2.default.isString(column.accessor) && column.accessor;
	var dummyItem = void 0;
	if (path && prop) {
		// use item direct
		dummyItem = item || {};
	} else {
		// fallback to dummies
		if (!path) path = ['widget', 'SimpleTable', row, str(column)];
		if (!prop) prop = 'value';
		dummyItem = {};
		var editedValue = _DataStore2.default.getValue(path.concat(prop));
		if (editedValue === undefined || editedValue === null) editedValue = value;
		dummyItem[prop] = editedValue;
	}

	var type = column.type;
	return _react2.default.createElement(_Misc2.default.PropControl, { type: type, item: dummyItem, path: path, prop: prop,
		saveFn: column.saveFn
	});
};

exports.default = SimpleTable;