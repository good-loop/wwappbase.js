import React, { useEffect, useState } from 'react';
import { Input, InputGroup } from 'reactstrap';

import PropControl, { fakeEvent, registerControl } from '../PropControl';

// See TUnit
const label4TUnit = {MILLISECOND: 'msec', SECOND: 'seconds', MINUTE: 'minutes', HOUR: 'hours', DAY: 'days', WEEK: 'weeks', MONTH: 'months', YEAR: 'years'};

/**
 * See Dt.java - this control bundles two inputs (numeric for count, drop-down for unit) into a time-duration editor.
 */
const PropControlDt2 = ({prop, storeValue, onChange, unitOptions = Object.keys(label4TUnit)}) => {
	// Use controlled inputs so their state is in-scope here - but don't bind them directly to DataStore
	const [nVal, setNVal] = useState(storeValue.n);
	// Default to unit=SECOND if available
	const [unitVal, setUnitVal] = useState(storeValue.unit || (() => unitOptions.find(a => a === 'SECOND') ? 'SECOND' : unitOptions[0]));

	// Detect local changes and send to store
	useEffect(() => {
		if (nVal === storeValue.n && unitVal === storeValue.unit) return; // don't fire unnecessarily
		_onChange();
	}, [nVal, unitVal]);

	// Detect store changes and update local
	useEffect(() => {
		if (nVal === storeValue.n && unitVal === storeValue.unit) return; // don't fire unnecessarily
		setNVal(storeValue.n);
		setUnitVal(storeValue.unit);
	}, [storeValue.n, storeValue.unit]);
	
	// When the inputs change, synthesise an input-change event to pass up to PropControl and DataStore
	const _onChange = () => {
		const newVal = { ...storeValue };
		newVal.n = nVal;
		newVal.unit = unitVal;
		onChange({...fakeEvent, target: { value: newVal }});
	};

	// Disable the dropdown (but keep it present) if there's only one option
	const unitDisable = unitOptions.length <= 1;

	return <InputGroup>
		<Input type="number" name={`${prop}-n`} value={nVal} onChange={(e) => { setNVal(e.target.value); }} />
		<Input type="select" name={`${prop}-unit`} value={unitVal} onChange={(e) => { setUnitVal(e.target.value); }} disabled={unitDisable}>
			{unitOptions.map(option => <option key={option} value={option}>{label4TUnit[option] || option}</option>)}
		</Input>
	</InputGroup>;
};


registerControl({type: 'dt', $Widget: PropControlDt2});


/**
 * See Dt.java - this control bundles two inputs (numeric for count, drop-down for unit) into a time-duration editor.
 * @param {PropControlParams} p 
 */
function PropControlDt(p) {
    return <PropControl type="dt" {...p} />;
}

export default PropControlDt;
