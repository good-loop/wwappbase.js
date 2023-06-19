import React from 'react';

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

export const E401Page = () => {
	return (
		<div className="E404Page">
			<h1>Error 401: Invalid authentication</h1>

			<p>
				Make sure you are logged in.
			</p>

		</div>
	);
};

export default E404Page;
