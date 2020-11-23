import React from 'react';

import SJTest, {assert} from 'sjtest';
import Login from 'you-again';
import printer from '../utils/printer.js';

const E404Page = () => {
	return (
		<div className="E404Page">
			<h1>Error 404: Page not found</h1>

			<p>
				Sorry: <code>{""+window.location}</code> is not a valid page url.
			</p>

		</div>
	);
};

export default E404Page;
