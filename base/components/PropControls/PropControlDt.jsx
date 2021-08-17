import React from 'react';
import { Input, InputGroup } from 'reactstrap';

import { registerControl } from '../PropControl';


const options = {MILLISECOND: 'msec', SECOND: 'sec', MINUTE: 'min', HOUR: 'hour', DAY: 'day', WEEK: 'week', MONTH: 'month', YEAR: 'year'};

const domOptions = Object.entries(options).map(([option, label]) => <option key={option} value={option}>{label}</option>)

// Base for a dummy event with dummy functions so we don't get exceptions when trying to kill it
// TODO Copy-paste from PropControlUpload.jsx - factor out?
const fakeEvent = {
	preventDefault: () => null,
	stopPropagation: () => null,
	cooked: true, // Signal PropControl wrapper code NOT to call setRawValue
};


const PropControlDt = ({path, prop, value, storeValue, onChange, ...rest}) => {
	const onChangeInner = ({ newN, newUnit }) => {
		const newVal = { ...storeValue };
		if (newN) newVal.n = newN;
		if (newUnit) newVal.unit = newUnit;
		
		onChange({...fakeEvent, target: { value: newVal }});
	};


	return <InputGroup inline>
		<Input type="number" name={`${prop}-n`} value={storeValue.n} onChange={(e) => onChangeInner({newN: e.target.value})} />
		<Input type="select" name={`${prop}-unit`} value={storeValue.unit} onChange={(e) => onChangeInner({newUnit: e.target.value})} default="SECONDS">
			{domOptions}
		</Input>
	</InputGroup>;
};



registerControl({type: 'dt', $Widget: PropControlDt});

export default {};
