import React from 'react';

import { Button, Card, CardBody, Form, Alert } from 'reactstrap';
import { isDev } from '../Roles';
import { space } from '../utils/miscutils';

/**
 * Show an error as a BS alert.
 * @param {string} color=danger (red) by default. Options: danger|warning|info
 * @param {Error|Response|string} error If error is falsy, show nothing.
 */
const ErrorAlert =({error,color}) => {
	if ( ! error) return null;
	// NB: error.text is used by You-Again Login.error. error.message is used by JSend
	let emsg = _.isString(error)? error : space(error.status, error.statusText, error.message || error.text);
	let edetails = space(error.id, error.responseText, error.details, error.stack);
	if ( ! emsg) {
		console.warn("ErrorAlert - blank?",error);
		return null;
	}
	return <Alert color={color||'danger'}>
		{emsg}
		{isDev() && edetails && <p><small>Dev details: {edetails}</small></p>}
	</Alert>;
};
export default ErrorAlert;
