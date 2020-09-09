

import React from 'react';

import PropControl, {registerControl, DSsetValue} from './PropControl';
import DataStore from '../plumbing/DataStore';
import { Badge } from 'reactstrap';
import CloseButton from './CloseButton';
import { useState } from 'react';
/**
 * A list-of-strings editor, where the strings are drawn as discrete "pills"
 */
const PropControlPills = ({item, modelValueFromInput, path, prop, proppath, type, fcolor, saveFn}) => {
	let pills = item[prop] || [];	

	const removeTag = (tg) => {
		let pills2 = pills.filter(t => t !== tg);
		// TODO refactor so this is donw by PropControl standard code, not plugin widget code
		DSsetValue(proppath, pills2);
		if (saveFn) saveFn({path, prop});
	};

	let [rawPartValue, setRawPartValue] = useState('');
	const addTag = e => {
		console.log("addTag", e);
		let tg = e.target.value || '';
		tg = tg.trim();
		if ( ! tg || tg === e.target.value) {
			// not finished typing - we need word+space to make a pill
			setRawPartValue(e.target.value);
			return;	
		}
		let pills2 = pills.concat(tg);
		let pills3 = modelValueFromInput? modelValueFromInput(pills2) : pills2;
		DSsetValue(proppath, pills3);
		if (saveFn) saveFn({path, prop});
		setRawPartValue('');
	};

	const onKeyUp = e => {
		console.log("keyup", e.key, e.keyCode, e);
		if (e.key==='Backspace' && pills.length) {
			removeTag(pills[pills.length-1]);
		}
	};

	return (<div className='form-control'>
		{pills.map((tg,i) => <Badge className='mr-1' key={i} color={fcolor && fcolor(tg)}>{tg} <CloseButton onClick={e => removeTag(tg)}/></Badge>)}
		<input value={rawPartValue} onChange={addTag} onKeyUp={onKeyUp} />
	</div>);
}

registerControl({type:'pills', $Widget: PropControlPills});
