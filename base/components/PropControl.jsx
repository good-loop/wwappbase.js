/** PropControl provides inputs linked to DataStore.
 */
import React from 'react';

// BE CAREFUL HERE
// These controls are used in multiple projects, and they have to handle a range of cases.

// FormControl removed in favour of basic <inputs> as that helped with input lag
// TODO remove the rest of these
import { Checkbox, InputGroup, DropdownButton, MenuItem} from 'react-bootstrap';

import {assert, assMatch} from 'sjtest';
import _ from 'lodash';
import Enum from 'easy-enums';
import JSend from '../data/JSend';
import {join, mapkv, stopEvent, toTitleCase} from 'wwutils';
import PromiseValue from 'promise-value';
import Dropzone from 'react-dropzone';
import md5 from 'md5';
import Autocomplete from 'react-autocomplete';

import Misc from './Misc';
import DataStore, {getPath} from '../plumbing/DataStore';
import ServerIO from '../plumbing/ServerIOBase';
// import ActionMan from '../plumbing/ActionManBase';
import printer from '../utils/printer';
import C from '../CBase';
import BS from './BS';
import Money from '../data/Money';
// // import I18n from 'easyi18n';
import {getType, getId, nonce} from '../data/DataClass';
import {notifyUser} from '../plumbing/Messaging';

/**
 * Input bound to DataStore.
 * aka Misc.PropControl
 * 
 * @param {Function} saveFn inputs: {path, prop, value} 
 * This gets called at the end of onChange.
 * You are advised to wrap this with e.g. _.debounce(myfn, 500).
 * NB: we cant debounce here, cos it'd be a different debounce fn each time.
 * Save utils: 
 * `Misc.saveDraftFn` and `Misc.savePublishFn`, 
 * or instead of saveFn, place a Misc.SavePublishDiscard on the page.
 * @param {?String} label 
 * @param {String[]} path The DataStore path to item, e.g. [data, NGO, id].
 * 	Defaulkt: ['location','params'] which codes for the url
 * @param item The item being edited. Can be null, and it will be fetched by path.
 * @param prop The field being edited 
 * @param dflt {?Object} default value Beware! This may not get saved if the user never interacts.
 * @param {?Function} modelValueFromInput - inputs: (value, type, eventType) See standardModelValueFromInput.
 * @param required {?Boolean} If set, this field should be filled in before a form submit. 
* 		TODO mark that somehow
* @param validator {?(value, rawValue) => String} Generate an error message if invalid
* @param inline {?Boolean} If set, this is an inline form, so add some spacing to the label.
* @param https {?Boolean} if true, urls must use https not http (recommended)

NB: This function provides a label / help / error wrapper -- then passes to PropControl2
 */
const PropControl = (props) => {
	let {type="text", optional, required, path=['location','params'], prop, label, help, tooltip, error, validator, inline, dflt, ...stuff} = props;
	assMatch(prop, "String|Number");
	assMatch(path, Array);
	const proppath = path.concat(prop);
	let value = DataStore.getValue(proppath);
	// Use a default? But not to replace false or 0
	if (value===undefined || value===null || value==='') value = dflt;

	// HACK: catch bad dates and make an error message
	// TODO generalise this with a validation function
	if (Misc.KControlType.isdate(type) && ! validator) {
		validator = (v, rawValue) => {
			if ( ! v) {
				// raw but no date suggests the server removed it
				if (rawValue) return 'Please use the date format yyyy-mm-dd';
				return null;
			}
			try {
				let sdate = "" + new Date(v);
				if (sdate === 'Invalid Date') {
					return 'Please use the date format yyyy-mm-dd';
				}
			} catch (er) {
				return 'Please use the date format yyyy-mm-dd';
			}
		};
	} // date
	// url: https
	if (stuff.https !== false && (Misc.KControlType.isurl(type) || Misc.KControlType.isimg(type) || Misc.KControlType.isimgUpload(type))
			&& ! validator)
	{
		validator = v => {
			// TODO detect invalid url
			if (v && v.substr(0,5) === 'http:') {
				return "Please use https for secure urls";
			}
			return null;
		};
	}
	// Money validator (NB: not 100% same as the backend)
	if (Misc.KControlType.isMoney(type) && ! validator && ! error) {
		validator = v => {
			if ( ! v) return null;
			let nv = Money.value(v);	
			if ( ! Number.isFinite(nv)) {
				return "Invalid number "+v.raw;
			}
			if ( ! (nv*100).toFixed(2).endsWith(".00")) {
				return "Fractional pence may cause an error later";
			}
			if (v.error) return ""+v.error;
			return null;
		};
	}
	// validate!
	if (validator) {		
		const rawPath = path.concat(prop+"_raw");
		const rawValue = DataStore.getValue(rawPath);
		error = validator(value, rawValue);
	}
	// Has an issue been reported?
	// TODO refactor so validators and callers use setInputStatus
	if ( ! error) {
		const is = getInputStatus(proppath);
		if ( ! is && required && value === undefined) {
			setInputStatus({path:proppath, status:'error', message:'Missing required input'});
		}
		if (is && is.status==='error') {
			error = is.message || 'Error';
		}
	}

	// if it had an error because the input was required but not filled, remove the error once it is filled
	// TODO: is this correct?
	if (error) {
		const is = getInputStatus(proppath);
		if(is && is.status==='error' && required && value) {
			setInputStatus({path:proppath, status:'ok', message:'ok'});
			error = undefined;
		}
	}

	// Minor TODO lets refactor this so we always do the wrapper, then call a 2nd jsx function for the input (instead of the recursing flag)
	// label / help? show it and recurse
	// NB: Checkbox has a different html layout :( -- handled below
	if (Misc.KControlType.ischeckbox(type)) {
		return <PropControl2 value={value} proppath={proppath} {...props} />
	}
	// Minor TODO help block id and aria-described-by property in the input
	const labelText = label || '';
	const helpIcon = tooltip ? <Misc.Icon glyph='question-sign' title={tooltip} /> : '';
	const optreq = optional? <small className='text-muted'>optional</small> 
		: required? <small className={value===undefined? 'text-danger' : null}>*</small> : null;
	// NB: The label and PropControl are on the same line to preserve the whitespace in between for inline forms.
	// NB: pass in recursing error to avoid an infinite loop with the date error handling above.
	// let props2 = Object.assign({}, props);
	// Hm -- do we need this?? the recursing flag might do the trick. delete props2.label; delete props2.help; delete props2.tooltip; delete props2.error;
						// type={type} path={path} prop={prop} error={error} {...stuff} recursing 
	return (
		<div className={join('form-group', type, error? 'has-error' : null)}>
			{label || tooltip? 
				<label htmlFor={stuff.name}>{labelText} {helpIcon} {optreq}</label>
				: null}
			{inline? ' ' : null}
			<PropControl2 value={value} proppath={proppath} {...props} />
			{help? <span className="help-block">{help}</span> : null}
			{error? <span className="help-block">{error}</span> : null}
		</div>
	);
}; // ./PropControl


/**
 * The main part - the actual input
 */
const PropControl2 = (props) => {
	// unpack ??clean up 
	// Minor TODO: keep onUpload, which is a niche prop, in otherStuff
	let {value, type="text", optional, required, path, prop, proppath, label, help, tooltip, error, validator, inline, dflt, onUpload, ...stuff} = props;
	let {item, bg, saveFn, modelValueFromInput, ...otherStuff} = stuff;

	if ( ! modelValueFromInput) modelValueFromInput = standardModelValueFromInput;
	assert( ! type || Misc.KControlType.has(type), 'Misc.PropControl: '+type);
	assert(path && _.isArray(path), 'Misc.PropControl: path is not an array: '+path+" prop:"+prop);
	assert(path.indexOf(null)===-1 && path.indexOf(undefined)===-1, 'Misc.PropControl: null in path '+path+" prop:"+prop);
	// // item ought to match what's in DataStore - but this is too noisy when it doesn't
	// if (item && item !== DataStore.getValue(path)) {
	// 	console.warn("Misc.PropControl item != DataStore version", "path", path, "item", item);
	// }
	if ( ! item) {
		item = DataStore.getValue(path) || {};
	}

	// Checkbox?
	if (Misc.KControlType.ischeckbox(type)) {
		const onChange = e => {
			// console.log("onchange", e); // minor TODO DataStore.onchange recognise and handle events
			const val = e && e.target && e.target.checked;
			DataStore.setValue(proppath, val);
			if (saveFn) saveFn({path, prop, item, value: val});		
		};
		if (value===undefined) value = false;
		// make sure we don't have "false"
		if (_.isString(value)) {
			if (value==='true') value = true;
			else if (value==='false') value = false;
		}
		const helpIcon = tooltip ? <Misc.Icon glyph='question-sign' title={tooltip} /> : null;
		return (
			<div>
				<Checkbox checked={value} onChange={onChange} {...otherStuff}>{label} {helpIcon}</Checkbox>
				{help? <span className="help-block">{help}</span> : null}
				{error? <span className="help-block">{error}</span> : null}
			</div>
		);
	} // ./checkbox

	// HACK: Yes-no (or unset) radio buttons? (eg in the Gift Aid form)
	if (type === 'yesNo') {
		return <PropControlYesNo path={path} prop={prop} value={value} inline={inline} saveFn={saveFn} />
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
		let mv = modelValueFromInput(e.target.value, type, e.type);
		// console.warn("onChange", e.target.value, mv, e);
		DataStore.setValue(proppath, mv);
		if (saveFn) saveFn({path, prop, value: mv});
		// Enable piggybacking custom onChange functionality
		if (stuff.onChange && typeof stuff.onChange === 'function') stuff.onChange(e);
		e.preventDefault();
		e.stopPropagation();
	};

	if (type === 'XId') {
		let service = otherStuff.service || 'WTF'; // FIXME // Does this actually need fixing? Is there any sensible default?
		const displayValue = value.replace('@' + service, ''); // Strip @service wart for display
		modelValueFromInput = s => Misc.normalise(s)+'@'+service;
		return (
			<div className="input-group">
				<span className="input-group-addon">{toTitleCase(service)}</span>
				<Misc.FormControl type='text' name={prop} value={displayValue} onChange={onChange} {...otherStuff} />
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
	
	if (type === 'json') {
		let spath = ['transient'].concat(proppath);
		let svalue = DataStore.getValue(spath) || JSON.stringify(value);
		const onJsonChange = e => {
			console.log("event", e.target && e.target.value, e, e.type);
			DataStore.setValue(spath, e.target.value);
			try {				
				let vnew = JSON.parse(e.target.value);
				DataStore.setValue(proppath, vnew);
				if (saveFn) saveFn({path, prop, value:vnew});
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
		return (<div>
				<Misc.FormControl type='url' name={prop} value={value} onChange={onChange} {...otherStuff} />
			<div className='pull-right' style={{background: bg, padding:bg?'20px':'0'}}><Misc.ImgThumbnail url={value} background={bg} /></div>
				<div className='clearfix' />
			</div>);
	}

	if (type === 'imgUpload' || type==='videoUpload') {
		return <PropControlImgUpload {...otherStuff} path={path} prop={prop} onUpload={onUpload} type={type} bg={bg} value={value} onChange={onChange} />;
	} // ./imgUpload

	if (type==='url') {
		delete otherStuff.https;
		return (
			<div>
				<Misc.FormControl type='url' name={prop} value={value} onChange={onChange} onBlur={onChange} {...otherStuff} />
				<div className='pull-right'><small>{value? <a href={value} target='_blank'>open in a new tab</a> : null}</small></div>
				<div className='clearfix' />
			</div>
		);
	}

	// date
	// NB dates that don't fit the mold yyyy-MM-dd get ignored by the date editor. But we stopped using that
	//  && value && ! value.match(/dddd-dd-dd/)
	if (Misc.KControlType.isdate(type)) {
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
	// HACK just a few countries
	if (type==='country') {
		let props2 = {onChange, value, ...props};
		props2.options=[null, 'GB', 'US'];
		props2.labels=['', 'United Kingdom (UK)', 'United States of America (USA)'];
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
	return <Misc.FormControl type={type} name={prop} value={value} onChange={onChange} {...otherStuff} />;
}; //./PropControl2


/**
 * @param options {any[]}
 * @param labels {?String[]|Function|Object} Map options to nice strings
 * @param multiple {?boolean} If true, this is a multi-select which handles arrays of values.
 * @param {?Boolean} canUnset If true, always offer an unset choice.
 */
const PropControlSelect = ({options, labels, value, multiple, prop, onChange, saveFn, canUnset, ...otherStuff}) => {
	// NB: pull off internal attributes so the select is happy with rest
	const {className, dflt, recursing, modelValueFromInput, ...rest} = otherStuff;
	assert(options, 'Misc.PropControl: no options for select '+[prop, otherStuff]);
	assert(options.map, 'Misc.PropControl: options not an array '+options);
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
	let domOptions = options.map(option => 
		<option key={"option_"+JSON.stringify(option)} value={option} >{labeller(option)}</option>);	
	/* text-muted is for my-loop mirror card 
	** so that unknown values are grayed out TODO do this in the my-loop DigitalMirrorCard.jsx perhaps via labeller or via css */
	let klass = join('form-control', className); //, sv && sv.includes('Unknown')? 'text-muted' : null);
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
 */
const PropControlMultiSelect = ({value, prop, labeller, options, modelValueFromInput, sv, className, type, path, saveFn, ...rest}) => {
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
		DataStore.setValue(path.concat(prop), mvs);
		if (saveFn) saveFn({path, prop, value:mvs});
	}

	let domOptions = options.map(option => 
		<BS.Checkbox key={"option_"+option} value={option} 
			checked={sv && sv.indexOf(option) !== -1}
			label={labeller(option)} onChange={onChange} inline />);	
	let klass = join('form-group', className);
	return (
		<div className={klass}>
			{domOptions}
		</div>
	);
};

/**
 * 
 * TODO buttons style
 * 
 * TODO radio buttons
 * 
 * @param labels {String[] | Function | Object} Optional value-to-string convertor.
 */
const PropControlRadio = ({type, prop, value, path, item, dflt, saveFn, options, labels, inline, ...otherStuff}) => {
	assert(options, 'PropControl: no options for radio '+prop);
	assert(options.map, 'PropControl: radio options for '+prop+' not an array '+options);
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
	const onChange = e => {
		// console.log("onchange", e); // minor TODO DataStore.onchange recognise and handle events
		const val = e && e.target && e.target.value;
		DataStore.setValue(path.concat(prop), val);
		if (saveFn) saveFn({path, prop, value: val});
	};

	const Check = type==='checkboxes'? BS.Checkbox : BS.Radio;

	return (
		<div className='form-group' >
			{options.map(option => (			
				<Check key={"option_"+option} name={prop} value={option} 
						checked={option == value} 
						onChange={onChange} {...otherStuff} 
						label={labeller(option)}
						inline={inline} />)
			)}
		</div>
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
									item, bg, dflt, saveFn, modelValueFromInput, onChange, ...otherStuff}) => {
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
		DataStore.setValue(proppath, newM);
		if (saveFn) saveFn({path, prop, newM});
		// call onChange after we do the standard updates TODO make this universal
		if (onChange) onChange(e);
	};
	let curr = Money.CURRENCY[currency || (value && value.currency)] || <span>&pound;</span>;
	let $currency;
	let changeCurrency = otherStuff.changeCurrency !== false;
	if (changeCurrency) {
		// TODO other currencies
		$currency = (
			<DropdownButton disabled={otherStuff.disabled} title={curr} componentClass={InputGroup.Button} id={'input-dropdown-addon-'+JSON.stringify(proppath)}>
				<MenuItem key="1">{curr}</MenuItem>
			</DropdownButton>
		);
	} else {
		$currency = <InputGroup.Addon>{curr}</InputGroup.Addon>;
	}
	delete otherStuff.changeCurrency;
	assert(v === 0 || v || v==='', [v, value]);
	// make sure all characters are visible
	let minWidth = ((""+v).length / 1.5)+"em";
	return (<InputGroup>
		{$currency}
		<FormControl name={prop} value={v} onChange={onMoneyChange} {...otherStuff} style={{minWidth}}/>
	</InputGroup>);
}; // ./£

/**
 * yes/no radio buttons (kind of like a checkbox)
 * 
 * @param value {?Boolean}
 */
const PropControlYesNo = ({path, prop, value, saveFn}) => {
	// NB: try to spot bad code/values -- beware of truthy/falsy here
	if (value && ! _.isBoolean(value)) {
		console.error("PropControlYesNo - value not a proper boolean!", prop, value);
		// if (value === 'yes') value = true;
		// else if (value === 'no') value = false;
	}
	// handle yes/no -> true/false
	const onChange = e => {
		// String yes/no -> boolean
		let newValue;
		if (e.target.value === 'yes') newValue = true;
		else if (e.target.value === 'no') newValue = false;
		else newValue = undefined;

		const proppath = path.concat(prop);
		DataStore.setValue(proppath, newValue);
		if (saveFn) saveFn({path, prop, newValue});
	};

	// Null/undefined doesn't mean "no"! Don't check either option until we have a value.
	const noChecked = value===false;
	// NB: checked=!!value avoids react complaining about changing from uncontrolled to controlled.
	return (
		<div className='form-group'>
			<BS.Radio value='yes' name={prop} onChange={onChange} checked={!!value} inline label='Yes' />
			<BS.Radio value='no' name={prop} onChange={onChange} checked={noChecked} inline label='No' />
		</div>
	);
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
		
		DataStore.setValue(proppath, newValue);
		if (saveFn) saveFn({path, prop, value:newValue});
		e.preventDefault();
		e.stopPropagation();
	}
	const safeValue = (value || []).join(' ');
	return <Misc.FormControl name={prop} value={safeValue} onChange={onChange} {...otherStuff} />;
};


const PropControlKeySet = ({ value, prop, proppath, saveFn, ...otherStuff}) => {
	const addRemoveKey = (key, remove) => {
		const newValue = { ...value };
		// Set false for "remove" instead of deleting because back-end performs a merge on update, which would lose simple key removal
		// TODO this leads to the data being a bit messy, with ambiguous false flags.
		// ...But we want to keep update (i.e. merge) behaviour over fresh-index in general.
		// ...TODO DataStore to maintain a diff, which it can send to the backend.
		newValue[key] = remove ? false : true;
		DataStore.setValue(proppath, newValue);
		if (saveFn) saveFn({ path, prop, value: newValue });
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
			<form className="form-inline" onSubmit={stopEvent}>
				<input className='form-control' onChange={(event) => newKey = event.target.value} 
				/> <button className={'btn '+(value? 'btn-primary' : 'btn-default')} onClick={onClickAdd} >Add</button>
			</form>
		</div>
	);
};


const PropControlEntrySet = ({ value, prop, proppath, saveFn, keyName = 'key', valueName = 'value', ...otherStuff}) => {
	const addRemoveKey = (key, val, remove) => {
		const newValue = { ...value };
		// set false instead of deleting - see rationale/TODO in PropControlKeySet
		newValue[key] = remove ? false : val;
		DataStore.setValue(proppath, newValue);
		if (saveFn) saveFn({ path, prop, value: newValue });
	}
	
	const entryElements = Object.entries(value || {}).filter(([key, val]) => val).map(([key, val]) => (
		<div className="entry" key={key}>
			{key}: <PropControl type="text" path={proppath} prop={key} />
			<span className="remove-entry" onClick={() => addRemoveKey(key, null, true)}>&times;</span>
		</div>
	));
	
	let newKey, newValue;

	const onClickAdd = (event) => {
		addRemoveKey(newKey, newValue);
		event.target.parentNode.childNodes.forEach(child => {
			if ((child.tagName || '').toLowerCase() === 'input') child.value = '';
		});
	};

	return (
		<div className="entryset form-inline">
			<div className="entries">{entryElements}</div>
			<form className="form-inline" onSubmit={stopEvent}>
				<input className='form-control' placeholder={keyName} onChange={(event) => newKey = event.target.value}
				/> <input className='form-control' placeholder={valueName} onChange={(event) => newValue = event.target.value}
				/> <button className={'btn '+(value? 'btn-primary' : 'btn-default')} onClick={onClickAdd} >Add</button>
			</form>
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
		<Misc.FormControl type='text' name={prop} value={value} onChange={onChangeWithRaw} {...otherStuff} />
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
		if ( ! getItemValue) getItemValue = s => s;
		if ( ! renderItem) renderItem = a => printer.str(a);
		const type='autocomplete';
		const items = _.isArray(options)? options : DataStore.getValue(widgetPath) || [];
		// NB: typing sends e = an event, clicking an autocomplete sends e = a value
		const onChange2 = (e, optItem) => {
			// console.log("event", e, e.type, optItem);
			// TODO a debounced property for "do ajax stuff" to hook into. HACK blur = do ajax stuff
			DataStore.setValue(['transient', 'doFetch'], e.type==='blur');	
			// typing sneds an event, clicking an autocomplete sends a value
			const val = e.target? e.target.value : e;
			let mv = modelValueFromInput(val, type, e.type);
			DataStore.setValue(proppath, mv);
			if (saveFn) saveFn({path:path, prop, value:mv});
			// e.preventDefault();
			// e.stopPropagation();
		};
		const onChange = (e, optItem) => {
			onChange2(e, optItem);
			if ( ! e.target.value) return;
			if ( ! _.isFunction(options)) return;
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
		
	return (<Autocomplete 
		inputProps={{className: otherStuff.className || 'form-control'}}
		getItemValue={getItemValue}
		items={items}
		renderItem={renderItem}
		value={value}
		onChange={onChange}
		onSelect={onChange2} 
		/>);
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
 * Normalise unicode characters which have ascii equivalents (e.g. curly quotes), to avoid many annoying issues.
 */
Misc.normalise = s => {
	if ( ! s) return s;
	s = s.replace(/['`’‘’ʼ]/g, "'");
	s = s.replace(/[\"“”„‟❛❜❝❞«»]/g, '"');
	s = s.replace(/[‐‑‒–—―-]/g, '-');
	s = s.replace(/[\u00A0\u2007\u202F\u200B]/g, ' ');
	return s;
};


/**
 * This replaces the react-bootstrap version 'cos we saw odd bugs there. 
 * Plus since we're providing state handling, we don't need a full component.
 */
const FormControl = ({value, type, required, size, className, ...otherProps}) => {
	if (value===null || value===undefined) value = '';

	if (type === 'color' && !value) { 
		// Chrome spits out a console warning about type="color" needing value in format "#rrggbb"
		// ...but if we omit value, React complains about switching an input between controlled and uncontrolled
		// So give it a dummy value and set a class to allow us to show a "no colour picked" signifier
		return <input className='form-control no-color' value="#000000" type={type} {...otherProps} />;	
	}
	// add css classes for required fields
	let klass = join(className, 'form-control', 
		required? (value? 'form-required' : 'form-required blank') : null, 
		size? 'input-'+size : null);
	// remove stuff intended for other types that will upset input
	delete otherProps.options;
	delete otherProps.labels;
	return <input className={klass} type={type} value={value} {...otherProps} />;
};

/**
 * List of types eg textarea
 * TODO allow other jsx files to add to this - for more modular code.
 */
const KControlType = new Enum("img imgUpload videoUpload textarea text search select radio checkboxes autocomplete password email url color checkbox"
							+" yesNo location date year number arraytext keyset entryset address postcode json country"
							// some Good-Loop data-classes
							+" Money XId");

// for search -- an x icon?? https://stackoverflow.com/questions/45696685/search-input-with-an-icon-bootstrap-4

Misc.FormControl = FormControl;
Misc.KControlType = KControlType;
Misc.PropControl = PropControl;

/**
 * image or video upload. Uses Dropzone
 * @param onUpload {Function} {path, prop, url, response: the full server response} Called after the server has accepted the upload.
 */
const PropControlImgUpload = ({path, prop, onUpload, type, bg, value, onChange, ...otherStuff}) => {
	delete otherStuff.https;
	const uploadAccepted = (accepted, rejected) => {
		const progress = (event) => console.log('UPLOAD PROGRESS', event.loaded);
		const load = (event) => console.log('UPLOAD SUCCESS', event);
		accepted.forEach(file => {
			ServerIO.upload(file, progress, load)
				.done(response => {
					// TODO refactor to clean this up -- we should have one way of doing things.
					// Different forms for UploadServlet vs MediaUploadServlet
					let url = (response.cargo.url) || (response.cargo.standard && response.cargo.standard.url);
					DataStore.setValue(path.concat(prop), url);
					if (onUpload) {
						onUpload({ path, prop, response, url });
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

	return (
		<div>
			<Misc.FormControl type='url' name={prop} value={value} onChange={onChange} {...otherStuff} />
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

export {
	FormControl,
	KControlType,

	InputStatus,
	setInputStatus,
	getInputStatus,
	getInputStatuses
};
// should we rename it to Input, or StoreInput, ModelInput or some such??
export default PropControl;

