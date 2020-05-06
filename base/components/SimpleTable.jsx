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

import {assert, assMatch} from 'sjtest';
import _ from 'lodash';
import Misc from './Misc';
import printer from '../utils/printer';

import Enum from 'easy-enums';
import {asNum, join, stopEvent} from 'wwutils';
import DataStore from '../plumbing/DataStore';
import DataClass, { getClass, getType, nonce } from '../data/DataClass';
import Tree from '../data/Tree';

const str = printer.str;

class Column extends DataClass {
	/** @type {?String|Function} Extract the column value from an item. If a string, this is the property name. */
	accessor;
	/** @type {?Function} (value, column, item) -> jsx */
	Cell;
	/** @type {?String} */
	Header;
	/** @type {?Boolean} */
	editable;
	/** @type {?Function} ({item,...}) -> {} */
	saveFn;
	/** @type {?Function} */
	sortMethod;
	/** @type {?Function} */
	sortAccessor;
	/** @type {?String} Used for providing an editor - see PropControl */
	type;
	/** @type {?String} Text to show as help */
	tooltip;
	/** @type {Object} custom css styling */
	style;
	/** @type {?Boolean} true for internally made UI columns, which should not be included in the csv export */
	ui;
	/** @significantDigits {?integer} used used to specify significant digits for numbers */
	significantDigits;
	/** @precision {?integer} used used to specify precision for numbers (digits after the decimal point) */
	precision;

	constructor(base) {
		super(base);
		Object.assign(this, base);
		delete this.status;
	}
};

// class ErrorBoundary extends React.Component {
// https://reactjs.org/docs/error-boundaries.html

/**
 * @param {?Item[]} data - Each row an item. item.style will set row tr styling
 *  *
 * @param {?Object} dataObject a {key: value} object, which will be converted into rows [{key:k1, value:v1}, {}...]
 * So the columns should use accessors 'key' and 'value'.
 * This is ONLY good for simple 2-column tables!
 *
 * @param {?Tree<Item>} dataTree Tree of data items. Alternative to data, which adds tree structure.
 * 
 * @param columns: {Column[]|String[]} Can mix String and Column
 *
 * addTotalRow: {Boolean|String} If set, add a total of the on-screen data. If String, this is the row label (defaults to "Total").
 *
 * topRow: {Item} - A row Object. Provide an always visible (no filtering) top row, e.g. for totals including extra data.
 *
 * showSortButtons {Boolean} default true
 *
 * @param {?Boolean} hideEmpty - If true, hide empty columns
 * @param {?Number} rowsPerPage - Cap the number of rows shown. This cap is applied after filtering and sorting
 * @param {?Boolean} csv If true, offer csv download
 * @param {?String} tableName Used to name the csv download

 */
// NB: use a full component for error-handling
// Also state (though maybe we should use DataStore)
class SimpleTable extends React.Component {

	constructor(props) {
		super(props);
	}

	render() {
		let {
			tableName='Table', data, dataObject, dataTree, 
			columns,
			headerRender, className, csv,
			addTotalRow,
			topRow,
			bottomRow, 
			hasFilter, hasCollapse,
			rowsPerPage, 
			statePath, // Is this used??
			hideEmpty,
			scroller, // if true, use fix col-1 scrollbars
			showSortButtons=true,
		} = this.props;

		if (addTotalRow && ! _.isString(addTotalRow)) addTotalRow = 'Total';

		// Standardise the possible data inputs as a dataTree (which is the most general format)
		const originalData = data; // for debug
		dataTree = standardiseData({data, dataObject, dataTree})
		assert(dataTree);
		assert(_.isArray(columns), "SimpleTable.jsx - columns", columns);

		// Table settings are stored in widget state by default. @deprecated But can also be linked to a DataStore via statePath
		let tableSettings = this.state;
		if (statePath) {
			tableSettings = DataStore.getValue(statePath);
			// normalSetState = this.setState;
			this.setState = ns => {
				let ts = DataStore.getValue(statePath) || {};
				ts = Object.assign(ts, ns); // merge with other state settings
				DataStore.setValue(statePath, ts);
			};
		}
		if ( ! tableSettings) {
			tableSettings = {nonce:nonce()};
			_.defer(() => this.setState(tableSettings));
		}
		// page?
		let [page, setPage] = [tableSettings.page || 0, p => this.setState({page:p})]; // useState(0) - not within a Component;

		// filter and sort
		let {dataTree:fdataTree,visibleColumns} = rowFilter({dataTree, hasCollapse, columns, tableSettings, hideEmpty, rowsPerPage});
		assert(fdataTree, "SimpleTable.jsx - rowFilter led to null?!", dataTree);
		dataTree = fdataTree;

		// clip max rows now?
		let numPages = 1;
		if (rowsPerPage) {
			let numRows = Tree.children(dataTree).length;
			numPages = Math.ceil(numRows / rowsPerPage);
			// NB: clipping is done later 'cos if we're doing a csv download, which should include all data
		}

		const filterChange = e => {
			const v = e.target.value;
			this.setState({filter: v});
		};
		// scrolling (credit to Irina): uses wrapper & scroller and css

		// the html
		return (
			<div className='SimpleTable'>
				{hasFilter? <div className='form-inline'>&nbsp;<label>Filter</label>&nbsp;<input className='form-control'
					value={tableSettings.filter || ''}
					onChange={filterChange}
					/></div> : null}
				<div>
					<div className={scroller? 'wrapper' : ''}>
						<div className={scroller? 'scroller' : ''}>
<table className={join("table",className)}>
	<thead>
		<tr>
			{visibleColumns.map((col, c) => {
				return <Th table={this} tableSettings={tableSettings} key={c}
					column={col} c={c} headerRender={headerRender}
					showSortButtons={showSortButtons} />
			})
			}
		</tr>

		{topRow? <Row className='topRow' item={topRow} row={-1} columns={visibleColumns} /> : null}
		{addTotalRow?
			<tr className='totalRow' >
				<th>{addTotalRow}</th>
				{visibleColumns.slice(1).map((col, c) =>
					<TotalCell dataTree={dataTree} table={this} tableSettings={tableSettings} key={c} column={col} c={c} />)
				}
			</tr>
			: null}

	</thead>

	<tbody>		
		<Rows 
			dataTree={dataTree} 
			tableSettings={tableSettings} 
			rowsPerPage={rowsPerPage} 
			page={page} 
			visibleColumns={visibleColumns} 
		/>
		{bottomRow? <Row item={bottomRow} row={-1} columns={visibleColumns} /> : null}
	</tbody>
	<TableFoot {...{csv, tableName, visibleColumns, topRow, addTotalRow, dataTree, bottomRow, numPages, page, setPage}} 
		colSpan={visibleColumns.length} />
</table>
						</div>
					</div>
				</div>
			</div>
		);
	} // ./ render()

} // ./SimpleTable
{/* <TableFoot csv={csv} tableName={tableName} visibleColumns, topRow, addTotalRow, dataTree, bottomRow,
		numPages={numPages} page={page} setPage={setPage} colSpan={visibleColumns.length} /> */}

const createCSVData = ({visibleColumns, topRow, addTotalRow, dataTree, bottomRow}) => {
	// No UI buttons
	visibleColumns = visibleColumns.filter(c => ! c.ui);
	// build up an array view of the table
	let dataArray = [];
	// csv gets the text, never jsx from headerRender!
	let ths = visibleColumns.map(column => column.Header || column.accessor || str(column)); 
	dataArray.push(ths);
	// special top rows
	if (topRow) {
		let rowData = createCSVData2_row({visibleColumns, item:topRow});
		dataArray.push(rowData);
	} 
	if (addTotalRow) {
		console.error("TODO totalRow csv");
		// let r = [addTotalRow];
		// visibleColumns.slice(1).map((col, c) <TotalCell dataTree={dataTree} table={this} tableSettings={tableSettings} key={c} column={col} c={c} />)
		// dataArray.push(r);		
	}
	// rows
	Tree.map(dataTree, (node, parent, depth) => {
		const item = Tree.value(node);
		if ( ! item) return;
		// <Row>
		let rowData = createCSVData2_row({visibleColumns, item});
		dataArray.push(rowData);
	});

	if (bottomRow) {
		let rowData = createCSVData2_row({visibleColumns, item:bottomRow});
		dataArray.push(rowData);
	} 
	return dataArray;
};

const createCSVData2_row = ({visibleColumns, item}) => {
	// See Row = (
	const cells = visibleColumns.map(column => createCSVData3_cell({item, column}));
	return cells;
};
const createCSVData3_cell = ({item, column}) => {
	// See Cell = (
	const v = getValue({item, column});
	return defaultCellRender(v, column);
};

/**
 * Convert data or dataObject into a tree, as the most general format
 * @returns {!Tree}
 */
const standardiseData = ({data, dataObject, dataTree}) => {
	assert([data, dataObject, dataTree].reduce((c,x) => x? c+1 : c, 0) === 1, "Need one and only one data input", [data, dataObject, dataTree]);
	if (dataTree) return dataTree;
	if (dataObject) {
		// flatten an object into rows
		assert( ! data, "SimpleTable.jsx - data or dataObject - not both");
		data = Object.keys(dataObject).map(k => { return {key:k, value:dataObject[k]}; });
	}
	assert( ! data || _.isArray(data), "SimpleTable.jsx - data must be an array of objects", data);		
	// make a flat root -> all-rows tree
	dataTree = new Tree();
	data.forEach(row => Tree.add(dataTree, row));
	return dataTree;
}

/**
 * Filter columns, rows, and data + sort
 * @returns {dataTree, visibleColumns: Column[]}
 */
const rowFilter = ({dataTree, columns, hasCollapse, tableSettings, hideEmpty}) => {
	const originalDataTree = dataTree; // debug
	// filter?
	// ...always filter nulls
	dataTree = Tree.filterByValue(dataTree, item => !! item);
	if ( ! dataTree) {
		console.warn("SimpleTable.jsx - filter nulls led to empty tree", originalDataTree);
		dataTree = new Tree(); // empty!
	}
	if (tableSettings.filter) {
		dataTree = Tree.filterByValue(dataTree, item => JSON.stringify(item).indexOf(tableSettings.filter) !== -1);
		if ( ! dataTree) {
			console.warn("SimpleTable.jsx - filter string led to empty tree: "+tableSettings.filter, originalDataTree);
			dataTree = new Tree(); // empty!
		}	
	}
	
	// dataTree - filter out collapsed rows
	let visibleColumns = columns;
	if (hasCollapse) {
		// preserve collapsed setting
		// NB: lodash _.merge wasnt working as expected - collapsed state got lost
		if ( ! tableSettings.collapsed4nodeid) tableSettings.collapsed4nodeid = {};		
		// filter by collapsed (which is set on the parent)
		// Note: collapsed rows DO affect csv creation??
		dataTree = Tree.filter(dataTree, (node,parent) => {
			if ( ! parent) return true;
			const pnodeid = Tree.id(parent); 
			const ncollapsed = tableSettings.collapsed4nodeid[pnodeid];
			// if (ncollapsed) {
			// 	// mark this, so we show the button. Have to mark the value 'cos the node itself isnt preserved by map/filter
			// 	if (Tree.value(parent)) Tree.value(parent)._collapsed = true; // NB: this will not be preserved through another map or filter!
			// }
			return ! ncollapsed;
		});	
		assert(dataTree, "SimpleTable.jsx - collapsed to null?!");		
		// HACK: add a collapse column
		// ...collapse button
		const Cell = (v, col, item, node) => {
			let nodeid = Tree.id(node); 
			if ( ! nodeid) nodeid = JSON.stringify(item);
			const ncollapsed = tableSettings.collapsed4nodeid[nodeid];
			if ( ! node || ! Tree.children(node).length) {
				if ( ! ncollapsed) return null;
				// if ( ! item._collapsed) return null;
			}
			return (<button className='btn btn-xs'
				onClick={e => {tableSettings.collapsed4nodeid[nodeid] = ! ncollapsed; DataStore.update();}}
			>{ncollapsed? '+' : '-'}</button>);
		};
		// add column
		const uiCol = new Column({ui:true, Header:'+-', Cell});
		visibleColumns = [uiCol].concat(visibleColumns);
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
			sortFn = (a,b) => defaultSortMethodForGetter(a,b,getter,column.type);
		}
		if (Tree.depth(dataTree) > 2) {
			throw new Error("Cannot sort a hierarchical tree", dataTree);
		}
		Tree.children(dataTree).sort((na,nb) => sortFn(Tree.value(na), Tree.value(nb)));
		if (tableSettings.sortByReverse) {
			dataTree.children = Tree.children(dataTree).reverse();
		}
	} // sort

	// hide columns with no data
	if (hideEmpty) {
		const data = Tree.allValues(dataTree);
		visibleColumns = visibleColumns.filter(c => {
			if (c.ui) return true; // preserve UI columns
			const getter = sortGetter(c);
			for(let di=0; di<data.length; di++) {
				let vi = getter(data[di]);
				if (vi) return true;
			}
			return false;
		});
	}
	// NB maxRows is done later to support csv-download being all data
	return {dataTree, visibleColumns};
} // ./filter



/**
 * The meat of the table! (normally)
 * @param {!Tree} dataTree
 */
const Rows = ({dataTree, visibleColumns, rowsPerPage, page=0, rowNum=0}) => {
	if ( ! dataTree) return null;
	// clip?
	let min = rowsPerPage? page*rowsPerPage : 0;
	let max = rowsPerPage? (page+1)*rowsPerPage : Infinity;
	// build the rows
	let $rows = [];
	Tree.map(dataTree, (node, parent, depth) => {
		const item = Tree.value(node);
		if ( ! item) return;
		// clip from min/max paging?
		if (rowNum < min || rowNum >= max) {
			rowNum++;
			return;
		}
		// <Row>
		let $row = <Row key={'r'+rowNum} item={item} rowNum={rowNum} depth={depth}
			columns={visibleColumns}
			node={node}
			/>;
		$rows.push($row);
		rowNum++;
	});
	// filter nulls (due to execute-but-don't-render-hidden behaviour)
	$rows = $rows.filter(a=>!!a); // NB: Row can return null
	return $rows;
};


const Th = ({column, table, tableSettings, dataArray, headerRender, showSortButtons}) => {
	assert(column, "SimpleTable.jsx - Th - no column?!");
	let sortByMe = _.isEqual(tableSettings.sortBy, column);
	let onClick = e => {
		console.warn('sort click', column, sortByMe, tableSettings);
		if (sortByMe) {
			table.setState({sortByReverse: ! tableSettings.sortByReverse});
			// tableSettings.sortByReverse = ! tableSettings.sortByReverse;
		} else {
			// table.setState({sortBy: c});
			table.setState({sortByReverse: false});
			// tableSettings.sortByReverse = false;
		}
		table.setState({sortBy: column});
		// tableSettings.sortBy = c;
	};
	let hText;
	if (headerRender) hText = headerRender(column);
	else hText = column.Header || column.accessor || str(column);	
	// add in a tooltip?
	if (column.tooltip) {
		hText = <div title={column.tooltip}>{hText}</div>;
	}
	
	// Sort indicator glyph: point down for descending, point up for ascending, outlined point down for "not sorted on this column"
	let arrow = null;
	if (sortByMe) arrow = tableSettings.sortByReverse ? <>&#x25B2;</> : <>&#x25BC;</>;
	else if (showSortButtons) arrow = <>&#x25BD;</>;

	return (
		<th>
			<span onClick={onClick}>{hText}{arrow}</span>
		</th>
	);
};

/**
 * A table row!
 * @param {!Number} rowNum Can be -1 for special rows ??0 or 1 indexed??
 * @param {?Number} depth Depth if a row tree was used. 0 indexed
 */
const Row = ({item, rowNum, node, columns, depth = 0}) => {
	// Experiment: Don't render the row and necessitate DOM reconciliation if hidden.
	// EventHostTable in TrafficReport has 90,000 elements & 5-10 second redraw times.
	// Render the cells to cause the needed side effects, but don't return anything from here.

	const cells = columns.map(col => (
		<Cell key={JSON.stringify(col)}
			row={rowNum} node={node}
			column={col} item={item}
		/>
	));

	return (
		<tr className={join("row"+rowNum, rowNum%2? "odd" : "even", "depth"+depth)} style={item.style}>
			{cells}
		</tr>
	);
};

const getValue = ({item, row, column}) => {
	if ( ! item) {
		console.error("SimpleTable.jsx getValue: null item", column);
		return undefined;
	}
	let accessor = column.accessor || column;
	let v = _.isFunction(accessor)? accessor(item) : item[accessor];
	return v;
};

/**
 * @param {Column} column
 * @returns {Function} item -> value for use in sorts and totals
 */
const sortGetter = (column) => {
	let getter = column.sortAccessor;
	if ( ! getter) getter = a => getValue({item:a, column:column});
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
	if (av==="" && bv) return 1;
	if (bv==="" && av) return -1;
	// case insensitive
	if (_.isString(av)) av = av.toLowerCase();
	if (_.isString(bv)) bv = bv.toLowerCase();
	// special type handling?
	if (type==='date') {
		try {
			av = new Date(av);
			bv = new Date(bv);
		} catch(err) {
			console.warn(err);
		}
	}
	// console.log("sortFn", av, bv, a, b);
	return (av < bv) ? -1 : (av > bv) ? 1 : 0;
};


const defaultCellRender = (v, column) => {
	if (v===undefined || Number.isNaN(v)) return null;
	if (column.format) {
		let significantDigits = 2; // set to the defualt value that was previously hard coded
		let precision = 2;
		if (column.precision){ precision = column.precision;}
		if (column.significantDigits){ significantDigits = column.significantDigits}

		if (CellFormat.ispercent(column.format)) {
			// 2 sig figs
			return printer.prettyNumber(100*v, significantDigits) + "%";
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
	if (nv !== undefined && nv !== null && ! Number.isNaN(nv)) {
		// 1 decimal place
		nv = Math.round(nv*10)/10;
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
 * @param {Number} row
 * @param {Column} column
 */
const Cell = ({item, row, node, column}) => {
	const citem = item;
	try {
		const v = getValue({item, row, column});
		let render = column.Cell;
		if ( ! render) {
			if (column.editable) {
				// safety check we can edit this
				assert(column.path || DataStore.getPathForItem(C.KStatus.DRAFT, item), "SimpleTable.jsx - Cell", item, column);
				render = val => <Editor value={val} row={row} column={column} item={citem} />;
			} else {
				render = defaultCellRender;
			}
		}
		const cellGuts = render(v, column, item, node);
		return <td style={column.style}>{cellGuts}</td>;
	} catch(err) {
		// be robust
		console.error(err);
		if (hidden) return null; // see above
		return <td>{str(err)}</td>;
	}
};

const TotalCell = ({dataTree, column}) => {
	// sum the data for this column
	let total = 0;
	const getter = sortGetter(column);
	Tree.mapByValue(dataTree, rItem => {
		const v = getter(rItem);
		// NB: 1* to force coercion of numeric-strings
		if ($.isNumeric(v)) total += 1*v;
	});
	if ( ! total) return <td></td>;
	// ??custom cell render might break on a Number. But Money seems to be robust about its input.
	const render = column.Cell || defaultCellRender;
	const cellGuts = render(total, column);
	return <td>{cellGuts}</td>;
};

/**
 * Editor for the use-case: each row = a DataStore data item.
 */
const Editor = ({row, column, value, item}) => {
	// what DataStore path?
	let path = column.path;
	if ( ! path) {
		try {
			// we edit draft
			path = DataStore.getPathForItem(C.KStatus.DRAFT, item);
			// make sure we have a draft
			if (!DataStore.getValue(path)) {
				DataStore.setValue(path, item, false);
			}
		} catch(err) {
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
		if ( ! path) path = ['widget', 'SimpleTable', row, str(column)];
		if ( ! prop) prop = 'value';
		dummyItem = {};
		let editedValue = DataStore.getValue(path.concat(prop));
		if (editedValue===undefined || editedValue===null) editedValue = value;
		dummyItem[prop] = editedValue;
	}
	let type = column.type;
	return (<Misc.PropControl type={type} item={dummyItem} path={path} prop={prop}
		saveFn={column.saveFn}
	/>);
}; // ./Editor
const CellFormat = new Enum("percent pounds string"); // What does a spreadsheet normally offer??


const TableFoot = ({csv, tableName, visibleColumns, topRow, addTotalRow, dataTree, bottomRow, numPages, colSpan, page, setPage}) => {
	if ( ! csv && numPages < 2) {
		return null;
	}
	return (<tfoot><tr>
		<td colSpan={colSpan}>
			{numPages > 1? <TableFootPager page={page} setPage={setPage} numPages={numPages} /> : null}
			{csv? <div className='pull-right'><CSVDownload {...{tableName, visibleColumns, topRow, addTotalRow, dataTree, bottomRow}} /></div> : null}
		</td>
	</tr></tfoot>);
};

const TableFootPager = ({page,setPage,numPages}) => {
	return (<div className='pull-left'>		
		Page  
		&nbsp; {page > 0? <a href='' onClick={e => stopEvent(e) && setPage(page-1)} >&lt;</a> : <span className='disabled'>&lt;</span>} 
		&nbsp; {page+1}
		&nbsp; {page+1 < numPages? <a href='' onClick={e => stopEvent(e) && setPage(page+1)}>&gt;</a> : <span className='disabled'>&gt;</span>}
		&nbsp; of {numPages} 
	</div>);
};

const CSVDownload = ({tableName, visibleColumns, topRow, addTotalRow, dataTree, bottomRow}) => {
	const ref = useRef();
	// assert(_.isArray(jsonArray), jsonArray);
	// // https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/Data_URIs
	const setupCsv = (e, $a) => {
		let dataArray = createCSVData({visibleColumns, topRow, addTotalRow, dataTree, bottomRow});
		let csv = dataArray.map(r => r.join? r.map(cell => csvEscCell(cell)).join(",") : ""+r).join("\r\n");
		let csvLink = 'data:text/csv;charset=utf-8,'+csv;	
		// console.log(e, e.target, $a, ref, csv, csvLink);
		e.target.setAttribute('href', csvLink);
	};
	// NB the entity below is the emoji "Inbox Tray" glyph, U+1F4E5
	return (
		<a href='' download={(tableName||'table')+'.csv'} 
			ref={ref}
			onClick={e => setupCsv(e, this)}
		>
			&#128229; Download .csv
		</a>
	);
};

const csvEscCell = s => {
	if ( ! s) return "";
	assMatch(s, String, "SimpleTable.jsx - csvEscCell not a String "+str(s));
	// do we have to quote?
	if (s.indexOf('"')===-1 && s.indexOf(',')===-1 && s.indexOf('\r')===-1 && s.indexOf('\n')===-1) {
		return s;
	}
	// quote to double quote
	s = s.replace(/"/g, '""');
	// quote it
	return '"'+s+'"';
};

export default SimpleTable;
export {CellFormat, Column};
