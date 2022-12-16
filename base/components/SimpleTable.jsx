/*
	This started by because react-table was causing my system to crash.
	But it has grown arms and legs!

	TODO refactor tableSettings to be simpler.

	TODO refactor so that csv creation is done separately from table rendering.

	NB: see https://github.com/react-tools/react-table#example
*/

// TODO it might be worth supporting one of these similar? same? formats
// http://specs.dataatwork.org/json-table-schema/
// https://frictionlessdata.io/specs/table-schema/

import React, { useState, useRef } from 'react';

import { assert, assMatch } from '../utils/assert';
import _ from 'lodash';
import Misc from './Misc';
import printer from '../utils/printer';

import Enum from 'easy-enums';
import { asNum, space, stopEvent, encURI, asDate, isNumeric } from '../utils/miscutils';
import DataStore from '../plumbing/DataStore';
import DataClass, { getClass, getType, Item } from '../data/DataClass';
import Tree from '../data/Tree';
import PropControl from './PropControl';
import StyleBlock from './StyleBlock';

const str = printer.str;

class Column extends DataClass {
	/** @type {?String|Function} Extract the column value from an item. If a string, this is the property name. */
	accessor;
	/** @type {?Function} (value, column, item) -> string|jsx */
	Cell;
	/** @type {?String} */
	Header;
	/** @type {?Boolean} */
	editable;
	/** @type {?CellFormat} How to format numbers e.g. "percent". See also `type` */
	format;
	/** @type {?Function} ({item,...}) -> {} */
	saveFn;
	/** @type {?Function} */
	sortMethod;
	/** @type {?Function} */
	sortAccessor;
	/** @type {?String} Used for providing an editor - see PropControl. e.g. `date` */
	type;
	/** @type {?String|Function} Text to show as help. If a function, works like style */
	tooltip;
	/** @type {?Boolean|Number} override value for the total row (if there is one). false to show blank. unset for auto-sum. */
	total;
	/** @type {?Object|Function} custom css styling. If a function, it does (cellValue, item, column) -> css-style-object */
	style;

	/** @type {?Boolean} true for internally made UI columns, which should not be included in the csv export */
	ui;
	/** @significantDigits {?integer} used used to specify significant digits for numbers */
	significantDigits;
	/** @precision {?integer} used used to specify precision for numbers (digits after the decimal point) */
	precision;

	/**
	 * 
	 * @param {Column} base 
	 */
	constructor(base) {
		super(base);
		Object.assign(this, base);
		delete this.status;
	}
};
DataClass.register(Column, "Column");


/**
 * Let's document the state of this not-really-that-simple-anymore widget.
 * This is for everything except the data
 */
class TableSettings {
	/**
	 * @type {Boolean} If set, add a total of the on-screen data. If String, this is the row label (defaults to "Total").
	 */
	addTotalRow;

	/**
	 * @type {?String} css colour code. This is needed if you use scroller to give frozen headers
	 */
	background = "white";

	/**
	 * @type {{String : Boolean}} Has a special "all" key
	 */
	collapsed4nodeid;

	/** @type {Column[]|String[]} Can mix String and Column */
	columns;

	/** @type {?Item[]} Each row an item. item.style will set row tr styling */
	data;
	/** @type {?Object} a {key: value} object, which will be converted into rows [{key:k1, value:v1}, {}...]
	* So the columns should use accessors 'key' and 'value'.
	* This is ONLY good for simple 2-column tables!
	*/
	dataObject;

	/**
	* @type {?Tree<Item>} Tree of data items. Alternative to data, which adds tree structure. The Tree values are the items. */	
	dataTree;
	
	/** @type {?String} Filter rows by keyword */
	filter;
 
	/** @param {?Boolean|String[]} If truthy, offer a filter widget. If String[], then store the filter at this datastore path. */
	hasFilter;
	
	hasCollapse;
	
	/** @param {?Boolean|String} If true, offer csv download. See also DownloadCSVLink. Set to "top" to position the link above the table. */
	hasCsv;

	/**
	 * @type {Number} The number of rendered rows (i.e. excludes collapsed tree nodes or other pages, but includes scrolled-off rows)
	 */
	numRows;
	/** @type {Number} */
	numCols;
	
	/** @type {Number} */
	page = 0;

	/**
	* @type {Boolean} default true
	*/
	showSortButtons = true;
	
	/**
	 * @type {Column}
	 */
	sortBy;

	/**
	 * @type {?Boolean} true for frozen headers and scrolling
	 */
	scroller;

	/** @type {?Boolean} If true, hide empty columns */
	hideEmpty;

	/** @type {?Number} Cap the number of rows shown. This cap is applied after filtering and sorting */ 
	rowsPerPage;

	
	/** @type {?String} Used to name the csv download */
	tableName = 'Table';

	/** @type {?String} Applied to the <table> for e.g. BS styles */ 
	tableClass;

	/**
	 * A row Object. Provide an always visible (no filtering) top row, e.g. for totals including extra data.
	* @type {Item} */
	topRow

	// i=0; debug counter
};

// class ErrBoundary extends React.Component {
// https://reactjs.org/docs/error-boundaries.html

/**
 * @param {TableSettings} props
 * 
 */
const SimpleTable = (props) => {
	let {
		data, dataObject, dataTree,
		columns,
		headerRender,
		topRow,
		bottomRow,		
	} = props;

	let [tableSettings, setTableSettings] = useState(new TableSettings());
	Object.assign(tableSettings, props); // props override any local setting
	// give settings an update function
	tableSettings.update = () => {
		setTableSettings(Object.assign({}, tableSettings)); // pointless shallow copy - to trigger a re-render
	};
	// tableSettings.i++;	// debug
	// console.log("render Table "+tableSettings.i);

	if (tableSettings.addTotalRow && !_.isString(tableSettings.addTotalRow)) tableSettings.addTotalRow = 'Total';

	// Standardise the possible data inputs as a dataTree (which is the most general format)
	const originalData = data; // for debug
	dataTree = standardiseData({ data, dataObject, dataTree })
	assert(dataTree);
	if ( ! columns) {
		assert(dataObject);
		columns=["key","value"];
	}
	assert(_.isArray(columns), "SimpleTable.jsx - columns", columns);

	// Filter settings
	if (tableSettings.hasFilter && tableSettings.hasFilter.length) {
		tableSettings.filter = DataStore.getValue(tableSettings.hasFilter);
	}
	const filterChange = e => {
		const v = e.target.value;		
		tableSettings.filter = v;
		if (tableSettings.hasFilter && tableSettings.hasFilter.length) {
			DataStore.setValue(tableSettings.hasFilter, v);
		}
		tableSettings.update();
	};
	// filter and sort - and add in collapse buttons
	let { dataTree: fdataTree, visibleColumns } = rowFilter({ dataTree, columns, tableSettings});
	assert(fdataTree, "SimpleTable.jsx - rowFilter led to null?!", dataTree);
	dataTree = fdataTree;

	// clip max rows now?
	let numPages = 1;
	if (tableSettings.rowsPerPage) {
		let numRows = Tree.children(dataTree).length;
		numPages = Math.ceil(numRows / tableSettings.rowsPerPage);
		// NB: clipping is done later 'cos if we're doing a csv download, which should include all data
	}

	// scrolling
	const onScroll = tableSettings.scroller? e => {
		// console.log("onScroll", e, e.target.scrollLeft, e.target.scrollTop);
		tableSettings.scrollLeft = e.target.scrollLeft;
		tableSettings.scrollTop = e.target.scrollTop;
		tableSettings.update();
	} : null;

	// the html
	return (
		<div className={space("SimpleTable", tableSettings.scroller&&"scroller")}>
			{tableSettings.hasFilter ? <div className="form-inline">&nbsp;<label>Filter</label>&nbsp;<input className="form-control"
				value={tableSettings.filter || ''}
				onChange={filterChange}
			/></div> : null}
			{/* NB outside scroller */ tableSettings.hasCsv==="top" && <div className="pull-left"><CSVDownload tableSettings={tableSettings} {...{visibleColumns, topRow, dataTree, bottomRow }} /></div>}
			<div className="scroll-div" onScroll={onScroll} >
				<table className={space("table", "position-relative", tableSettings.tableClass)}>
					<THead {...{ visibleColumns, tableSettings, headerRender, topRow, dataTree}} />
					<tbody>
						<Rows
							dataTree={dataTree}
							tableSettings={tableSettings}
							visibleColumns={visibleColumns}
						/>
						{bottomRow ? <Row item={bottomRow} row={-1} columns={visibleColumns} tableSettings={tableSettings} /> : null}
					</tbody>
					<TableFoot {...{visibleColumns, topRow, dataTree, bottomRow, numPages, tableSettings }}
						colSpan={visibleColumns.length} />
				</table>
			</div>
			{/* NB outside scroller */ tableSettings.hasCsv && tableSettings.hasCsv!=="top" && <div className="pull-left"><CSVDownload tableSettings={tableSettings} {...{visibleColumns, topRow, dataTree, bottomRow }} /></div>}
		</div>
	);
} // ./SimpleTable

/**
 * 
 * @param {Object} params
 * @param {!Column[]} params.visibleColumns
 * @param {!TableSettings} params.tableSettings
 */
const THead = ({ visibleColumns, tableSettings, headerRender, topRow, dataTree }) => {
	// c isn't used but will be off by 1 if scroller is true
	return (<thead>
		<tr>
			{visibleColumns.map((col, c) => {
				return <Th tableSettings={tableSettings} key={c} 
					column={col} c={c} headerRender={headerRender} />
			})
			}
		</tr>

		{topRow && <Row className="topRow" item={topRow} row={-1} columns={visibleColumns} tableSettings={tableSettings} />}

		{tableSettings.addTotalRow &&
			<tr className="totalRow" >
				<th>{tableSettings.addTotalRow}</th>
				{visibleColumns.slice(1).map((col, c) =>
					<TotalCell dataTree={dataTree} tableSettings={tableSettings} key={c} column={col} c={c} />)
				}
			</tr>}

	</thead>);
};

/**
 * 
 * @param {Object} params
 * @param {!Column[]|String[]} params.visibleColumns
 * @param {!TableSettings} params.tableSettings
 */
const createCSVData = ({ visibleColumns, topRow, tableSettings, dataTree, bottomRow }) => {
	// No UI buttons
	visibleColumns = visibleColumns.filter(c => !c.ui);
	// build up an array view of the table
	let dataArray = [];
	// csv gets the text, never jsx from headerRender!
	let ths = visibleColumns.map(column => column.Header || column.accessor || str(column));
	dataArray.push(ths);
	// special top rows
	if (topRow) {
		let rowData = createCSVData2_row({ visibleColumns, item: topRow });
		dataArray.push(rowData);
	}
	if (tableSettings.addTotalRow) {
		console.error("TODO totalRow csv");
		// let r = [addTotalRow];
		// visibleColumns.slice(1).map((col, c) <TotalCell dataTree={dataTree} table={this} tableSettings={tableSettings} key={c} column={col} c={c} />)
		// dataArray.push(r);		
	}
	// rows
	Tree.map(dataTree, (node, parent, depth) => {
		const item = Tree.value(node);
		if (!item) return;
		// <Row>
		let rowData = createCSVData2_row({ visibleColumns, item });
		dataArray.push(rowData);
	});

	if (bottomRow) {
		let rowData = createCSVData2_row({ visibleColumns, item: bottomRow });
		dataArray.push(rowData);
	}
	return dataArray;
};

/**
 * 
 * @param {Object} params
 * @param {!Column[]} params.visibleColumns
 * @param {!Item} params.item
 */
const createCSVData2_row = ({ visibleColumns, item }) => {
	// See Row = (
	const cells = visibleColumns.map(column => createCSVData3_cell({ item, column }));
	return cells;
};
/**
 * 
 * @param {Object} params
 * @param {!Column} params.column
 * @param {!Item} params.item
 */
const createCSVData3_cell = ({ item, column }) => {
	// See Cell = (
	const v = getValue({ item, column });
	return defaultCellRender(v, column);
};

/**
 * Convert data or dataObject into a tree, as the most general format
 * @param {Object} p
 * @param {?Object[]} p.data rows
 * @returns {!Tree}
 */
const standardiseData = ({ data, dataObject, dataTree }) => {
	assert([data, dataObject, dataTree].reduce((c, x) => x ? c + 1 : c, 0) === 1, "Need one and only one data input", [data, dataObject, dataTree]);
	if (dataTree) return dataTree;
	if (dataObject) {
		// flatten an object into rows
		assert(!data, "SimpleTable.jsx - data or dataObject - not both");
		data = Object.keys(dataObject).map(k => { return { key: k, value: dataObject[k] }; });
	}
	assert(!data || _.isArray(data), "SimpleTable.jsx - data must be an array of objects", data);
	// make a flat root -> all-rows tree
	dataTree = new Tree();
	data.forEach(row => Tree.add(dataTree, row));
	return dataTree;
}

/**
 * Filter columns, rows, and data + sort
 * @param {Object} p
 * @param {TableSettings} p.tableSettings
 * @returns {dataTree, visibleColumns: Column[]}
 */
const rowFilter = ({ dataTree, columns, tableSettings }) => {
	const originalDataTree = dataTree; // debug
	// filter?
	// ...always filter nulls
	dataTree = Tree.filterByValue(dataTree, item => !!item);
	if (!dataTree) {
		console.warn("SimpleTable.jsx - filter nulls led to empty tree", originalDataTree);
		dataTree = new Tree(); // empty!
	}
	if (tableSettings.filter) {
		dataTree = Tree.filterByValue(dataTree, item => JSON.stringify(item).indexOf(tableSettings.filter) !== -1);
		if (!dataTree) {
			console.warn("SimpleTable.jsx - filter string led to empty tree: " + tableSettings.filter, originalDataTree);
			dataTree = new Tree(); // empty!
		}
	}

	// dataTree - filter out collapsed rows
	let visibleColumns = [...columns]; // copy for safety against the edits below
	if (tableSettings.hasCollapse) {
		let allDataTree = dataTree;
		// (un)collapse all
		const doCollapseAll = (allCollapsed) => {	
			// NB: unshift so we dont collapse the root node
			Tree.flatten(allDataTree).slice(1).map(node => {
				if (!Tree.children(node).length) return;
				let nodeid = Tree.id(node) || JSON.stringify(node.value);
				tableSettings.collapsed4nodeid[nodeid] = allCollapsed;
			});			
		};
		// ...preserve collapsed setting
		// NB: lodash _.merge wasnt working as expected - collapsed state got lost
		if ( ! tableSettings.collapsed4nodeid) {
			tableSettings.collapsed4nodeid = {all:true}; // start collapsed
			doCollapseAll(true);
		}
		// Filter out the collapsed nodes
		dataTree = Tree.filter(dataTree, (node, parent) => {
			if (!parent) return true;
			const pnodeid = Tree.id(parent) || JSON.stringify(parent.value);
			const ncollapsed = tableSettings.collapsed4nodeid[pnodeid];
			return !ncollapsed;
		});
		assert(dataTree, "SimpleTable.jsx - collapsed to null?!");
		// HACK: add a collapse column		
		// filter by collapsed (which is set on the parent)
		// ...collapse button
		const CellWithCollapse = (v, col, item, node) => {
			let nodeid = Tree.id(node) || JSON.stringify(item);
			const ncollapsed = tableSettings.collapsed4nodeid[nodeid];
			// no node or children? no need for a control
			if (!node || !Tree.children(node).length) {
				// but what if we'd filtered out the children above?
				if (!ncollapsed) return null;
			}
			return (<button className="btn btn-xs btn-outline-secondary" title={ncollapsed ? "click to expand" : "click to collapse"}
				onClick={e => { tableSettings.collapsed4nodeid[nodeid] = !ncollapsed; DataStore.update(); }}
			>{ncollapsed ? '▷' : '▼'}</button>);
		};
		// add column, with a collapse/expand all option
		let allCollapsed = !!tableSettings.collapsed4nodeid.all;
		const uiCol = new Column({
			ui: true,
			Header: <button className="btn btn-xs btn-outline-secondary" onClick={e => {
				allCollapsed = !allCollapsed;
				doCollapseAll(allCollapsed);
				tableSettings.collapsed4nodeid.all = allCollapsed;
				DataStore.update();
			}} title={'click to collapse/expand all'} ><b>{allCollapsed ? '▷' : '▼'}</b></button>,
			Cell: CellWithCollapse
		});
		// ... put it as the 2nd column, after the row-name
		let firstCol = visibleColumns.shift();
		visibleColumns = [firstCol, uiCol].concat(visibleColumns);
	} // ./hasCollapse

	// sort?
	// NB: Not available for "true" trees - assume tree depth = 2, root + leaves
	if (tableSettings.sortBy !== undefined) {
		// pluck the sorting column
		let column = tableSettings.sortBy;
		// sort fn
		let sortFn = column.sortMethod;
		if ( ! sortFn) {
			let getter = sortGetter(column);
			sortFn = (a, b) => defaultSortMethodForGetter(a, b, getter, column.type);
		}
		if (Tree.depth(dataTree) > 2) {
			throw new Error("Cannot sort a hierarchical tree", dataTree);
		}
		Tree.children(dataTree).sort((na, nb) => sortFn(Tree.value(na), Tree.value(nb)));
		if (tableSettings.sortByReverse) {
			dataTree.children = Tree.children(dataTree).reverse();
		}
	} // sort

	// hide columns with no data
	if (tableSettings.hideEmpty) {
		const data = Tree.allValues(dataTree);
		visibleColumns = visibleColumns.filter(c => {
			if (c.ui) return true; // preserve UI columns
			const getter = sortGetter(c);
			for (let di = 0; di < data.length; di++) {
				let vi = getter(data[di]);
				if (vi) return true;
			}
			return false;
		});
	}
	// NB maxRows is done later to support csv-download being all data
	return { dataTree, visibleColumns };
} // ./filter



/**
 * The meat of the table! (normally)
 * @param {!Tree} dataTree
 * 
 */
const Rows = ({ dataTree, visibleColumns, tableSettings, rowNum = 0 }) => {
	if (!dataTree) return null;
	// clip?
	let min = tableSettings.rowsPerPage ? tableSettings.page * tableSettings.rowsPerPage : 0;
	let max = tableSettings.rowsPerPage ? (tableSettings.page + 1) * tableSettings.rowsPerPage : Infinity;
	// build the rows
	let $rows = [];
	Tree.map(dataTree, (node, parent, depth) => {
		const item = Tree.value(node);
		if (!item) return;
		// clip from min/max paging?
		if (rowNum < min || rowNum >= max) {
			rowNum++;
			return;
		}
		// <Row>
		let $row = <Row key={'r' + rowNum} item={item} rowNum={rowNum} depth={depth} tableSettings={tableSettings}
			columns={visibleColumns}
			node={node}
		/>;
		$rows.push($row);
		rowNum++;
	});
	// filter nulls (due to execute-but-don't-render-hidden behaviour)
	$rows = $rows.filter(a => !!a); // NB: Row can return null
	return $rows;
};


const Th = ({ column, tableSettings, headerRender }) => {
	assert(column, "SimpleTable.jsx - Th - no column?!");
	let hText;
	if (headerRender) hText = headerRender(column);
	else hText = column.Header || column.accessor || str(column);
	// add in a tooltip?
	if (column.tooltip) {
		let tooltip = calcStyle({ style: column.tooltip, depth: 0, column });
		hText = <div title={tooltip}>{hText}</div>;
	}
	// keep first row visible
	let style = null;
	if (tableSettings.scroller && tableSettings.scrollTop) {
		style = {
			top: tableSettings.scrollTop,
			position:"relative",
			background:tableSettings.background,
			borderBottom: "1px solid black",
			boxShadow: "0 .2rem 0.1rem rgba(0,0,0,0.15) !important", // not working?? Use a class instead??
			zIndex:20
		};
	}	
	// No sorting?
	if ( ! tableSettings.showSortButtons) return (
		<th style={style}><div>{hText}</div></th>
	);
	// sort UI
	let sortByMe = _.isEqual(tableSettings.sortBy, column);
	let onClick = e => {
		console.warn('sort click', column, sortByMe, tableSettings);
		if (sortByMe) {
			tableSettings.sortByReverse = ! tableSettings.sortByReverse;
		} else {
			tableSettings.sortByReverse = false;
		}
		tableSettings.sortBy = column;
		tableSettings.update();
	};

	// Sort indicator glyph: point down for descending, point up for ascending, outlined point down for "not sorted on this column"
	let arrow = null;
	if (sortByMe) arrow = tableSettings.sortByReverse ? <>&#x25B2;</> : <>&#x25BC;</>;
	else arrow = <>&#x25BD;</>;

	return (
		<th style={style} >
			<div onClick={onClick}>{hText}{arrow}</div>
		</th>
	);
};

/**
 * A table row!
 * @param {!Number} rowNum Can be -1 for special rows ??0 or 1 indexed??
 * @param {?Number} depth Depth if a row tree was used. 0 indexed
 */
const Row = ({ item, rowNum, node, columns, depth = 0, tableSettings}) => {
	const cells = columns.map((col, i) => (
		<Cell key={i} colNum={i}
			row={rowNum} depth={depth}
			node={node}
			column={col} item={item}
			tableSettings={tableSettings}
		/>
	));
	let style = item.style;
	return (
		<tr className={space("row" + rowNum, rowNum % 2 ? "odd" : "even", "depth" + depth)} style={style}>
			{cells}
		</tr>
	);
};

const getValue = ({ item, row, column }) => {
	if (!item) {
		console.error("SimpleTable.jsx getValue: null item", column);
		return undefined;
	}
	let accessor = column.accessor || column;
	let v = _.isFunction(accessor) ? accessor(item) : item[accessor];
	return v;
};

/**
 * @param {Column} column
 * @returns {Function} item -> value for use in sorts and totals
 */
const sortGetter = (column) => {
	let getter = column.sortAccessor;
	if (!getter) getter = a => getValue({ item: a, column: column });
	return getter;
}

/**
 * A default sort
 * NOTE: this must have the column object passed in
 * @param {*} a
 * @param {*} b
 * @param {Column} column
 */
const defaultSortMethodForGetter = (a, b, getter, type) => {
	assert(_.isFunction(getter), "SimpleTable.jsx defaultSortMethodForGetter", getter);
	// let ia = {item:a, column:column};
	let av = getter(a);
	let bv = getter(b);
	// // avoid undefined 'cos it messes up ordering
	if (av === undefined || av === null) av = "";
	if (bv === undefined || bv === null) bv = "";
	// blank = last
	if (av === "" && bv) return 1;
	if (bv === "" && av) return -1;
	// case insensitive
	if (_.isString(av)) av = av.toLowerCase();
	if (_.isString(bv)) bv = bv.toLowerCase();
	// special type handling?
	if (type === 'date') {
		try {
			av = new Date(av);
			bv = new Date(bv);
		} catch (err) {
			console.warn(err);
		}
	}
	// console.log("sortFn", av, bv, a, b);
	return (av < bv) ? -1 : (av > bv) ? 1 : 0;
};

/**

 * @param {!Column} column
 * @param {any} v
 */
const defaultCellRender = (v, column) => {
	if (v === undefined || Number.isNaN(v)) return null;
	// by type?
	if (column.type === 'date' && v) {
		let d = asDate(v);
		return Misc.dateStr(d);
	}
	if (column.format) {
		if (typeof column.format === 'function') {
			return column.format(v);
		}
		let significantDigits = 2; // set to the defualt value that was previously hard coded
		let precision = 2;
		if (column.precision) { precision = column.precision; }
		if (column.significantDigits) { significantDigits = column.significantDigits }

		if (CellFormat.ispercent(column.format)) {
			// Use precision if supplied - else default to 2 sig figs
			if (column.precision) return (100 * v).toFixed(precision) + '%';
			return printer.prettyNumber(100 * v, significantDigits) + '%';
		}

		if (CellFormat.ispounds(column.format)) {
			// v = printer.prettyNumber(v, significantDigits);
			v = v.toFixed(precision).replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
			return "£" + v;
		}
		
		if (CellFormat.isstring(column.format)) {
			return str(v); // Even if it looks like a number
		}
	}
	// number or numeric string
	let nv = asNum(v);
	if (nv !== undefined && nv !== null && !Number.isNaN(nv)) {
		// 1 decimal place
		nv = Math.round(nv * 10) / 10;
		// commas
		const sv = printer.prettyNumber(nv, 10);
		return sv;
	}
	// e.g. Money has a to-string
	let dc = getClass(getType(v));
	if (dc && dc.str) return dc.str(v);
	// just str it
	return str(v);
};

/**
 * @param {Object} p
 * @param {Number} p.row
 * @param {Number} p.colNum
 * @param {Number} p.depth
 * @param {Column} p.column
 * @param {Tree} p.node
 * @param {TableSettings} p.tableSettings
 */
const Cell = ({ item, row, colNum, depth, node, column, tableSettings}) => {
	const citem = item;
	let clickToEdit = null, clickToEditOff = null;
	try {
		const v = getValue({ item, row, column });
		let render = column.Cell;
		if (!render) {
			if (column.editable) {
				// safety check we can edit this
				assert(column.path || DataStore.getPathForItem(C.KStatus.DRAFT, item), "SimpleTable.jsx - Cell", item, column);
				render = val => <Editor value={val} row={row} column={column} item={citem} />;
			} else {
				render = defaultCellRender;
			}
		} else {
			// replace the render function with the built-in editor on-click?
			if (column.editable) {
				let [editing, setEditing] = useState();
				clickToEdit = e => setEditing(true);
				clickToEditOff = e => setEditing(false);
				if (editing) {
					render = val => <Editor value={val} row={row} column={column} item={citem} />;
				}
			}
		}
		const cellGuts = render(v, column, item, node);
		// collapse? Done by an extra column
		let style = calcStyle({ style: column.style, cellValue: v, item, row, depth, column }) || {};
		let tooltip = calcStyle({ style: column.tooltip, cellValue: v, item, row, depth, column });
		
		// keep first col visible NB first row is a Th
		if (colNum===0 && tableSettings && tableSettings.scroller && tableSettings.scrollLeft) {
			style = Object.assign({
				left: tableSettings.scrollLeft,
				position:"relative",
				background:tableSettings.background,
				borderRight: "1px solid black",
				zIndex:10
			}, style);
		}

		// the moment you've been waiting for: a table cell!
		return <td style={style} title={tooltip} onDoubleClick={clickToEdit} onBlur={clickToEditOff} ><div>{cellGuts}</div></td>;
	} catch (err) {
		// be robust
		console.error(err);
		return <td><div>{str(err)}</div></td>;
	}
};

/**
 * Custom css for a cell?
 * @param {Object} p
 * @param {?Object|function} p.style if a function, it does (cellValue, item) -> css-style-object
 * @param {Item} p.item
 * @returns {?Object}
 */
const calcStyle = ({ style, cellValue, item, row, depth, column }) => {
	if (typeof (style) === 'function') {
		return style({ cellValue, item, row, depth, column });
	}
	// an object e.g. {color:"blue"}
	return style;
};

/**
 * 
 * @param {Object} p
 * @param {Column} p.column
 * @returns 
 */
const TotalCell = ({ dataTree, column }) => {
	if (column.total === false) {
		return <td></td>;
	}
	// sum the data for this column
	let total = 0;
	if (column.total) {
		total = column.total;
	} else {
		const getter = sortGetter(column);
		Tree.mapByValue(dataTree, rItem => {
			const v = getter(rItem);
			// NB: 1* to force coercion of numeric-strings
			if (isNumeric(v)) total += 1 * v;
		});
	}
	if (!total) return <td></td>;
	// ??custom cell render might break on a Number. But Money seems to be robust about its input.
	const render = column.Cell || defaultCellRender;
	const cellGuts = render(total, column);
	return <td>{cellGuts}</td>;
};

/**
 * Editor for the use-case: each row = a DataStore data item.
 */
const Editor = ({ row, column, value, item }) => {
	// what DataStore path?
	let path = column.path;
	if (!path) {
		try {
			// we edit draft
			path = DataStore.getPathForItem(C.KStatus.DRAFT, item);
			// make sure we have a draft
			if (!DataStore.getValue(path)) {
				DataStore.setValue(path, item, false);
			}
		} catch (err) {
			console.log("SimpleTable.jsx - cant get path-for-item", item, err);
		}
	}
	let prop = column.prop || (_.isString(column.accessor) && column.accessor);
	let dummyItem;
	if (path && prop) {
		// use item direct
		dummyItem = item || {};
	} else {
		// Not a DataStore item? fallback to dummies
		if (!path) path = ['widget', 'SimpleTable', row, str(column)];
		if (!prop) prop = 'value';
		dummyItem = {};
		let editedValue = DataStore.getValue(path.concat(prop));
		if (editedValue === undefined || editedValue === null) editedValue = value;
		dummyItem[prop] = editedValue;
	}
	let type = column.type;
	return (<PropControl type={type} item={dummyItem} path={path} prop={prop}
		saveFn={column.saveFn}
	/>);
}; // ./Editor

const CellFormat = new Enum("percent pounds string"); // What does a spreadsheet normally offer??


const TableFoot = ({visibleColumns, topRow, dataTree, bottomRow, numPages, colSpan, tableSettings}) => {
	if (!numPages || numPages < 2) return null;

	return <tfoot><tr>
		<td colSpan={colSpan}>
			{numPages > 1 ? <TableFootPager tableSettings={tableSettings} numPages={numPages} /> : null}
		</td>
	</tr></tfoot>;
};


const TableFootPager = ({tableSettings, numPages }) => {
	// TODO https://getbootstrap.com/docs/4.5/components/pagination/
	const page = tableSettings.page;
	const setPage = p => {tableSettings.page = p; tableSettings.update()};

	return <div className="pull-left pager">
		Page
		&nbsp; {page > 0 ? <a href="" onClick={e => stopEvent(e) && setPage(page - 1)} >&lt;</a> : <span className="disabled">&lt;</span>}
		&nbsp; {page + 1}
		&nbsp; {page + 1 < numPages ? <a href="" onClick={e => stopEvent(e) && setPage(page + 1)}>&gt;</a> : <span className="disabled">&gt;</span>}
		&nbsp; of {numPages}
	</div>;
};


const CSVDownload = ({tableSettings, visibleColumns, topRow, dataTree, bottomRow, ...props}) => {
	const setupCsv = (e) => {
		let dataArray = createCSVData({ visibleColumns, topRow, tableSettings, dataTree, bottomRow });
		let csv = dataArray.map(r => r.join ? r.map(cell => csvEscCell(cell)).join(",") : "" + r).join("\r\n");
		// https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/Data_URIs
		let csvLink = 'data:text/csv;charset=utf-8,' + encURI(csv);
		e.target.setAttribute('href', csvLink);
		// click is implicit in the action
	};

	// Allow prop passing - no overriding href and download, and onClick must be piggybacked
	let {children, href, download, onClick, ...safeProps} = props;
	safeProps.onClick = e => {
		onClick && onClick(e);
		return setupCsv(e);
	};
	// Filename of generated download
	safeProps.download = `${(tableSettings.tableName || 'table')}.csv`;

	// NB the entity in the text is the emoji "Inbox Tray" glyph, U+1F4E5
	return <a href="" {...safeProps}>{children || <>&#128229; Download .csv</>}</a>;
};

/** Regex for characters that shouldn't be in a CSV unescaped*/
const unsafeChars = /[",\r\n]/;

const csvEscCell = s => {
	if (!s) return '';
	assMatch(s, String, `SimpleTable.jsx - csvEscCell not a String ${str(s)}`);
	// may not have to quote
	if (!s.match(unsafeChars)) return s;
	// wrap in quotes & escape " to ""
	return `"${s.replace(/"/g, '""')}"`;
};

/**
 * A link tag
 * @param {Object} p
 * @param {!Column[]|string[]} p.columns
 * @param {!Object[]} p.data
 */
const DownloadCSVLink = ({columns, data, name, ...props}) => {
	let dataTree = standardiseData({data});
	let tableSettings = {name};
	return <CSVDownload dataTree={dataTree} visibleColumns={columns} tableSettings={tableSettings} {...props} />;
};

export default SimpleTable;
export { CellFormat, Column, DownloadCSVLink, TableSettings };
