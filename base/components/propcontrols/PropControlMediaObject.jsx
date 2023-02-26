import React, { useEffect, useState } from 'react';
import { Input, InputGroup } from 'reactstrap';
import { countryListAlpha2 } from '../../data/CountryRegion';

import PropControl, { fakeEvent, registerControl } from '../PropControl';
import PropControlSelection from './PropControlSelection';
import SubCard from '../SubCard';
import PropControlPerson from './PropControlPerson';
const dummy = PropControlPerson;

const PropControlMediaObject = ({path, prop, proppath, uploadType, storeValue, onChange, warnOnUnpublished}) => {
	return (<>
        <PropControl type={uploadType} prop='contentUrl' path={proppath} />	
        <PropControl type="text" prop='caption' path={proppath} label size='sm' />	
	</>);
};

/**
 * See ImageObject.java
 */
const PropControlImageObject = (props) => <PropControlMediaObject uploadType='imgUpload' {...props} />;
/**
 * See VideoObject.java
 */
 const PropControlVideoObject = (props) => <PropControlMediaObject uploadType='videoUpload' {...props} />;

registerControl({type: 'ImageObject', $Widget: PropControlImageObject});
registerControl({type: 'VideoObject', $Widget: PropControlVideoObject});

export default {};
