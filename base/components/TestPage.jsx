/**
 * A convenient place for ad-hoc widget tests.
 * This is not a replacement for proper unit testing - but it is a lot better than debugging via repeated top-level testing.
 */
import React from 'react';
import DataStore from '../plumbing/DataStore';
import SimpleTable from './SimpleTable';


// 		WARNING:
// 		CODE HERE MAY BE DELETED WITHOUT NOTICE!

const TestPage = () => {

	let path = ['misc', 'TestPage'];
	let widget = DataStore.getValue(path) || {};	

	const data = [
		{name:"Winterstein"},
		{name:"Dan"},{name:"Becca"},
		{name:"Nicholson"},
		{name:"Ken"},{name:"Lizzie"}
	];
	const columns = ["name", "foo"];
	// const rowtree = new Tree();
	// let w = Tree.add(rowtree, data[0]);
	// Tree.add(w, data[1]); Tree.add(w, data[2]);
	// let n = Tree.add(rowtree, data[3]);
	// Tree.add(n, data[4]); Tree.add(n, data[5]);
	// console.log(rowtree);

	return (
		<div className="TestPage">
			<h1>Scratch Test Page</h1>
			<p>This page is for ad-hoc test & debug of individual widgets. The page is accessible in all our projects as #test.</p>
			<p>Insert a test widget below</p>

			Row Table
			<SimpleTable columns={columns} data={data} hasFilter rowsPerPage={2} csv />

		</div>
	);

};

export default TestPage;
