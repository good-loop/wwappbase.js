import React, { useEffect, useState } from 'react';
import { Input, InputGroup } from 'reactstrap';
import { is } from '../../utils/miscutils';
import { asDate, getTimeZone, setTimeZone } from '../../utils/date-utils';
import Misc from '../Misc';

import PropControl, { fakeEvent, FormControl, registerControl } from '../PropControl';

// TODO use Intl.supportedValuesOf("timeZone") but filter down to a small set, one per offset??
const hardcodedTimezones = 'UTC Europe/London Australia/Sydney America/New_York America/Los_Angeles'.split(' ');

/**
 * 
 * @param {Object} p 
 * @returns 
 */
function PropControlTimezone2({type, label, help, placeholder, saveFn, ...stuff}) {
    const saveFn2 = ({path, prop, value, event}) => {
        if (prop==="tz" && value) {
            setTimeZone(value);
        }
        if (saveFn) saveFn({path, prop, value, event});
    };
	return (<div>
        <PropControl type="select" {...stuff} 
            options={[getTimeZone()].concat(hardcodedTimezones)}
            saveFn={saveFn2}
        />
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
