import React from 'react';

import { FormControl, registerControl } from '../PropControl';

/** Default validator for URL values*/
const urlValidator = ({value, props}) => {
	// no URL is not inherently an error
	if (!value) return;
	// Protocol-relative URLs are fine!
	if (value.startsWith('//')) value = 'https:' + value;

	try {
		const urlObject = new URL(value);

		if (urlObject.protocol !== 'https:') {
			return {
				status: (props.https ? 'error' : 'warning'),
				message: 'Please use https for secure URLs'
			};
		}
	} catch (e) {
		return { status: 'error', message: 'This is not a valid URL' };
	}
};


// TODO Big similarities between url, img and uploader types - more code reuse?
const PropControlUrl = ({https, prop, value, storeValue, ...rest}) => (
	<div>
		<FormControl type="url" name={prop} value={storeValue} onBlur={rest.onChange} {...rest} />
		<div className="pull-right"><small>{value ? <a href={value} target="_blank">open in a new tab</a> : null}</small></div>
		<div className="clearfix" />
	</div>
);


// registerControl({
// 	type: 'url',
// 	$Widget: PropControlUrl,
// 	validator: urlValidator
// });

// Expose for other PropControls like imgUpload
// TODO Should validators be exposed under a standard name?
export { urlValidator };

// TODO Is this the Right Way?
// We can't call registerControl here because - due to a dependency loop - it may not exist yet.
// So we let PropControl.jsx receive a specification for each new control type & register them itseld.
export const specs = [
	{
		type: 'url',
		$Widget: PropControlUrl,
		validator: urlValidator
	}
];
