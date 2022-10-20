import React, { useEffect, useState } from 'react';
import { Input, InputGroup } from 'reactstrap';

import { fakeEvent, registerControl } from '../PropControl';

/**
 * See SimplePlace.java and IPlace.java
 */
const PropControlPlace = ({prop, storeValue, onChange}) => {
	// Use controlled inputs so their state is in-scope here - but don't bind them directly to DataStore
	const [name, setName] = useState(storeValue.name);

	// When the inputs change, synthesise an input-change event to pass up to PropControl and DataStore
	const _onChange = e => {
		setName(e.target.value);
		const newVal = { ...storeValue };
		newVal.name = name;
		onChange({...fakeEvent, target: { value: newVal }});
	};

	return <InputGroup>
		<Input type="text" name={`${prop}-name`} value={name} onChange={_onChange} />
	</InputGroup>;
};


registerControl({type: 'place', $Widget: PropControlPlace});

export default {};
