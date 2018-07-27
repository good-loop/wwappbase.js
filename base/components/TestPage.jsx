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

const TestPage = () => {
	return (
		<div className='TestPage'>
			<h2>Test Page</h2>
			<p>Insert a test widget below</p>

			


		</div>
	);
};

export default TestPage;
