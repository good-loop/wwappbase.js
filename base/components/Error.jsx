import React from 'react';

import { Button, Card, CardBody, Form, Alert } from 'reactstrap';

const Error =({error}) => {
	let emsg = _.isString(pv.error)? pv.error : join(pvCharity.error.status, pvCharity.error.statusText);
	let edetails = join(pvCharity.error.statusText, pvCharity.error.responseText);
	return <Alert>{emsg}</Alert>;
};
export default Error;
