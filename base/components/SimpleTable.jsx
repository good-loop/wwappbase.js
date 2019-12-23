/*
	Copying a little bit of react-table
	Because react-table was causing my system to crash.
	See https://github.com/react-tools/react-table#example
*/

// TODO it might be worth supporting one of these similar? same? formats
// http://specs.dataatwork.org/json-table-schema/
// https://frictionlessdata.io/specs/table-schema/

import React from 'react';
import ReactDOM from 'react-dom';

import SJTest, {assert, assMatch} from 'sjtest';
import _ from 'lodash';
import Misc from './Misc';
import printer from '../utils/printer';

import Enum from 'easy-enums';
import {asNum, join} from 'wwutils';
import DataStore from '../plumbing/DataStore';
import { relative } from 'path';
import { getClass, getType } from '../data/DataClass';
import BS from './BS';
import ErrorBoundary from './ErrorBoundary';

const str = printer.str;

// class ErrorBoundary extends React.Component {
// https://reactjs.org/docs/error-boundaries.html

/**
 * Column definitions:
 * Can be just a string!
 * Object format (all properties are optional)
 * {
 * 	accessor: string|function
 * 	Cell: function: value, column -> jsx
 * 	Header: string
 * 	editable: boolean
* 		saveFn: ({item,...}) -> {}
 * 	sortMethod: function
 * 	sortAccessor: function
 * 	type: Used for providing an editor - see Misc.PropControl* 	
 * 	tooltip: Text to show as help
 * }
 *
 * @param data: {Item[]} each row an item. item.style will set row tr styling
 * 
 * @param rowtree: {}
 * 
 * @param dataObject a {key: value} object, which will be converted into rows [{key:k1, value:v1}, {}...]
 * So the columns should use accessors 'key' and 'value'.
 * This is ONLY good for simple 2-column tables OR when used with rowtree.
 * 
 * @param columns: {Column[]}
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
 */
// NB: use a full component for error-handling
// Also state (though maybe we should use DataStore)
class SimpleTable extends React.Component {

	constructor(props) {
		super(props);

		// Enable checkboxes by passing "checkboxValues" to SimpleTable
		if(props.checkboxValues && props.columns) {
			// doc type??
			const checkboxValues = props.columns.reduce((obj, e) => {
				const colHead = e.Header || e.accessor || str(e);
				obj[colHead] = true;  
				return obj;
			}, {});			
			this.setState({checkboxValues});
		}
	}


	render() {
		let {
			tableName='SimpleTable', data, dataObject, columns, 
			headerRender, className, csv, 
			addTotalRow,
			topRow, 
			bottomRow, hasFilter, rowsPerPage, statePath, 
			// checkboxValues, copied into state for modifying
			hideEmpty,
			scroller, // if true, use fix col-1 scrollbars
			showSortButtons=true,
			rowtree,
			page=0
		} = this.props;

		const checkboxValues = this.state && this.state.checkboxValues;
		if (addTotalRow && ! _.isString(addTotalRow)) addTotalRow = 'Total';
		assert(_.isArray(columns), "SimpleTable.jsx - columns", columns);
		if (dataObject) {
			// flatten an object into rows
			assert( ! data, "SimpleTable.jsx - data or dataObject - not both");
			data = Object.keys(dataObject).map(k => { return {key:k, value:dataObject[k]}; });
		}
		assert( ! data || _.isArray(data), "SimpleTable.jsx - data must be an array of objects", data);
		const originalData = data;

		// Table settings are stored in widget state by default. But can also be linked to a DataStore via statePath
		let tableSettings = this.state;
		if (statePath) {
			tableSettings = DataStore.getValue(statePath);
			normalSetState = this.setState;
			this.setState = ns => {
				let ts = DataStore.getValue(statePath) || {};
				ts = Object.assign(ts, ns); // merge with other state settings
				DataStore.setValue(statePath, ts);
			};
		}
		if ( ! tableSettings) {
			tableSettings = {};
		}

		// filter and sort
		let {data:fdata,visibleColumns} = this.rowFilter({data, tableSettings, hideEmpty, columns, rowsPerPage});
		data = fdata;
		// clip max rows now?
		let numPages = 1;
		if (rowsPerPage) {
			numPages = Math.ceil(data.length / rowsPerPage);
			// NB: clipping is done later 'cos if we're doing a csv download, which should include all data
		}	

		let cn = 'table'+(className? ' '+className : '');
		// HACK build up an array view of the table
		// TODO refactor to build this first, then generate the html
		let dataArray = [[]];

		const filterChange = e => {
			const v = e.target.value;
			this.setState({filter: v});
		};
		// scrolling (credit to Irina): uses wrapper & scroller and css

		return (
			<div className='SimpleTable'>
				{hasFilter? <div className='form-inline'>&nbsp;<label>Filter</label>&nbsp;<input className='form-control' 
					value={tableSettings.filter || ''} 
					onChange={filterChange} 
					/></div> : null}
				<div>
					{checkboxValues? <RemoveAllColumns table={this} /> : null}
					<div className={scroller? 'wrapper' : ''}>
						<div className={scroller? 'scroller' : ''}>
<table className={cn}>
	<thead>
		<tr>
			{visibleColumns.map((col, c) => {
				return <Th table={this} tableSettings={tableSettings} key={c} 
					column={col} c={c} dataArray={dataArray} headerRender={headerRender} 
					checkboxValues={checkboxValues} showSortButtons={showSortButtons} />
			})
			}
		</tr>

		{topRow? <Row className='topRow' item={topRow} row={-1} columns={visibleColumns} dataArray={dataArray} /> : null}
		{addTotalRow? 
			<tr className='totalRow' >
				<th>{addTotalRow}</th>
				{visibleColumns.slice(1).map((col, c) => 
					<TotalCell data={data} table={this} tableSettings={tableSettings} key={c} column={col} c={c} />)
				}
			</tr>
			: null}

	</thead>

	<tbody>
		{data && ! rowtree? <Rows data={data} csv={csv} rowsPerPage={rowsPerPage} page={page} visibleColumns={visibleColumns} dataArray={dataArray} /> : null}		
		{dataObject && rowtree? <RowTree rowtree={rowtree} dataObject={dataObject} visibleColumns={visibleColumns} dataArray={dataArray} /> : null}

		{bottomRow? <Row item={bottomRow} row={-1} columns={visibleColumns} dataArray={dataArray} /> : null}
	</tbody>
	<TableFoot csv={csv} tableName={tableName} dataArray={dataArray} numPages={numPages} page={page} colSpan={visibleColumns.length} />
</table>
						</div>
					</div>	
					{checkboxValues? <DeselectedCheckboxes columns={columns} checkboxValues={checkboxValues} table={this} /> : null}
				</div>
			</div>			
		);
	} // ./ render()



	rowFilter({data, tableSettings, hideEmpty, columns, rowsPerPage, page=0}) {
		// filter?		
		// always filter nulls
		data = data.filter(row => !!row);
		if (tableSettings.filter) {
			data = data.filter(row => JSON.stringify(row).indexOf(tableSettings.filter) !== -1);
		}
		// sort?
		if (tableSettings.sortBy !== undefined) {
			// pluck the right column
			let column = tableSettings.sortBy;
			// sort fn
			let sortFn = column.sortMethod;
			if ( ! sortFn) {
				let getter = sortGetter(column);
				sortFn = (a,b) => defaultSortMethodForGetter(a,b,getter);
			}
			// sort!
			data = data.sort(sortFn);
			if (tableSettings.sortByReverse) {
				data = data.reverse();
			}
		} // sort
		//Only show columns that have checkbox: true.
		//Can't edit the actual columns object as that would make it impossible to reenable a column
		//Display only columns that haven't been disabled
		let visibleColumns = columns;
		const checkboxValues = this.state && this.state.checkboxValues;
		if(_.isObject(checkboxValues) && !_.isEmpty(checkboxValues)) {
			visibleColumns = columns.filter(c => {
				const headerKeyString = c.Header || c.accessor || str(c);
				return checkboxValues[headerKeyString];
			});
		}
		// hide columns with no data
		if (hideEmpty) {
			visibleColumns = visibleColumns.filter(c => {
				const getter = sortGetter(c);
				for(let di=0; di<data.length; di++) {
					let vi = getter(data[di]);
					if (vi) return true;
				}
				return false;
			});
		}
		// NB maxRows is done later to support csv-download being all data
		return {data, visibleColumns};
	} // ./filter


} // ./SimpleTable


/**
 * The meat of the table! (normally)
 * @param {Object[]} data 
 */
const Rows = ({data, visibleColumns, dataArray, csv, rowsPerPage, page=0}) => {
	// clip?
	let min = rowsPerPage? page*rowsPerPage : 0;
	let max = rowsPerPage? (page+1)*rowsPerPage : Infinity;
	if ( ! csv) { // need to process them all for csv download. otherwise clip early
		let pageData = data.slice(min, max);			
		data = pageData;
	}
	// build the rows
	let $rows = data.map( (d,i) => 
		<Row key={'r'+i} item={d} row={i} columns={visibleColumns} dataArray={dataArray} 
			hidden={csv && (i<min || i>=max)} />
	);
	return $rows;
};

/**
 * 
 * @param {!string tree} rowtree Describes the row hierarchy -- does not contain item data.. Use withj dataobject
 */
const RowTree = ({rowtree, dataObject, visibleColumns, dataArray, depth=0}) => {
	// use dataObject
	let $rows = [];
	rowTree2({rowtree, dataObject, visibleColumns, dataArray, depth, $rows});
	return $rows;
};
const rowTree2 = ({rowtree, dataObject, visibleColumns, dataArray, depth, $rows}) => {
	const rkeys = _.isArray(rowtree)? rowtree : Object.keys(rowtree);
	rkeys.forEach(rowName => {
		assMatch(rowName, String);
		let item = dataObject[rowName];
		if ( ! item) {
			return;
		}
		let i = item.index || $rows.length;
		let $row = <Row depth={depth} key={'r'+i} item={item} row={i} columns={visibleColumns} dataArray={dataArray} />;
		$rows.push($row);
		// recurse
		let rowInfo = rowtree[rowName];
		if (rowInfo) {
			rowTree2({rowtree:rowInfo, dataObject, visibleColumns, dataArray, depth:depth+1, $rows});			
		}
	});
};


// TODO onClick={} sortBy
const Th = ({column, table, tableSettings, dataArray, headerRender, showSortButtons, checkboxValues}) => {
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
	const headerKeyString = column.Header || column.accessor || str(column);
	if (headerRender) hText = headerRender(column);
	else hText = column.Header || column.accessor || str(column);
	dataArray[0].push(column.Header || column.accessor || str(column)); // csv gets the text, never jsx from headerRender!
	// add in a tooltip?
	if (column.tooltip) {
		hText = <div title={column.tooltip}>{hText}</div>;
	}

	let showColumnControl = null;
	if(checkboxValues) {
		if(checkboxValues[headerKeyString] === false) return null; //Don't display column if it has been deselected
		showColumnControl = (<div key={headerKeyString} 
			style={{cursor: 'pointer', marginBottom: '10px'}} 
			onClick={() => {checkboxValues[headerKeyString] = !checkboxValues[headerKeyString]; table.setState(checkboxValues)}} 
			>
				<Misc.Icon glyph='remove'/>
			</div>);
	}	
	
	let arrow = null;
	if (sortByMe) arrow = <Misc.Icon glyph={'triangle-'+(tableSettings.sortByReverse? 'top' :'bottom')} />;
	else if (showSortButtons) arrow = <Misc.Icon className='text-muted' glyph='triangle-bottom' />;

	return (
		<th>
			{showColumnControl}
			<span onClick={onClick}>{hText}{arrow}</span>
		</th>
	);
};

/**
 * A table row!
 * @param {!Number} row Can be -1 for specail rows ??0 or 1 indexed??
 * @param {?Boolean} hidden If true, process this row (eg for csv download) but dont diaply it
 * @param {?Number} depth Depth if a row tree was used. 0 indexed
 */
const Row = ({item, row, columns, dataArray, className, depth, hidden}) => {
	let dataRow = [];
	dataArray.push(dataRow);
	const $cells = columns.map(col => <Cell key={JSON.stringify(col)} row={row} column={col} item={item} dataRow={dataRow} />);
	const rstyle = Object.assign({}, hidden? {display:'none'} : null, item.style); // NB: we still have to render hidden rows, to get the data-processing side-effects
	return (<tr className={join(className, "depth"+depth)} depth={depth} style={rstyle}>
		{$cells}
	</tr>);
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
const defaultSortMethodForGetter = (a, b, getter) => {
	assert(_.isFunction(getter), "SimpleTable.jsx defaultSortMethodForGetter", getter);
	// let ia = {item:a, column:column};
	let av = getter(a);
	let bv = getter(b);
	// // avoid undefined 'cos it messes up ordering
	if (av === undefined || av === null) av = "";
	if (bv === undefined || bv === null) bv = "";
	// case insensitive
	if (_.isString(av)) av = av.toLowerCase();
	if (_.isString(bv)) bv = bv.toLowerCase();
	// console.log("sortFn", av, bv, a, b);
	return (av < bv) ? -1 : (av > bv) ? 1 : 0;
};

const defaultCellRender = (v, column) => {
	if (v===undefined || Number.isNaN(v)) return null;
	if (column.format) {
		if (CellFormat.ispercent(column.format)) {
			// 2 sig figs
			return printer.prettyNumber(100*v, 2)+"%";
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

const Cell = ({item, row, column, dataRow}) => {
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

		// HACK for the csv
		dataRow.push(defaultCellRender(v, column)); // TODO use custom render - but what about html/jsx?
		const cellGuts = render(v, column);
		return <td>{cellGuts}</td>;
	} catch(err) {
		// be robust
		console.error(err);
		return <td>{str(err)}</td>;
	}
};

const TotalCell = ({data, column}) => {
	// sum the data for this column
	let total = 0;
	const getter = sortGetter(column);
	data.forEach((rItem, row) => {
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
			if ( ! DataStore.getValue(path)) {				
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
const CellFormat = new Enum("percent"); // What does a spreadsheet normally offer??


const TableFoot = ({csv, tableName, dataArray, numPages, colSpan, page=0}) => {
	if ( ! csv && numPages < 2) {
		return null;
	}
	return (<tfoot><tr>
		<td colSpan={colSpan}>
			{numPages > 1? <div className='pull-left'>Page {page+1} of {numPages}</div> : null}
			{csv? <div className='pull-right'><CSVDownload tableName={tableName} dataArray={dataArray} /></div> : null}
		</td>
	</tr></tfoot>);
};

const CSVDownload = ({tableName, columns, data, dataArray}) => {
	// assert(_.isArray(jsonArray), jsonArray);
	// // https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/Data_URIs
	let csv = dataArray.map(r => r.join? r.map(cell => csvEscCell(cell)).join(",") : ""+r).join("\r\n");
	let csvLink = 'data:text/csv;charset=utf-8,'+csv;
	return (
		<a href={csvLink} download={(tableName||'table')+'.csv'} >
			<Misc.Icon glyph='download-alt' /> .csv
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

/**Simple panel containing checkboxes for columns that have been disabled*/
const DeselectedCheckboxes = ({columns, checkboxValues, table}) => {
	return (
		<div>
			{columns.map(c => {
				const headerKeyString = c.Header || c.accessor || str(c);
				if(checkboxValues[headerKeyString] === false) {
					return (
						<div key={'deselectedColumn'+headerKeyString} className='deselectedColumn' style={{display: 'inline-block', cursor: 'pointer', margin: '15px'}}
							 onClick={() => {checkboxValues[headerKeyString] = !checkboxValues[headerKeyString]; table.setState(checkboxValues)}}>
							<Misc.Icon glyph='plus' />
							{headerKeyString}
						</div>
					);
				}
				return null;
			})}
		</div>
	);
};

const RemoveAllColumns = ({table}) => {
	return (
		<div className='deselectAll' style={{display: 'inline-block', cursor: 'pointer', margin: '15px', color: '#9d130f'}} 
			onClick={() => {
				Object.keys(table.state.checkboxValues).forEach(k => table.state.checkboxValues[k] = false); 
				table.forceUpdate();}}>
			<Misc.Icon glyph='remove' />
			Remove all columns
		</div>
	);
};

export default SimpleTable;
export {CellFormat};
