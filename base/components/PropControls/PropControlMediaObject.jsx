import React from 'react';

import PropControl, { registerControl } from '../PropControl';


const PropControlMediaObject = ({ proppath, uploadType }) => {
	return (<>
		<PropControl type={uploadType} prop="contentUrl" path={proppath} />
		<PropControl type="text" prop="caption" path={proppath} label size="sm" />
	</>);
};


/** See ImageObject.java */
const PropControlImageObject = (props) => <PropControlMediaObject uploadType="imgUpload" {...props} />;
/** See VideoObject.java */
const PropControlVideoObject = (props) => <PropControlMediaObject uploadType="videoUpload" {...props} />;


registerControl({type: 'ImageObject', $Widget: PropControlImageObject});
registerControl({type: 'VideoObject', $Widget: PropControlVideoObject});


export default {};
