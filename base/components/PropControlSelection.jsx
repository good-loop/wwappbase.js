

import React from 'react';

import PropControl, {registerControl, DSsetValue} from './PropControl';
import DataStore from '../plumbing/DataStore';
import { Badge, Form, FormGroup, Input, Label } from 'reactstrap';
import CloseButton from './CloseButton';
import { useState } from 'react';
import { asArray, labeller } from '../utils/miscutils';

/**
 * A list-of-strings editor, where the strings are drawn as discrete "pills"
 * @param {Object} p
 * @param {String[]} p.value
 * @param {String[] | Function | Object} p.labels Optional value-to-string convertor.
 */
const PropControlCheckboxes = ({rawValue, storeValue, setRawValue, modelValueFromInput, path, prop, proppath, type, options, labels, inline, fcolor, saveFn}) => {
	assert(options, `PropControl: no options for radio ${prop}`);
	assert(options.map, `PropControl: radio options for ${prop} not an array: ${options}`);

	const listValue = asArray(storeValue);

	// Make an option -> nice label function
	// the labels prop can be a map or a function
	let labelFn = labeller(options, labels);

	// convert value to String[] for checkboxes
	const onChange = e => {
		console.log("onchange", e); // minor TODO DataStore.onchange recognise and handle events
		const val = e && e.target && e.target.value;			
		// toggle on/off
		let newList;
		if (listValue.includes(val)) {
			newList = listValue.filter(v => v !== val);
		} else {
			newList = listValue.concat(val);
		}
		let newList2 = modelValueFromInput? modelValueFromInput(newList) : newList;
		DSsetValue(proppath, newList2);
		if (saveFn) saveFn({ event: e, path, prop, value: newList2});
	};

	return (
		<Form>
			{options.map(option => (
				<FormGroup check inline={inline} key={option}>					
					<Input type='checkbox' key={`option_${option}`} 
						className="form-check-input"
						name={prop} value={option}
						checked={listValue.includes(option)}
						onChange={onChange}
					/>
					<Label check>
						{labelFn(option)}
					</Label>
				</FormGroup>
			))}
		</Form>
	);
}; // ./radio

registerControl({type:'checkboxes', $Widget: PropControlCheckboxes});

// This is not really for use
const PropControlSelection = PropControlCheckboxes;
export default PropControlSelection;
