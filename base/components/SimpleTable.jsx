/*
	Copying a little bit of react-table
	Because react-table was causing my system to crash.
	See https://github.com/react-tools/react-table#example
*/

import React from 'react';
import ReactDOM from 'react-dom';

import SJTest, {assert, assMatch} from 'sjtest';
import _ from 'lodash';
import Misc from './Misc';
import printer from '../utils/printer';

import Enum from 'easy-enums';
import DataStore from '../plumbing/DataStore';
import { relative } from 'path';
import { getDataClass, getType } from '../data/DataClass';

const str = printer.str;

// class ErrorBoundary extends React.Component {
// https://reactjs.org/docs/error-boundaries.html

/**
 * Column definitions:
 * Can be just a string!
 * Object format (all properties are optional)
 * {
 * 	accessor: string|function
 * 	Cell: function: value -> jsx
 * 	Header: string
 * 	editable: boolean
* 		saveFn: ({item,...}) -> {}
 * 	sortMethod: function
 * 	sortAccessor: function
 * 	type: Used for providing an editor - see Misc.PropControl* 	
 * }
 */

/**
 * data: {Object[]} each row an item
 * 
 * dataObject a {key: value} object, which will be converted into rows [{key:k1, value:v1}, {}...]
 * So the columns should use accessors 'key' and 'value'
 * 
 * columns: {Column[]}
 */
class SimpleTable extends React.Component {

	constructor(props) {
		super(props);
		
		if(props.checkboxValues === true && props.columns) {//Enable checkboxes by passing "checkboxValues" to SimpleTable. React interprets this as {checkboxValues : true}
			const checkboxValues = props.columns.reduce((obj, e) => {
				const colHead = e.Header || e.accessor || str(e);
				obj[colHead] = true;  
				return obj;
			}, {});
			this.state = {checkboxValues};
		}
	}

	componentWillMount() {
		this.setState({		
		});
	}

	componentDidCatch(error, info) {
		// TODO Display fallback UI
		this.setState({error, info});
		console.error(error, info); 
		if (window.onerror) window.onerror("SimpleTable caught error", null, null, null, error);
	}

	render() {
		let {tableName='SimpleTable', data, dataObject, columns, 
			headerRender, className, csv, addTotalRow, 
			topRow, bottomRow, hasFilter, rowsPerPage, statePath, checkboxValues} = this.props;
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

		// filter?		
		// always filter nulls
		data = data.filter(row => !!row);
		if (tableSettings.filter) {
			data = data.filter(row => JSON.stringify(row).indexOf(tableSettings.filter) !== -1);
		}
		// sort?
		if (tableSettings.sortBy !== undefined) {
			// TODO pluck the right column
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
		// max rows?
		if (rowsPerPage) {
			data = data.slice(0, rowsPerPage);
		}
		let cn = 'table'+(className? ' '+className : '');
		// HACK build up an array view of the table
		// TODO refactor to build this first, then generate the html
		let dataArray = [[]];

		const filterChange = e => {
			const v = e.target.value;
			this.setState({filter: v});
		};

		//Only show columns that have checkbox: true.
		//Can't edit the actual columns object as that would make it impossible to reenable a column
		//Display only columns that haven't been disabled
		let visibleColumns = columns;
		if(_.isObject(this.state.checkboxValues) && !_.isEmpty(this.state.checkboxValues)) {
			visibleColumns = columns.reduce((obj, c) => {
				const headerKeyString = c.Header || c.accessor || str(c);
				if(this.state.checkboxValues[headerKeyString]) obj.push(c);
				return obj;
			}, []);
		}
		// scrolling ideas:
		// 1: have divs that move onScroll
		// 2: have 3 tables, each of which uses visibility:hidden to only partly draw
		// style={{position:'relative', overflowY:'auto', maxHeight:'200px'}}

		return (
			<div className='SimpleTable'>
				{hasFilter? <div className='form-inline'>&nbsp;<label>Filter</label>&nbsp;<input className='form-control' 
					value={tableSettings.filter || ''} 
					onChange={filterChange} 
					/></div> : null}
				<div>
					{this.state.checkboxValues? <RemoveAllColumns table={this} /> : null}
					
					<table className={cn}>
						<thead>
							<tr>{visibleColumns.map((col, c) => {
									return <Th table={this} tableSettings={tableSettings} key={c} 
										column={col} c={c} dataArray={dataArray} headerRender={headerRender} checkboxValues={this.state.checkboxValues} showSortButtons />
								})
								}
							</tr>

							{topRow? <Row item={topRow} row={-1} columns={visibleColumns} dataArray={dataArray} /> : null}
							{addTotalRow? 
								<tr>
									<th>{addTotalRow}</th>
									{visibleColumns.slice(1).map((col, c) => 
										<TotalCell data={data} table={this} tableSettings={tableSettings} key={c} column={col} c={c} />)
									}
								</tr>
								: null}

						</thead>

						<tbody>					
							{data? data.map( (d,i) => <Row key={"r"+i} item={d} row={i} columns={visibleColumns} dataArray={dataArray} />) : null}
							{bottomRow? <Row item={bottomRow} row={-1} columns={visibleColumns} dataArray={dataArray} /> : null}
						</tbody>

						{csv? <tfoot><tr>
							<td colSpan={visibleColumns.length}><div className='pull-right'><CSVDownload tableName={tableName} dataArray={dataArray} /></div></td>
						</tr></tfoot>
							: null}	

					</table>

					{this.state.checkboxValues? <DeselectedCheckboxes columns={columns} checkboxValues={this.state.checkboxValues} table={this} /> : null}
				</div>
			</div>
		);
	}
} // ./SimpleTable

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
	dataArray[0].push(column.Header || column.accessor || str(column)); // csv gets the text, never jsx!

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

const Row = ({item, row, columns, dataArray}) => {
	let dataRow = [];
	dataArray.push(dataRow);
	
	return (<tr>
		{columns.map(col => <Cell key={JSON.stringify(col)} row={row} column={col} item={item} dataRow={dataRow} />)}
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
	if (_.isNumber(v)) {
		// 1 decimal place
		v = Math.round(v*10)/10;
		// commas
		v = printer.prettyNumber(v, 10);
	}
	// e.g. Money has a to-string
	let dc = getDataClass(getType(v));
	if (dc && dc.str) return dc.str(v);
	return str(v);
};

const Cell = ({item, row, column, dataRow}) => {
	try {
		const v = getValue({item, row, column});
		let render = column.Cell;
		if ( ! render) {
			if (column.editable) {
				render = val => <Editor value={val} row={row} column={column} item={item} />;
			} else {
				render = defaultCellRender;
			}
		}

		// HACK for the csv
		dataRow.push(defaultCellRender(v, column)); // TODO use custom render - but what about html/jsx?

		return <td>{render(v, column)}</td>;
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
		if (_.isNumber(v)) total += v;
	});
	if ( ! total) return <td></td>;
	// ??custom cell render might break on a Number. But Money seems to be robust about its input.
	let render = column.Cell || defaultCellRender;
	return <td>{render(total, column)}</td>;
};

/**
 * Editor for the use-case: each row = a DataStore data item.
 */
const Editor = ({row, column, value, item}) => {
	// what DataStore path?
	let path = column.path;
	if ( ! path) {
		try {
			path = DataStore.getPathForItem(C.KStatus.ALL, item);
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
		// fallback to dummies
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
};
const CellFormat = new Enum("percent"); // What does a spreadsheet normally offer??

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
