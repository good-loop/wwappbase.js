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

const TestPage = () => {
	let path = ['widget', 'TestPage'];

	let columns = ['a', 'b', 'c', 'd'];
	let data = [{a:1,b:0}, {a:0, d:2}, {b:0,d:3}];

	return (
		<div className='TestPage'>
			<h2>Test Page</h2>
			<p>Insert a test widget below</p>

			<SimpleTable columns={columns} data={data} hideEmpty />

			<PropControl type='radio' path={path} prop='radioTest' options={['daily','weekly','annual']}  />

			<p>Inline</p>
			<PropControl type='radio' path={path} prop='radioTest2' options={['a','b','c']} inline />

		</div>
	);
};

export default TestPage;
