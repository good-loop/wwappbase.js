import React from 'react';
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


const PropControlDt = ({prop, storeValue, onChange, unitOptions}) => {
	// NB: Uses two inputs, which get presented upwards as if one thing
	const onChangeInner = ({ n, unit }) => {
		const newVal = { ...storeValue };
		if (n) newVal.n = n;
		if (unit) newVal.unit = unit;

		onChange({...fakeEvent, target: { value: newVal }});
	};

	if ( ! unitOptions) unitOptions = Object.keys(label4TUnit);

	// Minor todo: this could look a bit prettier with a BS input append
	return <InputGroup>
		<Input type="number" name={`${prop}-n`} value={storeValue.n} onChange={(e) => onChangeInner({n: e.target.value})} />
		{unitOptions.length > 1?
			<Input type="select" name={`${prop}-unit`} value={storeValue.unit} onChange={(e) => onChangeInner({unit: e.target.value})} default="SECOND">
				{unitOptions.map(option => <option key={option} value={option}>{label4TUnit[option] || option}</option>)}
			</Input>
			: <span> {label4TUnit[unitOptions[0]] || unitOptions[0]}</span>
		}
	</InputGroup>;
};


registerControl({type: 'dt', $Widget: PropControlDt});

export default {};
