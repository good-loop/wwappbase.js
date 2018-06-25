/** TODO refactor Misc.PropControl into here
 */
import React from 'react';

// FormControl removed in favour of basic <inputs> while debugging input lag
// import {assert, assMatch} from 'sjtest';
// import _ from 'lodash';
import Enum from 'easy-enums';
// import { setHash, XId, addScript} from 'wwutils';
// import PV from 'promise-value';
// import Dropzone from 'react-dropzone';

// import DataStore from '../plumbing/DataStore';
// import ServerIO from '../plumbing/ServerIOBase';
// import ActionMan from '../plumbing/ActionManBase';
// import printer from '../utils/printer';
// import C from '../CBase';
// import Money from '../data/Money';
// import Autocomplete from 'react-autocomplete';
// // import I18n from 'easyi18n';
// import {getType, getId, nonce} from '../data/DataClass';
// import md5 from 'md5';

/**
 * This replaces the react-bootstrap version 'cos we saw odd bugs there. 
 * Plus since we're providing state handling, we don't need a full component.
 */
const FormControl = ({value, type, required, ...otherProps}) => {
	if (value===null || value===undefined) value = '';

	if (type==='color' && ! value) { 
		// workaround: this prevents a harmless but annoying console warning about value not being an rrggbb format
		return <input className='form-control' type={type} {...otherProps} />;	
	}
	// add css classes for required fields
	let klass = 'form-control'+ (required? (value? ' form-required' : ' form-required blank') : '');
	// remove stuff intended for other types that will upset input
	delete otherProps.options;
	delete otherProps.labels;
	return <input className={klass} type={type} value={value} {...otherProps} />;
};


const ControlTypes = new Enum("img imgUpload textarea text select autocomplete password email url color Money checkbox"
							+" yesNo location date year number arraytext address postcode json");

export {
	FormControl,
	ControlTypes
};
