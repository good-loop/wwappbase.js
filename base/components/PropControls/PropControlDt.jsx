import React, { useEffect, useState } from 'react';
import { Input, InputGroup } from 'reactstrap';

import { registerControl } from '../PropControl';

// See TUnit
const label4TUnit = {MILLISECOND: 'msec', SECOND: 'second', MINUTE: 'minute', HOUR: 'hour', DAY: 'day', WEEK: 'week', MONTH: 'month', YEAR: 'year'};

// Base for a dummy event with dummy functions so we don't get exceptions when trying to kill it
// TODO Copy-paste from PropControlUpload.jsx - factor out?
const fakeEvent = {
	preventDefault: () => null,
	stopPropagation: () => null,
	cooked: true, // Signal PropControl wrapper code NOT to call setRawValue
};

/**
 * See Dt.java - this control bundles two inputs (numeric for count, drop-down for unit) into a time-duration editor.
 */
const PropControlDt = ({prop, storeValue, onChange, unitOptions = Object.keys(label4TUnit)}) => {
	// Use controlled inputs so their state is in-scope here - but don't bind them directly to DataStore
	const [nVal, setNVal] = useState(storeValue.n);
	// Default to unit=SECOND if available
	const [unitVal, setUnitVal] = useState(storeValue.unit || (() => unitOptions.find(a => a === 'SECOND') ? 'SECOND' : unitOptions[0]));

	// When the inputs change, synthesise an input-change event to pass up to PropControl and DataStore
	useEffect(() => {
		const newVal = { ...storeValue };
		newVal.n = nVal;
		newVal.unit = unitVal;
		onChange({...fakeEvent, target: { value: newVal }});
	}, [nVal, unitVal]);

	// Disable the dropdown (but keep it present) if there's only one option
	const unitDisable = unitOptions.length <= 1;

	return <InputGroup>
		<Input type="number" name={`${prop}-n`} value={nVal} onChange={(e) => setNVal(e.target.value)} />
		<Input type="select" name={`${prop}-unit`} value={unitVal} onChange={(e) => setUnitVal(e.target.value)} disabled={unitDisable}>
			{unitOptions.map(option => <option key={option} value={option}>{label4TUnit[option] || option}</option>)}
		</Input>
	</InputGroup>;
};


registerControl({type: 'dt', $Widget: PropControlDt});

export default {};
