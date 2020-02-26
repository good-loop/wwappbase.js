/**
 * A convenient place for ad-hoc widget tests.
 * This is not a replacement for proper unit testing - but it is a lot better than debugging via repeated top-level testing.
 */
import React from 'react';
import ReactDOM from 'react-dom';

import SJTest, {assert} from 'sjtest';
import Login from 'you-again';
import printer from '../utils/printer.js';
import DataStore from '../plumbing/DataStore';
import C from '../CBase';
import Roles from '../Roles';
import Misc from './Misc';
import SimpleTable from './SimpleTable';
import PropControl from './PropControl';
import MDText from './MDText';
import Tree from '../../base/data/Tree';

const TestPage = () => {
	let path = ['misc', 'TestPage'];
	let widget = DataStore.getValue(path) || {};
	const ism = DataStore.isModified(path.concat('green'));
	const data = [
		{name:"Winterstein"},
		{name:"Dan"},{name:"Becca"},
		{name:"Nicholson"},
		{name:"Ken"},{name:"Lizzie"}
	];
	const columns = ["name", "foo"];
	const rowtree = new Tree();
	let w = Tree.add(rowtree, data[0]);
	Tree.add(w, data[1]); Tree.add(w, data[2]);
	let n = Tree.add(rowtree, data[3]);
	Tree.add(n, data[4]); Tree.add(n, data[5]);
	console.log(rowtree);

	return (
		<div className='TestPage'>
			<h1>Test Page</h1>
			<button onClick={e => DataStore.update()}>re-render</button>
			<p>Insert a test widget below</p>

			Row Table
			<SimpleTable columns={columns} data={data} hasFilter />

			Tree Table

			<SimpleTable columns={columns} dataTree={rowtree} hasCollapse hasFilter />

		</div>
	);

};

export default TestPage;
