import React, { useEffect, useState } from 'react';
import { Input, InputGroup } from 'reactstrap';
import { is } from '../../utils/miscutils';
import { asDate, getTimezone } from '../../utils/date-utils';
import Misc from '../Misc';

import PropControl, { fakeEvent, FormControl, registerControl } from '../PropControl';

// TODO use Intl.supportedValuesOf("timeZone") but filter down to a small set, one per offset??
const hardcodedTimezones = 'UTC Europe/London Australia/Sydney America/New_York America/Los_Angeles'.split(' ');

/**
 * 
 * @param {Object} p 
 * @returns 
 */
function PropControlTimezone2({type, label, help, placeholder, ...stuff}) {
	return (<div>
        <PropControl type="select" {...stuff} options={[getTimezone()].concat(hardcodedTimezones)}/>
	</div>);
}

registerControl({type: 'timezone', $Widget: PropControlTimezone2});

/**
 * @param {PropControlParams} p 
 */
function PropControlTimezone({prop="tz", ...p}) {
    return <PropControl type="timezone" prop={prop} {...p} />;
}

export default PropControlTimezone;
