import React, { useEffect, useState } from 'react';
import { Input, InputGroup } from 'reactstrap';
import { is } from '../../utils/miscutils';
import { asDate } from '../../utils/date-utils';
import Misc from '../Misc';

import PropControl, { fakeEvent, FormControl, registerControl } from '../PropControl';

/**
 * Note: `date` vs `datetime-local`
 * See https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/datetime-local
 * 
 * @param {Object} p 
 * @returns 
 */
function PropControlDate2({ prop, storeValue, rawValue, value, onChange, ...otherStuff }) {
	// Roll back to native editor on 27/04/2022
	// The bug caused us to use the custom text editor was from 2017 https://github.com/winterstein/sogive-app/issues/71 & 72
	// I don't think it will happen again, but it's worth keeping in mind.
	if ( ! is(rawValue) && storeValue) {
		rawValue = Misc.isoDate(storeValue);
	}

	// Strip out the time part!
	// TODO support datetime-local
	if (rawValue && rawValue.includes("T")) {
		rawValue = rawValue.substr(0, rawValue.indexOf("T"));
	}
	// NB: ignore "value" if it has been sent through -- if it has a time-part the widget would show blank. rawValue is what we use.

	return (<div>
		<FormControl type="date" name={prop} value={rawValue} onChange={onChange} {...otherStuff} />
	</div>);
}


/**
 * Note: `date` vs `datetime-local`
 * See https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/datetime-local
 * 
 * @param {Object} p 
 * @returns 
 */
function PropControlDateTime2({ prop, type, storeValue, rawValue, onChange, ...otherStuff }) {
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
