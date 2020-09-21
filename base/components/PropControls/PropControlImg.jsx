import React from 'react';

import { FormControl, registerControl } from '../PropControl';
import { urlValidator } from './PropControlUrl';
import Misc from '../Misc';



const PropControlImg = ({prop, storeValue, onChange, bg, ...rest}) => (
	<div>
		<FormControl type="url" name={prop} value={storeValue} onChange={onChange} onBlur={onChange} {...rest} />
		<div className="pull-right" style={{ background: bg, padding: bg ? '20px' : '0' }}><Misc.ImgThumbnail url={storeValue} background={bg} /></div>
		<div className="clearfix" />
	</div>
);


// registerControl({
// 	type: 'img',
// 	$Widget: PropControlImg,
// 	validator: urlValidator
// });

// TODO Is this the Right Way?
// We can't call registerControl here because - due to a dependency loop - it may not exist yet.
// So we let PropControl.jsx receive a specification for each new control type & register them itseld.
export const specs = [
	{
		type: 'img',
		$Widget: PropControlImg,
		validator: urlValidator
	}
];
