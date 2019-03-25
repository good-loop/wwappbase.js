/** PropControl provides inputs linked to DataStore.
 */
import React from 'react';

// FormControl removed in favour of basic <inputs> as that helped with input lag
// TODO remove the rest of these
import { Checkbox, InputGroup, DropdownButton, MenuItem} from 'react-bootstrap';

import {assert, assMatch} from 'sjtest';
import _ from 'lodash';
import Enum from 'easy-enums';
import {join, stopEvent} from 'wwutils';
import PromiseValue from 'promise-value';
import Dropzone from 'react-dropzone';
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
import {getType, getId} from '../data/DataClass';
import {notifyUser} from '../plumbing/Messaging';
import PropControlValidators from '../PropControlValidators';

/** 
 * Wraps input element to be controlled input backed by DataStore rather than state
 * Believe that this represents the common core of PropControl:
 * creates input element backed by DataStore, checks for errors
 * */
const ControlledInput = props => {
	const { dflt, name, prop, path, render, saveFn, type, validator } = props;

	const [error, setError] = React.useState(false);

	assMatch(prop, "String|Number");
	assMatch(path, Array);
	let value = DataStore.getValue([...path, prop]);
	const setValue = event => {
		DataStore.setValue([...path, prop], event.target.value);
		if( validator ) setError( validator(event.target.value) );
		if( saveFn ) saveFn({...props, error, value});

		event.preventDefault();
		event.stopPropagation();
	}

	// DEFAULTS
	// Use a default? But not to replace false or 0
	if (value===undefined || value===null || value==='') value = dflt;

	const item = props.item || DataStore.getValue(path) || {};
	const modelValueFromInput = props.modelValueFromInput || standardModelValueFromInput; 

	assert( ! type || Misc.KControlTypes.has(type), 'Misc.PropControl: '+type);
	//

	// TODO: move to another component?
	const { help, inline, label, optional, required, tooltip } = props;

	const labelText = label || '';
	const helpIcon = tooltip ? <Misc.Icon glyph='question-sign' title={tooltip} /> : '';
	const optreq = optional? <small className='text-muted'>optional</small> 
		: required? <small className={value===undefined? 'text-danger' : null}>*</small> : null;

	return (
		<>
			{(label || tooltip) && <label htmlFor={name}>{labelText} {helpIcon} {optreq}</label>}
			{inline && ' '}
			{render({...props, item, modelValueFromInput, error, value, setValue})}
			{help && <span className="help-block">{help}</span>}
			{error && <span className="help-block">{error}</span>}
		</>
	);
};

/**
 * Input bound to DataStore.
 * aka Misc.PropControl
 * 
 * @param saveFn {Function} {path, prop, value} 
 * This gets called at the end of onChange.
 * You are advised to wrap this with e.g. _.debounce(myfn, 500).
 * NB: we cant debounce here, cos it'd be a different debounce fn each time.
 * Save utils: 
 * `Misc.saveDraftFn` and `Misc.savePublishFn`, 
 * or instead of saveFn, place a Misc.SavePublishDiscard on the page.
 * @param label {?String}
 * @param path {String[]} The DataStore path to item, e.g. [data, NGO, id]
 * @param item The item being edited. Can be null, and it will be fetched by path.
 * @param prop The field being edited 
 * @param dflt {?Object} default value Beware! This may not get saved if the user never interacts.
 * @param modelValueFromInput {?Function} See standardModelValueFromInput
 * @param required {?Boolean} If set, this field should be filled in before a form submit. 
* 		TODO mark that somehow
* @param validator {?(value, rawValue) => String} Generate an error message if invalid
* @param inline {?Boolean} If set, this is an inline form, so add some spacing to the label.
* @param https {?Boolean} if true, urls must use https not http (recommended)

NB: This function provides a label / help / error wrapper -- then passes to PropControl2
 */
const PropControl = (props) => {
	let {type="text", optional, required, path, prop, label, help, tooltip, error, validator, inline, dflt, ...stuff} = props;

	if ( Misc.KControlTypes.isdate(type) ) return <ControlledInput validator={PropControlValidators.dateValidator} {...props} render={PropControlDate} />

	// url: https
	if (stuff.https !== false && (Misc.KControlTypes.isurl(type) || Misc.KControlTypes.isimg(type) || Misc.KControlTypes.isimgUpload(type))
			&& ! validator) return <ControlledInput validator={PropControlValidators.urlValidator} {...props} render={PropControlUrl} />

	// Money validator (NB: not 100% same as the backend)
	if (Misc.KControlTypes.isMoney(type)) return <ControlledInput validator={PropControlValidators.moneyValidator} {...props} render={PropControlMoney} />

	// Minor TODO lets refactor this so we always do the wrapper, then call a 2nd jsx function for the input (instead of the recursing flag)
	// label / help? show it and recurse
	// NB: Checkbox has a different html layout :( -- handled below
	if (Misc.KControlTypes.ischeckbox(type)) {
		return <PropControl2 value={value} proppath={proppath} {...props} />
	}

	if (type === 'arraytext') return <ControlledInput {...props} render={PropControlArrayText} />;

	if (type === 'keyset') return <ControlledInput {...props} render={PropControlKeySet} />;

	if (type==='textarea') return <ControlledInput {...props} render={({value, setValue}) => <textarea className="form-control" name={prop} onChange={setValue} value={value} />} />;

	if (type==='img') {
		delete props.https;
		return <ControlledInput {...props} render={(props) => {
			const {bg, setValue, value} = props;
			return (
				<>
					<Misc.FormControl {...props} type='url' onChange={setValue} />
					<div className='pull-right' style={{background: bg, padding: bg ? '20px' : '0'}}>
						<Misc.ImgThumbnail url={value} style={{background:bg}} />
					</div>
					<div className='clearfix' />
				</>
			);
		}} />;
	}

	if (type === 'imgUpload' || type==='videoUpload') return <ControlledInput {...props} render={PropControlUpload} />;

	if (type === 'Money') return <ControlledInput {...props} render={PropControlMoney} />;

	// date
	// NB dates that don't fit the mold yyyy-MM-dd get ignored by the date editor. But we stopped using that
	//  && value && ! value.match(/dddd-dd-dd/)
	if (Misc.KControlTypes.isdate(type)) return <ControlledInput {...props} render={PropControlDate} />;

	if (type === 'radio' || type === 'checkboxes') return <ControlledInput {...props} render={PropControlRadio} />;

	if (type === 'select') return <ControlledInput {...props} render={PropControlSelect} />;

	if (type === 'autocomplete') return <ControlledInput {...props} render={PropControlAutocomplete} />;

	if (type==='url') {
		delete props.https;
		return (
			<ControlledInput {...props} render={ props => {
				const {prop, setValue, value} = props;
				return (
					<>
						<Misc.FormControl type='url' name={prop} value={value} onChange={setValue} onBlur={setValue} {...props} />
						<div className='pull-right'><small>{value? <a href={value} target='_blank'>open in a new tab</a> : null}</small></div>
						<div className='clearfix' />
					</>
				);
			}}
			/>
		);
	}

	if (Misc.KControlTypes.ischeckbox(type)) {
		return (
			<ControlledInput {...props} render={ props => {
				const {help, error, label, setValue, tooltip, value} = props;
				const helpIcon = tooltip ? <Misc.Icon glyph='question-sign' title={tooltip} /> : null;

				return (
					<>
						<Checkbox checked={value} onChange={setValue} {...props}>{label} {helpIcon}</Checkbox>
						{help? <span className="help-block">{help}</span> : null}
						{error? <span className="help-block">{error}</span> : null}
					</>
				);
			}}
			/>
		);
	}

	if (type==='json') {
		return <ControlledInput 
					{...props}
					render={ ({prop, value, saveValue}) => 
						<textarea 
							className="form-control" 
							name={prop} 
							onChange={ event => saveValue(JSON.parse(event.target.value)) } 
							value={value} 
						/> 
					}
				/>;
	}

	if (type === 'XId') {
		let service = props.service || 'WTF'; // FIXME
		props.modelValueFromInput = s => Misc.normalise(s)+'@'+service;
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

	if (type === 'yesNo') {
		return <ControlledInput {...props} render={ ({prop, value, setValue}) => (
			<div className='form-group'>
				<BS.Radio value='yes' name={prop} onChange={event => setValue(event.target.value === 'yes')} checked={!!value} inline label='Yes' />
				<BS.Radio value='no' name={prop} onChange={event => setValue(event.target.value === 'yes')} checked={value === false} inline label='No' />
			</div>
		)} />;
	}

	// Minor TODO help block id and aria-described-by property in the input

	// NB: The label and PropControl are on the same line to preserve the whitespace in between for inline forms.
	// NB: pass in recursing error to avoid an infinite loop with the date error handling above.
	// let props2 = Object.assign({}, props);
	// Hm -- do we need this?? the recursing flag might do the trick. delete props2.label; delete props2.help; delete props2.tooltip; delete props2.error;
						// type={type} path={path} prop={prop} error={error} {...stuff} recursing 
	return (
		<div className={join('form-group', type, error && 'has-error')}>
			<ControlledInput {...props} render={ props => {	
				const {prop, setValue} = props;
				return <Misc.FormControl {...props} name={prop} onChange={setValue} />;
			}}
			/>
		</div>
	);
}; // ./PropControl

const PropControlUpload = props => {
	delete props.https;
	
	const {bg, prop, setValue, type, value} = props;
	
	const uploadAccepted = (accepted, rejected) => {
		const progress = (event) => console.log('UPLOAD PROGRESS', event.loaded);
		const load = (event) => console.log('UPLOAD SUCCESS', event);

		accepted.forEach(file => {
			ServerIO.upload(file, progress, load)
				.done(response => {
					let imgurl = response.cargo.url;
					if(onUpload) onUpload({path, prop, imgurl});
					DataStore.setValue(path.concat(prop), imgurl);
				})
				.fail( res => res.status == 413 && notifyUser(new Error(res.statusText)));
		});

		rejected.forEach(file => {
			// TODO Inform the user that their file had a Problem
			console.error("rejected :( "+file);
		});
	};

	let acceptedTypes = type==='imgUpload'? 'image/jpeg, image/png, image/svg+xml' : 'video/mp4, video/ogg, video/x-msvideo, video/x-ms-wmv, video/quicktime, video/ms-asf';
	let acceptedTypesDesc = type==='imgUpload'? 'JPG, PNG, or SVG image' : 'video'

	// Catch special background-colour name for img and apply a special background to show img transparency
	let className;
	if (bg === 'transparent') {
		bg = '';
		className = 'stripe-bg';
	}

	return (
		<>
			<Misc.FormControl type='url' name={prop} value={value} onChange={setValue} {...props} />
			<div className='pull-left'>
				<Dropzone
					className='DropZone'
					accept={acceptedTypes}
					style={{}}
					onDrop={uploadAccepted}
				>
					Drop a {acceptedTypesDesc} here
				</Dropzone>
			</div>
			<div className='pull-right'>
				{type === 'videoUpload' ? (
					<Misc.VideoThumbnail url={value} />
				) : (
					<Misc.ImgThumbnail className={className} style={{background: bg}} url={value} />
				)}
			</div>
			<div className='clearfix' />
		</>
	);
}

/**
 * @param multiple {?boolean} If true, this is a multi-select which handles arrays of values.
 */
const PropControlSelect = ({value, multiple, prop, setValue, ...otherStuff}) => {
	// NB: pull off internal attributes so the select is happy with rest
	const { options, labels, className, dflt, recursing, modelValueFromInput, ...rest} = otherStuff;
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
		return PropControlMultiSelect({value, prop, onChange: setValue, labeller, options, sv, className, modelValueFromInput, ...rest});
	}

	// make the options html
	// NB: react doesnt like the selected attribute ?? but we need it for multiple??	
	let domOptions = options.map(option => 
		<option key={"option_"+option} value={option} >{labeller(option)}</option>);	
	/* text-muted is for my-loop mirror card 
	** so that unknown values are grayed out TODO do this in the my-loop DigitalMirrorCard.jsx perhaps via labeller or via css */
	let klass = join('form-control', className); //, sv && sv.includes('Unknown')? 'text-muted' : null);
	return (
		<select className={klass} 
			name={prop} value={sv} onChange={setValue}
			multiple={multiple}
			{...rest}
		>
			{sv? null : <option></option>}
			{domOptions}
		</select>
	);
};

/**
 * render multi select as multi checkbox 'cos React (Jan 2019) is awkward about multi-select
 */
const PropControlMultiSelect = ({value, prop, labeller, options, modelValueFromInput, sv, className, type, path, saveValue, ...rest}) => {
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
		saveValue(mvs);
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

	const Check = type==='checkboxes'? BS.Checkbox : BS.Radio;

	return (
		<div className='form-group' >
			{options.map(option => (			
				<Check key={"option_"+option} name={prop} value={option} 
						checked={option == value} 
						onChange={saveValue} {...otherStuff} 
						label={labeller(option)}
						inline={inline} 
				/>)
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

const PropControlMoney = ({prop, value, path, proppath, 
									item, bg, dflt, saveFn, modelValueFromInput, ...otherStuff}) => {
		// special case, as this is an object.
	// Which stores its value in two ways, straight and as a x100 no-floats format for the backend
	// Convert null and numbers into MA objects
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
		// TODO move more of this into Money.js as Money.setValue()
		// keep blank as blank (so we can have unset inputs), otherwise convert to number/undefined		
		let newVal = numFromAnything(e.target.value);
		value = Money.setValue(value, newVal);
		value.raw = e.target.value; // Store raw, so we can display blank strings
		DataStore.setValue(proppath, value, true); // force update 'cos editing the object makes this look like a no-op
		// console.warn("£", value, proppath);
		if (saveFn) saveFn({path, prop, value});
	};
	let curr = Money.CURRENCY[value && value.currency] || <span>&pound;</span>;
	let currency;
	let changeCurrency = otherStuff.changeCurrency !== false;
	if (changeCurrency) {
		// TODO other currencies
		currency = (
			<DropdownButton disabled={otherStuff.disabled} title={curr} componentClass={InputGroup.Button} id={'input-dropdown-addon-'+JSON.stringify(proppath)}>
				<MenuItem key="1">{curr}</MenuItem>
			</DropdownButton>
		);
	} else {
		currency = <InputGroup.Addon>{curr}</InputGroup.Addon>;
	}
	delete otherStuff.changeCurrency;
	assert(v === 0 || v || v==='', [v, value]);
	// make sure all characters are visible
	let minWidth = ((""+v).length / 1.5)+"em";
	return (<InputGroup>
		{currency}
		<FormControl name={prop} value={v} onChange={onMoneyChange} {...otherStuff} style={{minWidth}}/>
	</InputGroup>);
}; // ./£


/**
 * Display a value as 'a b c' but store as ['a', 'b', 'c']
 * Used to edit variant.style 
 */
const PropControlArrayText = ({ value, prop, proppath, array, saveFn, ...otherStuff}) => {
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

const PropControlKeySet = ({ value, prop, proppath, array, saveFn, ...otherStuff}) => {
	const addRemoveKey = (key, remove) => {
		const newValue = { ...value };
		if (remove) {
			// delete newValue[key];
			newValue[key] = false; // send an explicit false because a backend merge would lose a simple remove
			// TODO this leads to the data being a bit messy, with ambiguous false flags. 
			// ...But we want to keep update (i.e. merge) behaviour over fresh-index in general.
			// ...TODO DataStore to maintain a diff, which it can send to the backend.
		} else {
			newValue[key] = true;
		}
		DataStore.setValue(proppath, newValue);
		if (saveFn) saveFn({ path, prop, value: newValue });
	}
	
	const keyElements = Object.keys(value || {}).filter(key => value[key]).map(key => (
		<span className="key" key={key}>{key} <span className="remove-key" onClick={() => addRemoveKey(key, true)}>&times;</span></span>
	));
	
	// TODO clear the input after add
	let newKey;
	return (
		<div className="keyset form-inline">
			<div className="keys">{keyElements}</div>	
			<form className="form-inline" onSubmit={stopEvent}>
				<input className='form-control' onChange={(event) => newKey = event.target.value} 
				/> <button className={'btn '+(value? 'btn-primary' : 'btn-default')} onClick={() => addRemoveKey(newKey)} >Add</button>
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
			let pvo = PromiseValue(optionsOutput);
			pvo.promise.then(oo => {
				DataStore.setValue(widgetPath, oo);
				// also save the info in data
				// NB: assumes we use status:published for auto-complete
				oo.forEach(opt => getType(opt) && getId(opt)? DataStore.setValue(getPath(C.KStatus.PUBLISHED,getType(opt),getId(opt)), opt) : null);
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
* @param eventType "change"|"blur" More aggressive edits should only be done on "blur"
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
 */
const KControlTypes = new Enum("img imgUpload videoUpload textarea text search select radio checkboxes autocomplete password email url color checkbox"
							+" yesNo location date year number arraytext keyset address postcode json"
							// some Good-Loop data-classes
							+" Money XId");


Misc.FormControl = FormControl;
Misc.KControlTypes = KControlTypes;
Misc.PropControl = PropControl;

/** INPUT STATUS */
class InputStatus { // extends JSend
	// TODO (needs babel config update)
	// path;
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
	KControlTypes,

	InputStatus,
	setInputStatus,
	getInputStatus,
	getInputStatuses
};
// should we rename it to Input, or StoreInput, ModelInput or some such??
export default PropControl;
