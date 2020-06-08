/** PropControl provides inputs linked to DataStore.
 */
import React, { useRef } from 'react';

// TODO Maybe add support for user-set-this, to separate user-cleared-blanks from initial-blanks

// BE CAREFUL HERE
// These controls are used in multiple projects, and they have to handle a range of cases.

// FormControl removed in favour of basic <inputs> as that helped with input lag
// TODO remove the rest of these
import { Form, Button, Input, Label, FormGroup, InputGroup, InputGroupAddon, InputGroupText, UncontrolledButtonDropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap';

import {assert, assMatch} from 'sjtest';
import _ from 'lodash';
import Enum from 'easy-enums';
import JSend from '../data/JSend';
import {stopEvent, toTitleCase, space} from '../utils/miscutils';
import PromiseValue from 'promise-value';
import Dropzone from 'react-dropzone';
import Autocomplete from 'react-autocomplete';

import Misc from './Misc';
import DataStore from '../plumbing/DataStore';
import ServerIO from '../plumbing/ServerIOBase';
// import ActionMan from '../plumbing/ActionManBase';
import printer from '../utils/printer';
import C from '../CBase';
import Money from '../data/Money';
// // import I18n from 'easyi18n';
import {getType, getId} from '../data/DataClass';
import {notifyUser} from '../plumbing/Messaging';

/**
 * Set the value and the modified flag in DataStore
 * @param {!String[]} proppath
 * @param value
 */
const DSsetValue = (proppath, value) => {
	DataStore.setModified(proppath);
	DataStore.setValue(proppath, value);
};

/** Wrapped so the two (http/https) outer versions of this can provide an interface consistent with the other validators. */
const urlValidatorGuts = (val, secure) => {
	// no URL is not an error!
	if (!val) return null;
	// Protocol-relative URLs are fine!
	if (val.startsWith('//')) val = 'https:' + val;

	let urlObject;
	try {
		urlObject = new URL(val);
	} catch(e) {
		return 'This is not a valid URL';
	}

	if (secure && urlObject.protocol !== 'https:') return 'Please use https for secure urls';

	return null;
};
/** Default validator for URL values */
const urlValidator = val => urlValidatorGuts(val);
/** Default validator for secure URL values */
const urlValidatorSecure = val => urlValidatorGuts(val, true);

/** Default validator for money values 
 * @param {?Money} min
 * @param {?Money} max
*/
const moneyValidator = (val,min,max) => {
	// NB: we can get a Money skeleton object with no set value, seen May 2020
	if ( ! val || ( ! val.value && ! val.value100p)) {
		return null;
	}
	let nVal = Money.value(val);

	if (!Number.isFinite(nVal)) {
		return "Invalid number: " + val.raw;
	}
	if (!(nVal*100).toFixed(2).endsWith(".00")) {
		return "Fractional pence may cause an error later";
	}
	if (val.error) return "" + val.error;
	if (min && Money.compare(min,val) > 0) return "Value is below the minimum "+Money.str(min);
	if (max && Money.compare(max,val) < 0) return "Value is above the maximum "+Money.str(max);
	return null;
};

/** Default validator for date values */
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

/**
 * Input bound to DataStore.
 * aka Misc.PropControl
 *
 * @param {?Function} saveFn inputs: {path, prop, value, event}
 * This gets called at the end of onChange.
 * You are advised to wrap this with e.g. _.debounce(myfn, 500).
 * NB: we cant debounce here, cos it'd be a different debounce fn each time.
 * Save utils:
 * SavePublishDeleteEtc `saveDraftFn` 
 * or instead of saveFn, place a SavePublishDeleteEtc on the page.
 *
 * @param {?String} label
 * @param {String[]} path The DataStore path to item, e.g. [data, NGO, id].
 * 	Default: ['location','params'] which codes for the url
 * @param item The item being edited. Can be null, and it will be fetched by path.
 * @param prop The field being edited
 * @param dflt {?Object} default value Beware! This may not get saved if the user never interacts.
 * @param {?Function} modelValueFromInput - inputs: (value, type, eventType) See standardModelValueFromInput.
 * @param required {?Boolean} If set, this field should be filled in before a form submit.
 * 	TODO mark that somehow
 * @param validator {?(value, rawValue) => String} Generate an error message if invalid
 * @param inline {?Boolean} If set, this is an inline form, so add some spacing to the label.
 * @param https {?Boolean} if true, for type=url, urls must use https not http (recommended)
 * 
 * NB: This function provides a label / help / error wrapper -- then passes to PropControl2
 */
const PropControl = (props) => {
	let {type="text", optional, required, path, prop, label, help, tooltip, error, validator, inline, dflt, className, ...stuff} = props;
	if ( ! path) {	// default to using path = the url
		path = ['location','params'];
		props = Object.assign({path}, props);
	}
	assMatch(prop, "String|Number", path);
	assMatch(path, Array);
	// old code
	if (props.onChange) {
		console.warn("PropControl.jsx "+path+"."+prop+" s/onChange/saveFn/ as onChange is set internally by PropControl");
		props = Object.assign({saveFn: props.onChange}, props);
		delete props.onChange;
	}
	const proppath = path.concat(prop);
	let value = DataStore.getValue(proppath);
	// Use a default? But not to replace false or 0
	if (value === undefined || value === null || value === '') value = dflt;

	// HACK: catch bad dates and make an error message
	// TODO generalise this with a validation function
	if (PropControl.KControlType.isdate(type) && !validator) validator = dateValidator;

	// Default validator: URL
	const isUrlInput = (PropControl.KControlType.isurl(type) || PropControl.KControlType.isimg(type) || PropControl.KControlType.isimgUpload(type));
	if (isUrlInput && !validator) {
		validator = stuff.https ? urlValidatorSecure : urlValidator;
	}

	// Default validator: Money (NB: not 100% same as the backend)
	if (PropControl.KControlType.isMoney(type) && !validator && !error) validator = val => moneyValidator(val, props.min, props.max);

	// validate!
	if (validator) {
		const rawPath = path.concat(prop+"_raw");
		const rawValue = DataStore.getValue(rawPath);
		error = validator(value, rawValue);
	}

	// Has an issue been reported?
	// TODO refactor so validators and callers use setInputStatus
	if (!error) {
		const is = getInputStatus(proppath);
		if (!is && required && value === undefined) {
			setInputStatus({path: proppath, status: 'error', message: 'Missing required input'});
		}
		if (is && is.status === 'error') {
			error = is.message || 'Error';
		}
	}

	// if it had an error because the input was required but not filled, remove the error once it is filled
	// TODO: is this correct?
	if (error) {
		const is = getInputStatus(proppath);
		if (is && is.status === 'error' && required && value) {
			setInputStatus({path: proppath, status: 'ok', message: 'ok'});
			error = undefined;
		}
	}

	// Minor TODO lets refactor this so we always do the wrapper, then call a 2nd jsx function for the input (instead of the recursing flag)
	// label / help? show it and recurse
	// NB: Checkbox has a different html layout :( -- handled below
	if (PropControl.KControlType.ischeckbox(type)) {
		return <PropControl2 value={value} proppath={proppath} {...props} />
	}

	// Minor TODO help block id and aria-described-by property in the input
	const labelText = label || '';
	const helpIcon = tooltip ? <Misc.Icon fa="question-circle" title={tooltip} /> : '';
	const optreq = optional ? <small className="text-muted">optional</small>
		: required? <small className={value===undefined? 'text-danger' : null}>*</small> : null;
	// NB: The label and PropControl are on the same line to preserve the whitespace in between for inline forms.
	// NB: pass in recursing error to avoid an infinite loop with the date error handling above.
	// let props2 = Object.assign({}, props);
	// Hm -- do we need this?? the recursing flag might do the trick. delete props2.label; delete props2.help; delete props2.tooltip; delete props2.error;
	// type={type} path={path} prop={prop} error={error} {...stuff} recursing
	return (
		<div className={space('form-group', type, className, error? 'has-error' : null)}>
			{label || tooltip?
				<label htmlFor={stuff.name}>{labelText} {helpIcon} {optreq}</label>
				: null}
			{inline ? ' ' : null}
			<PropControl2 value={value} proppath={proppath} {...props} />
			{help ? <span className="help-block mr-2">{help}</span> : null}
			{error ? <span className="help-block text-danger">{error}</span> : null}
		</div>
	);
}; // ./PropControl


/**
 * The main part - the actual input
 */
const PropControl2 = (props) => {
	// track if the user edits, so we can preserve user-set-null/default vs initial-null/default
	// const [userModFlag, setUserModFlag] = useState(false); <-- No: internal state wouldn't let callers distinguish user-set v default
	// unpack ??clean up
	// Minor TODO: keep onUpload, which is a niche prop, in otherStuff
	let {value, type="text", optional, required, path, prop, proppath, label, help, tooltip, error, validator, inline, dflt, onUpload, ...stuff} = props;
	let {item, bg, saveFn, modelValueFromInput, ...otherStuff} = stuff;

	if ( ! modelValueFromInput) {
		if (type==='html') {
			modelValueFromInput = (_v, type, eventType, target) => standardModelValueFromInput((target && target.innerHTML) || null, type, eventType);
		} else {
			modelValueFromInput = standardModelValueFromInput;
		}
	}
	assert( ! type || PropControl.KControlType.has(type), 'Misc.PropControl: '+type);
	assert(path && _.isArray(path), 'Misc.PropControl: path is not an array: '+path+" prop:"+prop);
	assert(path.indexOf(null)===-1 && path.indexOf(undefined)===-1, 'Misc.PropControl: null in path '+path+" prop:"+prop);
	// // item ought to match what's in DataStore - but this is too noisy when it doesn't
	// if (item && item !== DataStore.getValue(path)) {
	// 	console.warn("Misc.PropControl item != DataStore version", "path", path, "item", item);
	// }
	if ( ! item) {
		item = DataStore.getValue(path) || {};
	}

	// New Pluggable System?
	if ($widgetForType[type]) {
		let $widget = $widgetForType[type];
		let props2 = Object.assign({item, modelValueFromInput}, props);
		return <$widget {...props2} />
	}

	// Checkbox?
	if (PropControl.KControlType.ischeckbox(type)) {
		const onChange = e => {
			// console.log("onchange", e); // minor TODO DataStore.onchange recognise and handle events
			const val = e && e.target && e.target.checked;
			DSsetValue(proppath, val);
			if (saveFn) saveFn({event:e, path, prop, item, value: val});
		};
		if (value === undefined) value = false;

		// make sure we don't have "false"
		if (_.isString(value)) {
			if (value==='true') value = true;
			else if (value==='false') value = false;
		}
		const helpIcon = tooltip ? <Misc.Icon fa='question-circle' title={tooltip} /> : null;

		return <>
			<FormGroup check inline={inline}>
				<Label check>
					<Input type="checkbox" checked={value} onChange={onChange} {...otherStuff} />
					{label} {helpIcon}
				</Label>
			</FormGroup>
			{help? <span className="help-block mr-2">{help}</span> : null}
			{error? <span className="help-block text-danger">{error}</span> : null}
		</>;
	} // ./checkbox

	// HACK: Yes-no (or unset) radio buttons? (eg in the Gift Aid form)
	if (type === 'yesNo') {
		return <PropControlYesNo path={path} prop={prop} value={value} inline={inline} saveFn={saveFn} />
	}
	if (type === 'keyvalue') {
		return <MapEditor {...props} />
	}

	if (value===undefined) value = '';

	// £s
	// NB: This is a bit awkward code -- is there a way to factor it out nicely?? The raw vs parsed/object form annoyance feels like it could be a common case.
	if (type === 'Money') {
		let acprops = {prop, value, path, proppath, item, bg, dflt, saveFn, modelValueFromInput, ...otherStuff};
		return <PropControlMoney {...acprops} />;
	} // ./£

	// text based
	const onChange = e => {
		// console.log("event", e, e.type);
		// TODO a debounced property for "do ajax stuff" to hook into. HACK blur = do ajax stuff
		DataStore.setValue(['transient', 'doFetch'], e.type === 'blur');
		let mv = modelValueFromInput(e.target.value, type, e.type, e.target);
		// console.warn("onChange", e.target.value, mv, e);
		DSsetValue(proppath, mv);
		if (saveFn) saveFn({event:e, path, prop, value: mv});
		// Enable piggybacking custom onChange functionality
		if (stuff.onChange && typeof stuff.onChange === 'function') stuff.onChange(e);
		e.preventDefault();
		e.stopPropagation();
	};

	if (type === 'XId') {
		let service = otherStuff.service || 'WTF'; // FIXME // Does this actually need fixing? Is there any sensible default?
		const displayValue = value.replace('@' + service, ''); // Strip @service wart for display
		modelValueFromInput = s => s? Misc.normalise(s)+'@'+service : null;
		return (
			<div className="input-group">
				<FormControl type='text' name={prop} value={displayValue} onChange={onChange} {...otherStuff} />
				<span className="input-group-append input-group-text">{toTitleCase(service)}</span>
			</div>
		);
	}

	if (type === 'arraytext') {
		return <PropControlArrayText {...props} />;
	}

	if (type === 'keyset') {
		return <PropControlKeySet {...props} />;
	}

	if (type === 'entryset') {
		return <PropControlEntrySet {...props} />;
	}

	if (type === 'textarea') {
		return <textarea className="form-control" name={prop} onChange={onChange} {...otherStuff} value={value} />;
	}

	if (type === 'html') {
		// NB: relies on a special-case innerHTML version of modelValueFromInput, set above
		let __html = value;
		// TODO onKeyDown={captureTab}
		return <div contentEditable className="form-control" name={prop}
			onChange={onChange}
			onInput={onChange}
			onBlur={onChange}
			{...otherStuff}
			style={{height:'auto'}}
			dangerouslySetInnerHTML={{__html}}>
			</div>;
	}
	
	if (type === 'json') {
		let spath = ['transient'].concat(proppath);
		let svalue = DataStore.getValue(spath) || JSON.stringify(value);
		const onJsonChange = e => {
			console.log("event", e.target && e.target.value, e, e.type);
			DataStore.setValue(spath, e.target.value);
			try {
				let vnew = JSON.parse(e.target.value);
				DSsetValue(proppath, vnew);
				if (saveFn) saveFn({event:e, path, prop, value:vnew});
			} catch(err) {
				console.warn(err);
				// TODO show error feedback
			}
			e.preventDefault();
			e.stopPropagation();
		};
		return <textarea className="form-control" name={prop} onChange={onJsonChange} {...otherStuff} value={svalue} />;
	}

	if (type === 'img') {
		delete otherStuff.https;
		return (
			<div>
				<FormControl type='url' name={prop} value={value} onChange={onChange} {...otherStuff} />
				<div className='pull-right' style={{background: bg, padding:bg?'20px':'0'}}><Misc.ImgThumbnail url={value} background={bg} /></div>
				<div className='clearfix' />
			</div>
		);
	}

	if (type === 'imgUpload' || type==='videoUpload') {
		return <PropControlImgUpload {...otherStuff} path={path} prop={prop} onUpload={onUpload} type={type} bg={bg} value={value} onChange={onChange} />;
	} // ./imgUpload

	if (type==='url') {
		delete otherStuff.https;
		return (
			<div>
				<FormControl type='url' name={prop} value={value} onChange={onChange} onBlur={onChange} {...otherStuff} />
				<div className='pull-right'><small>{value? <a href={value} target='_blank'>open in a new tab</a> : null}</small></div>
				<div className='clearfix' />
			</div>
		);
	}

	// date
	// NB dates that don't fit the mold yyyy-MM-dd get ignored by the date editor. But we stopped using that
	//  && value && ! value.match(/dddd-dd-dd/)
	if (PropControl.KControlType.isdate(type)) {
		const acprops = {prop, item, value, onChange, ...otherStuff};
		return <PropControlDate {...acprops} />;
	}

	if (type === 'radio' || type === 'checkboxes') {
		return <PropControlRadio value={value} {...props} />
	}

	if (type === 'select') {
		let props2 = {onChange, value, modelValueFromInput, ...props};
		return <PropControlSelect {...props2} />
	}

	// HACK just a few countries. TODO load in an iso list + autocomplete
	if (type==='country') {
		let props2 = {onChange, value, ...props};
		props2.options=[null, 'GB', 'US', 'AU', 'DE'];
		props2.labels=['', 'United Kingdom (UK)', 'United States of America (USA)', 'Australia', 'Germany'];
		return <PropControlSelect  {...props2} />
	}

	if (type === 'autocomplete') {
		let acprops = {prop, value, path, proppath, item, bg, dflt, saveFn, modelValueFromInput, ...otherStuff};
		return <PropControlAutocomplete {...acprops} />;
	}

	// Optional fancy colour picker - dummied out for now.
	/*
	if (type === 'color') {
		return (
			<div>
				<div className="color-container">
					<div className="color-bg" />
					<Misc.FormControl type={type} name={prop} value={value} onChange={onChange} {...otherStuff} />
					<div className="color-decoration">Click to pick a colour</div>
				</div>
				<Misc.FormControl type="text" name={prop} value={value} onChange={onChange} {...otherStuff} />
			</div>
		);
	}
	*/
	// normal
	// NB: type=color should produce a colour picker :)
	return <FormControl type={type} name={prop} value={value} onChange={onChange} {...otherStuff} />;
}; //./PropControl2


// /**
//  * TODO
//  * @param {Event} e
//  */
// let captureTab = e => {
// 	console.warn(e, e.keyCode, e.keyCode===9);
// 	if (e.keyCode !== 9) return;
// 	e.preventDefault();
// };

/**
 * @param options {any[]} Will be de-duped.
 * @param labels {?String[]|Function|Object} Map options to nice strings
 * @param multiple {?boolean} If true, this is a multi-select which handles arrays of values.
 * @param {?Boolean} canUnset If true, always offer an unset choice.
 */
const PropControlSelect = ({options, labels, value, multiple, prop, onChange, saveFn, canUnset, ...otherStuff}) => {
	// NB: pull off internal attributes so the select is happy with rest
	const {className, dflt, recursing, modelValueFromInput, ...rest} = otherStuff;
	assert(options, 'Misc.PropControl: no options for select '+[prop, otherStuff]);
	assert(options.map, 'Misc.PropControl: options not an array '+options);
	options = _.uniq(options);
	// Make an option -> nice label function
	// the labels prop can be a map or a function
	let labeller = v => v;
	if (labels) {
		if (_.isArray(labels)) {
			labeller = v => labels[options.indexOf(v)] || v;
		} else if (_.isFunction(labels)) {
			labeller = labels;
		} else {
			// map
			labeller = v => labels[v] || v;
		}
	}
	let sv = value || dflt;

	if (multiple) {
		// WTF? multi-select is pretty broken in React as of Jan 2019
		return PropControlMultiSelect({value, prop, onChange, labeller, options, sv, className, modelValueFromInput, ...rest});
	}

	// make the options html
	// NB: react doesnt like the selected attribute ?? but we need it for multiple??
	let domOptions = options.map((option, index) => {
		// The big IAB Taxonomy dropdown has some dupe names which are used as options
		// - so permit a keys list, separate from the option strings, to differentiate them
		const thisKey = 'option_' + ((otherStuff.keys && otherStuff.keys[index]) || JSON.stringify(option));
		return <option key={thisKey} value={option} >{labeller(option)}</option>;
	});
	
	/* text-muted is for my-loop mirror card
	** so that unknown values are grayed out TODO do this in the my-loop DigitalMirrorCard.jsx perhaps via labeller or via css */
	let klass = space('form-control', className); //, sv && sv.includes('Unknown')? 'text-muted' : null);
	return (
		<select className={klass}
			name={prop} value={sv} onChange={onChange}
			multiple={multiple}
			{...rest}
		>
			{sv && ! canUnset? null : <option></option>}
			{domOptions}
		</select>
	);
};

/**
 * render multi select as multi checkbox 'cos React (Jan 2019) is awkward about multi-select
 * Apr 2020: Multi-select works fine but keep rendering as row of checkboxes because it's a usability mess
 * Deselect everything unless user holds Ctrl??? Really? -RM
 */
const PropControlMultiSelect = ({value, prop, labeller, options, modelValueFromInput, sv, className, type, path, saveFn}) => {
	assert( ! sv || sv.length !== undefined, "value should be an array", sv, prop);
	// const mvfi = rest.modelValueFromInput;
	// let modelValueFromInput = (s, type, etype) => {
	// 	if (mvfi) s = mvfi(s, type, etype);
	// 	console.warn("modelValueFromInput", s, sv);
	// 	return [s];
	// };
	let onChange = e => {
		const val = e && e.target && e.target.value;
		const checked = e && e.target && e.target.checked;
		let mv = modelValueFromInput(val, type, e.type);
		// console.warn("onChange", val, checked, mv, e);
		let vals = value || [];
		let mvs;
		if (checked) {
			mvs = vals.concat(mv);
		} else {
			mvs = vals.filter(v => v != mv);
		}
		const proppath = path.concat(prop);
		DSsetValue(proppath, mvs);
		if (saveFn) saveFn({event:e, path, prop, value: mvs});
	}

	let domOptions = options.map(option => {
		// React doesn't like when an input's value changes from undefined to an explicit value, so...
		const checked = !!(sv && sv.includes(option)); // coerce from undefined/null to boolean false
		return (
			<FormGroup inline check key={`option_${option}`}>
				<Input type="checkbox" value={option} checked={checked} onChange={onChange} />
				<Label check>{labeller(option)}</Label>
			</FormGroup>
		);
	});

	return (
		<Form className={className}>
			{domOptions}
		</Form>
	);
};

/**
 *
 * TODO buttons style
 *
 * Radio buttons
 *
 * @param labels {String[] | Function | Object} Optional value-to-string convertor.
 */
const PropControlRadio = ({type, prop, value, path, item, dflt, saveFn, options, labels, inline, ...otherStuff}) => {
	assert(options, `PropControl: no options for radio ${prop}`);
	assert(options.map, `PropControl: radio options for ${prop} not an array: ${options}`);

	// Make an option -> nice label function
	// the labels prop can be a map or a function
	let labeller = v => v;
	if (labels) {
		if (_.isArray(labels)) {
			labeller = v => labels[options.indexOf(v)] || v;
		} else if (_.isFunction(labels)) {
			labeller = labels;
		} else {
			// map
			labeller = v => labels[v] || v;
		}
	}
	// make the options html
	// FIXME checkboxes should support multiple options -- list of vals
	const onChange = e => {
		// console.log("onchange", e); // minor TODO DataStore.onchange recognise and handle events
		const val = e && e.target && e.target.value;
		DSsetValue(path.concat(prop), val);
		if (saveFn) saveFn({event:e, path, prop, value: val});
	};

	const inputType = (type === 'checkboxes') ? 'checkbox' : 'radio';

	return (
		<Form>
			{options.map(option => (
				<FormGroup check inline={inline} key={option}>
					<Label check>
						<Input type={inputType} key={`option_${option}`} name={prop} value={option}
							checked={option == value}
							onChange={onChange} {...otherStuff}
						/>
						{' '}{labeller(option)}
					</Label>
				</FormGroup>
			))}
		</Form>
	);
}; // ./radio


/**
 * Strip commas £/$/euro and parse float
 * @param {*} v
 * @returns Number. undefined/null are returned as-is. Bad inputs return NaN
 */
const numFromAnything = v => {
	if (v===undefined || v===null) return v;
	// NB: _.isNumber fails for numeric-strings e.g. "1" -- but the later code will handle that
	if (_.isNumber(v)) return v;
	// strip any commas, e.g. 1,000
	if (_.isString(v)) {
		v = v.replace(/,/g, "");
		// £ / $ / euro
		v = v.replace(/^(-)?[£$\u20AC]/, "$1");
	}
	return parseFloat(v);
};


/**
 * See also: Money.js
 * @param currency {?String}
 * @param name {?String} (optional) Use this to preserve a name for this money, if it has one.
 */
const PropControlMoney = ({prop, name, value, currency, path, proppath,
									item, bg, dflt, saveFn, modelValueFromInput, onChange, append, ...otherStuff}) => {
		// special case, as this is an object.
	// Which stores its value in two ways, straight and as a x100 no-floats format for the backend
	// Convert null and numbers into Money objects
	if ( ! value || _.isString(value) || _.isNumber(value)) {
		value = new Money({value});
	}
	// prefer raw, so users can type incomplete answers!
	let v = value.raw || value.value;
	if (v===undefined || v===null || _.isNaN(v)) { // allow 0, which is falsy
		v = '';
	}
	//Money.assIsa(value); // type can be blank
	// handle edits
	const onMoneyChange = e => {
		// keep blank as blank (so we can have unset inputs), otherwise convert to number/undefined
		const newM = e.target.value===''? null : new Money(e.target.value);
		if (name && newM) newM.name = name; // preserve named Money items
		DSsetValue(proppath, newM);
		if (saveFn) saveFn({event:e, path, prop, newM});
		// call onChange after we do the standard updates TODO make this universal
		if (onChange) onChange(e);
	};
	let curr = Money.CURRENCY[currency || (value && value.currency)] || <span>&pound;</span>;
	let $currency;
	let changeCurrency = otherStuff.changeCurrency !== false;
	if (changeCurrency) {
		// TODO other currencies
		$currency = (
			<UncontrolledButtonDropdown addonType="prepend" disabled={otherStuff.disabled} id={'input-dropdown-addon-'+JSON.stringify(proppath)}>
				<DropdownToggle caret>{curr}</DropdownToggle>
				<DropdownMenu>
					<DropdownItem key="1">{curr}</DropdownItem>
				</DropdownMenu>
			</UncontrolledButtonDropdown>
		);
	} else {
		$currency = <InputGroupAddon addonType="prepend">{curr}</InputGroupAddon>;
	}
	delete otherStuff.changeCurrency;
	assert(v === 0 || v || v==='', [v, value]);
	// make sure all characters are visible
	let minWidth = ((""+v).length / 1.5)+"em";
	return (
		<InputGroup>
			{$currency}
			<FormControl name={prop} value={v} onChange={onMoneyChange} {...otherStuff} style={{minWidth}}/>
			{append ? <InputGroupAddon addonType="append">{append}</InputGroupAddon> : null}
		</InputGroup>
	);
}; // ./£

/**
 * yes/no radio buttons (kind of like a checkbox)
 *
 * @param value {?Boolean}
 */
const PropControlYesNo = ({path, prop, value, saveFn, className}) => {
	// NB: try to spot bad code/values -- beware of truthy/falsy here
	if (value && ! _.isBoolean(value)) {
		console.error("PropControlYesNo - value not a proper boolean!", prop, value);
		// if (value === 'yes') value = true;
		// convert string to false
		if (value === 'no' || value==='false') value = false;
		value = !! value; // its boolean now
	}
	// handle yes/no -> true/false
	const onChange = e => {
		// String yes/no -> boolean
		let newValue;
		if (e.target.value === 'yes') newValue = true;
		else if (e.target.value === 'no') newValue = false;
		else newValue = undefined;
		
		DSsetValue(path.concat(prop), newValue);
		if (saveFn) saveFn({event:e, path, prop, newValue});
	};

	// Null/undefined doesn't mean "no"! Don't check either option until we have a value.
	const noChecked = value===false;
	// NB: checked=!!value avoids react complaining about changing from uncontrolled to controlled.
	return <>
		<FormGroup check inline>
			<Label check>
				<Input type="radio" value='yes' name={prop} onChange={onChange} checked={!!value} />
				{' '}Yes
			</Label>
		</FormGroup>
		<FormGroup check inline>
			<Label check>
				<Input type="radio" value='no' name={prop} onChange={onChange} checked={noChecked} />
				{' '}No
			</Label>
		</FormGroup>
	</>;
};


/**
 * Display a value as 'a b c' but store as ['a', 'b', 'c']
 * Used to edit variant.style
 */
const PropControlArrayText = ({ value, prop, proppath, saveFn, ...otherStuff}) => {
	const onChange = e => {
		const oldValue = DataStore.getValue(proppath) || [];
		const oldString = oldValue.join(' ');
		const newString = e.target.value;
		let newValue = newString.split(' ');

		// Remove falsy entries ONLY if change is a deletion.(ie newString is substring of oldString)
		// Allows user to type eg 'one' (['one']) -> "one " ('one', '') -> "one two" ('one', 'two')
		// without filter removing the trailing space.
		if (oldString.indexOf(newString) >= 0) {
			newValue = newValue.filter(val => val);
		}
		
		DSsetValue(proppath, newValue);
		if (saveFn) saveFn({event:e, path, prop, value:newValue});
		e.preventDefault();
		e.stopPropagation();
	}
	const safeValue = (value || []).join(' ');
	return <FormControl name={prop} value={safeValue} onChange={onChange} {...otherStuff} />;
};


/**
 * Special case of PropControlEntrySet where values are either true or not displayed.
 * Used for eg Custom Parameters control on the advert editor
 * -eg "I want to flag this ad as 'no_tq' and 'skip_splash'
 * TODO Should this be a literal special case of the PropControlEntrySet code?
 * @param {{String: Boolean}} value Can be null initially
 */
const PropControlKeySet = ({ value, prop, proppath, saveFn}) => {
	const addRemoveKey = (key, remove) => {
		const newValue = { ...value };
		// Set false for "remove" instead of deleting because back-end performs a merge on update, which would lose simple key removal
		// TODO this leads to the data being a bit messy, with ambiguous false flags.
		// ...But we want to keep update (i.e. merge) behaviour over fresh-index in general.
		// ...TODO DataStore to maintain a diff, which it can send to the backend.
		newValue[key] = remove ? false : true;
		DSsetValue(proppath, newValue);
		if (saveFn) saveFn({event:{}, path, prop, value: newValue });
	}
	
	const keyElements = Object.keys(value || {}).filter(key => value[key]).map(key => (
		<span className="key" key={key}>{key} <span className="remove-key" onClick={() => addRemoveKey(key, true)}>&times;</span></span>
	));
	
	
	let newKey;

	const onClickAdd = (event) => {
		addRemoveKey(newKey);
		// Clear the input(s)
		event.target.parentNode.childNodes.forEach(child => {
			if ((child.tagName || '').toLowerCase() === 'input') child.value = '';
		});
	};


	return (
		<div className="keyset form-inline">
			<div className="keys">{keyElements}</div>
			<Form inline onSubmit={stopEvent}>
				<Input onChange={(event) => newKey = event.target.value}
				/> <Button color={value ? 'primary' : 'secondary'} onClick={onClickAdd} >Add</Button>
			</Form>
		</div>
	);
};


/**
 * Convenience for editing a set of key-value pairs - eg the numerous string overrides stored on an Advert under customText
 * @param {{String: String}} value Can be null initially
 * @param {?String} keyName Explanatory placeholder text for entry key
 * @param {?String} valueName Explanatory placeholder text for entry value
 */
const PropControlEntrySet = ({ value, prop, proppath, saveFn, keyName = 'key', valueName = 'value'}) => {
	const addRemoveKey = (key, val, remove) => {
		if (!key) return;
		const newValue = { ...value };
		// set false instead of deleting - see rationale/TODO in PropControlKeySet
		newValue[key] = remove ? false : val;
		DataStore.setValue(proppath, newValue);
		if (saveFn) saveFn({event:{}, path, prop, value: newValue });
	}
	
	const entryElements = Object.entries(value || {}).filter(([, val]) => (val === '') || val).map(([key]) => (
		<tr className="entry" key={key}>
			<td><Button className="remove-entry" onClick={() => addRemoveKey(key, null, true)}>&times;</Button></td>
			<td className="px-2">{key}:</td>
			<td><PropControl type="text" path={proppath} prop={key} /></td>
		</tr>
	));
	
	let newKey, newValue;

	const onClickAdd = (event) => {
		addRemoveKey(newKey, newValue);
		event.target.parentNode.childNodes.forEach(child => {
			if ((child.tagName || '').toLowerCase() === 'input') child.value = '';
		});
	};

	return (
		<div className="entryset">
			<table className="entries"><tbody>{entryElements}</tbody></table>
			<Form inline onSubmit={stopEvent} className="mb-2">
				<FormGroup className="mr-2">
					<Input placeholder={keyName} onChange={(event) => newKey = event.target.value} />
				</FormGroup>
				<FormGroup className="mr-2">
					<Input placeholder={valueName} onChange={(event) => newValue = event.target.value} />
				</FormGroup>
				<Button color="primary" onClick={onClickAdd} >Add</Button>
			</Form>
		</div>
	);
};


const PropControlDate = ({prop, item, value, onChange, ...otherStuff}) => {
	// NB dates that don't fit the mold yyyy-MM-dd get ignored by the native date editor. But we stopped using that.
	// NB: parsing incomplete dates causes NaNs
	let datePreview = null;
	if (value) {
		try {
			let date = new Date(value);
			// use local settings??
			datePreview = date.toLocaleDateString('en-GB', {day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC'});
		} catch (er) {
			// bad date
			datePreview = 'Invalid date';
		}
	}

	// HACK: also set the raw text in _raw. This is cos the server may have to ditch badly formatted dates.
	// NB: defend against _raw_raw
	const rawProp = prop.substr(prop.length-4, prop.length) === '_raw'? null : prop+'_raw';
	if ( ! value && item && rawProp) value = item[rawProp];
	const onChangeWithRaw = e => {
		if (item && rawProp) {
			item[rawProp] = e.target.value;
		}
		onChange(e);
	};

	// let's just use a text entry box -- c.f. bugs reported https://github.com/winterstein/sogive-app/issues/71 & 72
	// Encourage ISO8601 format
	if ( ! otherStuff.placeholder) otherStuff.placeholder = 'yyyy-mm-dd, e.g. today is '+Misc.isoDate(new Date());
	return (<div>
		<FormControl type='text' name={prop} value={value} onChange={onChangeWithRaw} {...otherStuff} />
		<div className='pull-right'><i>{datePreview}</i></div>
		<div className='clearfix' />
	</div>);
};


/**
* wraps the reactjs autocomplete widget
options {Function|Object[]|String[]}
renderItem {?JSX}
getItemValue {?Function} item -> prop-value
*/
const PropControlAutocomplete = ({prop, value, options, getItemValue, renderItem, path, proppath,
	item, bg, dflt, saveFn, modelValueFromInput, ...otherStuff}) => {
		// a place to store the working state of this widget
		let widgetPath = ['widget', 'autocomplete'].concat(path);
		if (!getItemValue) getItemValue = s => s;
		if (!renderItem) renderItem = a => printer.str(a);
		const type = 'autocomplete';
		const items = _.isArray(options)? options : DataStore.getValue(widgetPath) || [];

		// NB: typing sends e = an event, clicking an autocomplete sends e = a value
		const onChange2 = (e) => {
			// console.log("event", e, e.type, optItem);
			// TODO a debounced property for "do ajax stuff" to hook into. HACK blur = do ajax stuff
			DataStore.setValue(['transient', 'doFetch'], e.type==='blur');
			// typing sneds an event, clicking an autocomplete sends a value
			const val = e.target? e.target.value : e;
			let mv = modelValueFromInput(val, type, e.type);
			DSsetValue(proppath, mv);
			if (saveFn) saveFn({event:e, path:path, prop, value:mv});
			// e.preventDefault();
			// e.stopPropagation();
		};

		const onChange = (e, optItem) => {
			onChange2(e, optItem);
			if (!e.target.value) return;
			if (!_.isFunction(options)) return;
			let optionsOutput = options(e.target.value);
			let pvo = new PromiseValue(optionsOutput);
			pvo.promise.then(oo => {
				DataStore.setValue(widgetPath, oo);
				// also save the info in data
				// NB: assumes we use status:published for auto-complete
				oo.forEach(opt => {
					if (getType(opt) && getId(opt)) {
						const optPath = DataStore.getDataPath({status:C.KStatus.PUBLISHED, type:getType(opt), id:getId(opt)});
						DataStore.setValue(optPath, opt);
					}
				});
			});
			// NB: no action on fail - the user just doesn't get autocomplete
		};
		
	return (
		<Autocomplete
			inputProps={{className: otherStuff.className || 'form-control'}}
			getItemValue={getItemValue}
			items={items}
			renderItem={renderItem}
			value={value}
			onChange={onChange}
			onSelect={onChange2}
		/>
	);
}; //./autocomplete


/**
* Convert inputs (probably text) into the model's format (e.g. numerical)
* @param {?primitive} inputValue - The html value, often a String
* @param {KControlType} type - The PropControl type, e.g. "text" or "date"
* @param {String} eventType "change"|"blur" More aggressive edits should only be done on "blur"
* @returns the model value/object to be stored in DataStore
*/
const standardModelValueFromInput = (inputValue, type, eventType) => {
	if ( ! inputValue) return inputValue;
	// numerical?
	if (type==='year') {
		return parseInt(inputValue);
	}
	if (type==='number') {
		return numFromAnything(inputValue);
	}
	// url: add in https:// if missing
	if (type==='url' && eventType==='blur') {
		if (inputValue.indexOf('://') === -1 && inputValue[0] !== '/' && 'http'.substr(0, inputValue.length) !== inputValue.substr(0,4)) {
			inputValue = 'https://'+inputValue;
		}
	}
	// normalise text
	if (type==='text' || type==='textarea') {
		inputValue = Misc.normalise(inputValue);
	}
	return inputValue;
};


/**
 * This replaces the react-bootstrap version 'cos we saw odd bugs there.
 * Plus since we're providing state handling, we don't need a full component.
 */
const FormControl = ({value, type, required, size, className, prepend, append, ...otherProps}) => {
	if (value === null || value === undefined) value = '';

	if (type === 'color' && !value) {
		// Chrome spits out a console warning about type="color" needing value in format "#rrggbb"
		// ...but if we omit value, React complains about switching an input between controlled and uncontrolled
		// So give it a dummy value and set a class to allow us to show a "no colour picked" signifier
		return <Input className="no-color" value="#000000" type={type} {...otherProps} />;
	}
	
	// add css classes for required fields
	let klass = space(
		className,
		required ? 'form-required' : null,
		(required && !value) ? 'blank' : null,
	);

	// remove stuff intended for other types that will upset input
	delete otherProps.options;
	delete otherProps.labels;

	// if (otherProps.readonly) { nah, let react complain and the dev can fix the cause
	// 	otherProps.readonly = otherProps.readOnly;
	// 	delete otherProps.readOnly;
	// }

	const input = <Input className={klass} bsSize={size} type={type} value={value} {...otherProps} />;

	// TODO The prepend addon adds the InputGroupText wrapper automatically... should it match appendAddon?
	const prependAddon = prepend ? (
		<InputGroupAddon addonType="prepend">
			<InputGroupText>{prepend}</InputGroupText>
		</InputGroupAddon>
	) : null;

	const appendAddon = append ? (
		<InputGroupAddon addonType="append">
			{append}
		</InputGroupAddon>
	) : null;

	if (prepend || append) {
		return <InputGroup>
			{prependAddon}
			{input}
			{appendAddon}
		</InputGroup>;
	}

	return input;
};


/**
 * List of types eg textarea
 * TODO allow other jsx files to add to this - for more modular code.
 */
PropControl.KControlType = new Enum("img imgUpload videoUpload textarea html text search select radio checkboxes autocomplete password email url color checkbox"
							+" yesNo location date year number arraytext keyset entryset address postcode json country"
							// some Good-Loop data-classes
							+" Money XId keyvalue");

// for search -- an x icon?? https://stackoverflow.com/questions/45696685/search-input-with-an-icon-bootstrap-4


/**
 * image or video upload. Uses Dropzone
 * @param onUpload {Function} {path, prop, url, response: the full server response} Called after the server has accepted the upload.
 */
const PropControlImgUpload = ({path, prop, onUpload, type, bg, value, onChange, ...otherStuff}) => {
	delete otherStuff.https;

	// Get a ref to the <input> in the FormControl so we can ping its change event on successful upload
	const inputRef = useRef(null);

	const uploadAccepted = (accepted, rejected) => {
		const progress = (event) => console.log('UPLOAD PROGRESS', event.loaded);
		const load = (event) => console.log('UPLOAD SUCCESS', event);
		accepted.forEach(file => {
			ServerIO.upload(file, progress, load)
				.done(response => {
					// TODO refactor to clean this up -- we should have one way of doing things.
					// Different forms for UploadServlet vs MediaUploadServlet
					let url = (response.cargo.url) || (response.cargo.standard && response.cargo.standard.url);
					DSsetValue(path.concat(prop), url);
					if (onUpload) {
						onUpload({ path, prop, response, url });
					}
					// Forcibly trigger "change" on the URL FormControl
					if (inputRef.current) {
						inputRef.current.dispatchEvent(new Event('change'));
					}
				})
				.fail(res => res.status == 413 && notifyUser(new Error(res.statusText)));
		});
		rejected.forEach(file => {
			// TODO Inform the user that their file had a Problem
			console.error("rejected :( " + file);
		});
	};

	let acceptedTypes = type === 'imgUpload' ? 'image/jpeg, image/png, image/svg+xml' : 'video/mp4, video/ogg, video/x-msvideo, video/x-ms-wmv, video/quicktime, video/ms-asf';
	let acceptedTypesDesc = type === 'imgUpload' ? 'JPG, PNG, or SVG image' : 'video';

	// Catch special background-colour name for img and apply a special background to show img transparency
	let className;
	if (bg === 'transparent') {
		bg = '';
		className = 'stripe-bg';
	}

	// WARNING: the <Dropzone> code below does not work with recent versions of Dropzone! v4.3.0 has been tested and works.
	// NB the "innerRef" prop used on FormControl is specific to Reactstrap - it applies the given ref to the underlying <input>
	return (
		<div>
			<FormControl type='url' name={prop} value={value} onChange={onChange} innerRef={inputRef} {...otherStuff} />
			<div className='pull-left'>
				<Dropzone className='DropZone' accept={acceptedTypes} style={{}} onDrop={uploadAccepted}>
					Drop a {acceptedTypesDesc} here
				</Dropzone>
			</div>
			<div className='pull-right'>
				{type === 'videoUpload' ? (
					<Misc.VideoThumbnail url={value} />
				) : (
					<Misc.ImgThumbnail className={className} background={bg} url={value} />
				)}
			</div>
			<div className='clearfix' />
		</div>
	);
}; // ./imgUpload


/**
 * DEPRECATED replace/merge with PropControlEntrySet
 * @param {*} param0
 * @param {Function} removeFn Takes (map, key), returns new map - use if "removing" a key means something other than just deleting it
 * @param {Function} filterFn Takes (key, value), returns boolean - use if some entries should't be shown
 */
const MapEditor = ({prop, proppath, value, $KeyProp, $ValProp, removeFn, filterFn = (() => true)}) => {
	assert($KeyProp && $ValProp, "PropControl MapEditor "+prop+": missing $KeyProp or $ValProp jsx (probably PropControl) widgets");
	const temppath = ['widget','MapEditor'].concat(proppath);
	const kv = DataStore.getValue(temppath) || {};

	const addKV = () => {
		// Don't execute nonsensical or no-op updates
		if (!kv.key) return;
		const k = kv.key.trim();
		if (!k) return;
		if (kv.val === value[k]) return;

		// Break identity so shallow comparison sees a change
		const newMap = { ...value, [k]: kv.val };
		DataStore.setValue(proppath, newMap);
		DataStore.setValue(temppath, null);
	};

	const rmK = k => {
		// Break identity so shallow comparison sees a change
		let newMap = { ...value };
		if (removeFn) {
			newMap = removeFn(newMap, k);
		} else {
			delete newMap[k];
		}
		DataStore.setValue(proppath, newMap, true);
	};

	// Is there a "don't show these entries" rule? Apply it now.
	const vkeys = Object.keys(value || {}).filter(k => filterFn(k, value[k]));
	return <>
		{vkeys.map(
			k => (<Misc.Col2 key={k}>
					<div>{k}</div>
					<div>
						{React.cloneElement($ValProp, {path:proppath, prop:k, label:null})}
						<Button onClick={() => rmK(k)}>➖</Button>
					</div>
				</Misc.Col2>)
		)}
		<Misc.Col2>
			{React.cloneElement($KeyProp, {path:temppath, prop:'key'})}
			<div>
				{React.cloneElement($ValProp, {path:temppath, prop:'val'})}
				<Button onClick={addKV} disabled={ ! kv.key || ! kv.val}>➕</Button>
			</div>
		</Misc.Col2>
	</>;
}; // ./MapEditor

/** INPUT STATUS */
class InputStatus extends JSend {
	
}
/**
 * e.g. "url: warning: use https for security"
 */
InputStatus.str = is => [(is.path? is.path[is.path.length-1] : null), is.status, is.message].join(': ');

/** NB: the final path bit is to allow for status to be logged at different levels of the data-model tree */
const statusPath = path => ['misc','inputStatus'].concat(path).concat('_status');

/**
 *
 * @param {?String} status - if null, remove any message
 */
const setInputStatus = ({path, status, message}) => {
	const spath = statusPath(path);
	// no-op?
	const old = DataStore.getValue(spath);
	if (!old && !status) return;
	// _.isEqual was comparing old: {status, path, message} to {status, message}
	if (old && old.status === status && old.message === message) {
		return;
	}
	// No status? Null out the whole object.
	const newStatus = status ? { path, status, message } : null;
	// NB: don't update inside a render loop
	setTimeout(() => DataStore.setValue(spath, newStatus), 1);
};

/**
 * @param {!String[]} path
 * @return {InputStatus} or null
 */
const getInputStatus = path => {
	const spath = statusPath(path);
	return DataStore.getValue(spath);
}
/**
 * @param {!String[]} path
 * @return {!InputStatus[]} The status for this node and all child nodes
 */
const getInputStatuses = path => {
	// if (true) return []; // possibly causing a performance issue?? On Feb 2019
	assMatch(path, 'String[]');
	const sppath = ['misc','inputStatus'].concat(path);
	const root = DataStore.getValue(sppath);
	const all = [];
	getInputStatuses2(root, all);
	return all;
}
const getInputStatuses2 = (node, all) => {
	if ( ! _.isObject(node)) return;
	if (node._status) all.push(node._status);
	// assumes no loops!
	Object.values(node).forEach(kid => getInputStatuses2(kid, all));
};

/**
 * TODO piecemeal refactor to be an extensible system
 */
let $widgetForType = {};

/**
 * Extend or change support for a type
 * @param {!String} type e.g. "textarea"
 * @param {!JSX} $Widget the widget to render a propcontrol
 * ?? what props does it get?? {path, prop, proppath, value}
 */
const registerControl = ({type, $Widget}) => {
	assMatch(type, String);
	assert($Widget);
	PropControl.KControlType = PropControl.KControlType.concat(type);
	$widgetForType[type] = $Widget;
};

export {
	registerControl,
	FormControl,
	InputStatus,
	setInputStatus,
	getInputStatus,
	getInputStatuses,
	standardModelValueFromInput
};
// should we rename it to Input, or StoreInput, ModelInput or some such??
export default PropControl;

