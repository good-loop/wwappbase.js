import React, { useEffect, useState } from 'react';
import { Input, InputGroup } from 'reactstrap';
import { is, stopEvent } from '../../utils/miscutils';
import { asDate, dayEndTZ, isoDate, isoDateTZ } from '../../utils/date-utils';

import PropControl, { fakeEvent, FormControl, registerControl } from '../PropControl';
import { dayStartTZ } from '../../utils/date-utils';
import { newDateTZ } from '../../utils/date-utils';
import dayjs from 'dayjs';

/**
 * This is for dates only. It is timezone aware. Note: `date` vs `datetime-local`
 * See https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/datetime-local
 * 
 * @param {Object} p 
 * @param {string} p.time start|end|none start/end of day, or "none" for no-time (date part only, timezone logic off)
 * NB: we like sending full timestamps for clarity around timezone issues
 * @returns 
 */
function PropControlDate2({ path, prop, type, storeValue, rawValue, setRawValue, value, onChange, saveFn, set, time, min, max, ...otherStuff }) {
	// Roll back to native editor on 27/04/2022
	// The bug that caused us to use the custom text editor was from 2017 https://github.com/winterstein/sogive-app/issues/71 & 72
	// I don't think it will happen again, but it's worth keeping in mind.

	if ( ! is(rawValue) && storeValue) {
		rawValue = isoDateTZ(storeValue);
	}

	// Strip out the time part
	if (rawValue && rawValue.includes("T")) {
		try {
			rawValue = isoDateTZ(new Date(rawValue));
		} catch(err) {
			console.warn(err); // rawValue is allowed to be bogus in principle, though that shouldnt happen here since it comes from a native date widget
		}
	}
	// NB: ignore "value" if it has been sent through -- if it has a time-part the widget would show blank. rawValue is what we use.

	// HACK end day = start next day, so display day-1 in the widget
	if (rawValue && "end"===time) {
		let d = new Date(rawValue);
		d.setDate(d.getDate() - 1);
		rawValue = isoDate(d);
	}

	// replace the default onChange to use full-iso-date-time (rather than just the date part). timezone aware
	const onChangeDate = e => {
		stopEvent(e);
		setRawValue(e.target.value);
		let mv = null;
		if (e.target.value) {
			if ("none" === time) {
				mv = e.target.value; // No time wanted? value should be yyyy-mm-dd already, so no need to mess around with timezone
			} else {
				let date = newDateTZ(e.target.value);				
				date = "end"===time? dayEndTZ(date) : dayStartTZ(date); // start/end of day			
				mv = dayjs(date).format("YYYY-MM-DD")
			}
		}
		set(mv);
		if (saveFn) saveFn({ event: e, path, prop, value: mv });		
	};

	let minDate = min? isoDateTZ(min) : undefined;
	let maxDate = max? isoDateTZ(max) : undefined;

	return <FormControl type="date" name={prop} value={rawValue} onChange={onChangeDate} min={minDate} max={maxDate} {...otherStuff} />;
}


/**
 * Note: `date` vs `datetime-local`
 * See https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/datetime-local
 * 
 * @param {Object} p 
 * @returns 
 */
function PropControlDateTime2({ prop, type, storeValue, rawValue, onChange, set, ...otherStuff }) {
	// Roll back to native editor on 27/04/2022
	// The bug caused us to use the custom text editor was from 2017 https://github.com/winterstein/sogive-app/issues/71 & 72
	// I don't think it will happen again, but it's worth keeping in mind.
	if ( ! is(rawValue) && storeValue) {
		rawValue = asDate(storeValue).toISOString();
	}

	return (<div>
		<FormControl type="datetime-local" name={prop} value={rawValue} onChange={onChange} {...otherStuff} />
	</div>);
}


/** TODO refactor this Default validator for date values */
const dateValidator = (val, rawValue) => {
	if (!val) {
		// raw but no date suggests the server removed it
		if (rawValue) return 'Please use the date format yyyy-mm-dd';
		return null;
	}
	try {
		let sdate = '' + new Date(val);
		if (sdate === 'Invalid Date') {
			return 'Please use the date format yyyy-mm-dd';
		}
	} catch (er) {
		return 'Please use the date format yyyy-mm-dd';
	}
};

registerControl({type: 'date', $Widget: PropControlDate2});

registerControl({ type: 'datetime', $Widget: PropControlDateTime2 });
registerControl({ type: 'datetime-local', $Widget: PropControlDateTime2 });

/**
 * @param {PropControlParams} p 
 */
function PropControlDate(p) {
  return <PropControl type="date" {...p} />;
}

export default PropControlDate;
