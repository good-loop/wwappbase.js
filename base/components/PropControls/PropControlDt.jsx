import React from 'react';
import { Input, InputGroup } from 'reactstrap';

import { registerControl } from '../PropControl';

// See TUnit
const options = {MILLISECOND: 'msec', SECOND: 'sec', MINUTE: 'min', HOUR: 'hour', DAY: 'day', WEEK: 'week', MONTH: 'month', YEAR: 'year'};

const domOptions = Object.entries(options).map(([option, label]) => <option key={option} value={option}>{label}</option>)

// Base for a dummy event with dummy functions so we don't get exceptions when trying to kill it
// TODO Copy-paste from PropControlUpload.jsx - factor out?
const fakeEvent = {
	preventDefault: () => null,
	stopPropagation: () => null,
	cooked: true, // Signal PropControl wrapper code NOT to call setRawValue
};


const PropControlDt = ({prop, storeValue, onChange}) => {
	const onChangeInner = ({ n, unit }) => {
		const newVal = { ...storeValue };
		if (n) newVal.n = n;
		if (unit) newVal.unit = unit;

		onChange({...fakeEvent, target: { value: newVal }});
	};

	return <InputGroup inline>
		<Input type="number" name={`${prop}-n`} value={storeValue.n} onChange={(e) => onChangeInner({n: e.target.value})} />
		<Input type="select" name={`${prop}-unit`} value={storeValue.unit} onChange={(e) => onChangeInner({unit: e.target.value})} default="SECOND">
			{domOptions}
		</Input>
	</InputGroup>;
};


registerControl({type: 'dt', $Widget: PropControlDt});

export default {};
