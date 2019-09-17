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

const TestPage = () => {
	let path = ['widget', 'TestPage'];
	let widget = DataStore.getValue(path) || {};

	return (
		<div className='TestPage'>
			<h1>Test Page</h1>
			<p>Insert a test widget below</p>

			<PropControl label='Money' prop='green' path={path} type='Money' />
			<pre>{""+widget.green} = {JSON.stringify(widget.green)}</pre>

			<PropControl label='Yes No' prop='yn' path={path} type='yesNo' />
			<pre>{JSON.stringify(widget.yn)}</pre>

		</div>
	);

};

export default TestPage;
