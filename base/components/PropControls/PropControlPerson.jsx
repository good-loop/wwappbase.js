import React from 'react';
import { InputGroup } from 'reactstrap';

import PropControl, { registerControl } from '../PropControl';


/**
 * See PersonLite.java
 */
const PropControlPerson = ({proppath}) => {
	return (<InputGroup>
		<PropControl type="text" prop="name" path={proppath} label />
		<PropControl type="imgUpload" prop="img" path={proppath} label="Portrait photo" />
	</InputGroup>);
};


registerControl({type: 'person', $Widget: PropControlPerson});

export default {};
