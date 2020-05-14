import React from 'react';

import { Button, Card, CardBody, Form, Alert } from 'reactstrap';
import { space } from '../utils/miscutils';

/**
 * Show an error as a BS alert.
 * color=danger (red) by default.
 * If error is falsy, show nothing.
 * @param {Error|Response|string} error
 */
const ErrorAlert =({error,color}) => {
	if ( ! error) return null;
	let emsg = _.isString(error)? error : space(error.status, error.statusText, error.message);
	let edetails = space(error.id, error.statusText, error.responseText, error.details, error.stack);
	if ( ! emsg && ! edetails) {
		console.warn("ErrorAlert - blank?",error);
		return null;
	}
	return <Alert color={color||'danger'}>{emsg}</Alert>;
};
export default ErrorAlert;
