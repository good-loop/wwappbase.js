import React from 'react';

// FormControl removed in favour of basic <inputs> while debugging input lag
import { Checkbox, Radio, FormGroup, InputGroup, DropdownButton, MenuItem} from 'react-bootstrap';


import {assert, assMatch} from 'sjtest';
import _ from 'lodash';
import Enum from 'easy-enums';
import { setHash, XId, addScript} from 'wwutils';
import PV from 'promise-value';
import Dropzone from 'react-dropzone';

import DataStore from '../plumbing/DataStore';
import ServerIO from '../plumbing/ServerIOBase';
import ActionMan from '../plumbing/ActionManBase';
import printer from '../utils/printer';
import C from '../CBase';
import Money from '../data/Money';
import Autocomplete from 'react-autocomplete';
// import I18n from 'easyi18n';
import {getType, getId, nonce} from '../data/DataClass';
import md5 from 'md5';
import Settings from '../Settings';
import {FormControl, ControlTypes} from './Input';

const Misc = {};

/**
E.g. "Loading your settings...""
See https://www.w3schools.com/howto/howto_css_loader.asp
http://tobiasahlin.com/spinkit/
*/

Misc.Loading = ({text}) => {
	return (
	<div className='loader-box'>
		<center>
			<svg xmlns="http://www.w3.org/2000/svg" width={120} height={120} viewBox="0 0 120 120" style={{display:'block'}}>
				<g>
					<path
						style={{fill:"#f6ecd1"}}
						d={"m 55.714286,119.58024 c -7.741904,-0.292 -15.78298,-2.5097 -23.421927,-6.4595 -16.59268,-8.5795 -28.2751152,-24.4615 -31.47499206,-42.7896 -0.85237037,-4.88215 -0.89694323,-15.24425 -0.08717,-20.26489 1.06839076,-6.6241 3.81983446,-14.32106 7.14851426,-19.99745 7.7550078,-13.22459 20.2821748,-23.12881 34.6624388,-27.4048 5.77854,-1.71825 9.269799,-2.2438 15.465495,-2.32805 8.259948,-0.11233 12.262345,0.3137 18.183289,1.9355 2.970755,0.81372 6.747649,2.19127 7.032657,2.56503 0.109635,0.14377 1.334861,0.81414 2.722725,1.4897 9.745449,4.74376 17.877234,11.80716 23.823754,20.69371 10.48921,15.67521 12.89636,35.64346 6.42164,53.26995 -0.42649,1.161 -0.77543,2.3042 -0.77543,2.5405 0,0.6023 -2.27222,5.2715 -3.77915,7.7657 -4.17987,6.9184 -9.1534,12.4069 -15.656064,17.2773 -5.353947,4.01 -10.307625,6.6116 -16.843853,8.8462 -7.232723,2.4727 -13.480079,3.2357 -23.421927,2.8607 z m 7.604254,-16.3588 c 6.310705,-0.3516 13.443604,-2.5892 18.998253,-5.9599 7.479945,-4.5388 12.790604,-10.2829 16.711006,-18.0747 0.608817,-1.21 1.269411,-2.4236 1.467991,-2.6968 0.19858,-0.2731 0.72146,-1.5946 1.16195,-2.9365 2.57808,-7.85391 2.85351,-16.4107 0.78635,-24.42918 -2.29626,-8.90718 -7.566359,-17.13079 -14.736449,-22.99517 -3.181991,-2.60254 -8.913064,-5.93645 -10.789419,-6.27649 -0.479442,-0.0869 -1.917185,-0.51542 -3.194988,-0.95231 -4.756366,-1.62621 -9.690766,-2.32706 -15.118583,-2.14733 -3.702337,0.12259 -6.027989,0.43576 -9.266324,1.2478 -15.537407,3.89615 -27.708379,16.10415 -31.573798,31.66985 -0.338944,1.36489 -0.75203,3.5367 -0.91797,4.82624 -0.348285,2.70657 -0.396044,8.02691 -0.09403,10.47517 1.583942,12.84022 8.555758,24.11942 19.327207,31.26812 4.604384,3.0558 10.709109,5.4886 16.310464,6.4997 2.316239,0.4182 6.497984,0.7433 8.207809,0.6382 0.493355,-0.03 1.717594,-0.1009 2.720533,-0.1567 z"}
						/>
					<path
						style={{fill:"#507e88"}}
						d={"m 55.714286,119.39604 c -8.061309,-0.6585 -15.128564,-2.5883 -22.126246,-6.0418 -6.885598,-3.3981 -12.354732,-7.4515 -17.421494,-12.9117 C 8.1379822,91.79064 2.8565546,80.95184 1.0101102,69.33774 0.14039743,63.86731 -0.00771313,59.44451 0.50951462,54.38925 2.5970571,33.98612 14.452283,16.4975 32.523006,7.16351 c 8.715985,-4.50202 17.370191,-6.60141 27.377326,-6.64135 5.738913,-0.0229 10.09339,0.5295 15.647841,1.98507 2.878814,0.75441 6.719111,2.11244 7.107959,2.51357 0.183891,0.1897 -0.422642,1.8165 -2.720632,7.2971 -2.731248,6.5139 -2.992887,7.05046 -3.423135,7.02002 -0.25622,-0.0181 -1.511765,-0.39594 -2.790102,-0.8396 -4.627953,-1.60615 -9.866456,-2.33888 -15.316947,-2.14243 -6.76737,0.24391 -12.80892,1.83203 -18.715986,4.9198 -12.362816,6.46234 -20.701422,18.03073 -23.045828,31.97213 -0.440996,2.62246 -0.603348,8.33044 -0.313547,11.02372 2.082537,19.3541 16.096455,34.7611 35.132822,38.6251 3.227837,0.6552 6.132411,0.876 9.902552,0.7531 9.770422,-0.3188 18.390159,-3.4845 26.082867,-9.5792 5.000412,-3.9617 8.495819,-8.2475 11.625032,-14.2536 0.782525,-1.5019 1.533692,-2.7308 1.669252,-2.7308 0.40506,0 13.75102,5.5808 14.06939,5.8833 0.25682,0.2441 0.0772,0.7081 -1.43439,3.7045 -4.95441,9.8213 -12.31871,17.8927 -21.782796,23.8743 -3.877188,2.4505 -10.446616,5.3482 -15.309456,6.7527 -6.059745,1.7502 -14.397333,2.5994 -20.570942,2.0951 z"}
						/>
					<path
						style={{fill:"#656565"}}
						d={"m 33.067742,112.90204 c -11.852424,-5.991 -20.990008,-15.3222 -26.8042483,-27.3722 -3.1779383,-6.5863 -5.0743551,-13.7552 -5.67217915,-21.44209 -0.30284083,-3.89397 -0.30555721,-5.05347 -0.0193505,-8.25992 0.51472525,-5.76659 1.28851265,-9.53481 3.03201905,-14.76545 0.6490386,-1.94716 1.1800701,-3.65869 1.1800701,-3.8034 0,-0.58025 3.6675705,-7.52286 5.168447,-9.78373 5.8463008,-8.80666 13.3231148,-15.53522 22.5705058,-20.31174 8.715985,-4.50202 17.370191,-6.60141 27.377326,-6.64135 5.738913,-0.0229 10.09339,0.5295 15.647841,1.98507 2.878814,0.75441 6.719111,2.11244 7.107959,2.51357 0.183891,0.1897 -0.422642,1.8165 -2.720632,7.2971 -2.731248,6.5139 -2.992887,7.05046 -3.423135,7.02002 -0.25622,-0.0181 -1.511765,-0.39594 -2.790102,-0.8396 -4.627953,-1.60615 -9.866456,-2.33888 -15.316947,-2.14243 -6.76737,0.24391 -12.80892,1.83203 -18.715986,4.9198 -4.262918,2.22833 -7.505575,4.6265 -10.985011,8.12419 -3.471554,3.48977 -5.880634,6.92741 -8.399968,11.98636 -2.882028,5.78726 -4.070788,10.55644 -4.292998,17.22305 -0.253668,7.61036 1.249313,14.39205 4.700814,21.21075 2.205216,4.3566 4.453029,7.4387 8.09182,11.0952 3.677059,3.695 7.148089,6.1808 12.009966,8.6011 1.123755,0.5594 2.042875,1.0833 2.04249,1.1643 -0.0024,0.5006 -5.801216,13.866 -6.03719,13.9147 -0.156803,0.032 -1.844984,-0.7296 -3.751511,-1.6933 z"}
						/>
					<path
						style={{fill:"#c73413"}}
						d={"m 12.117054,40.06591 c -3.6960851,-1.54783 -6.824409,-2.91929 -6.9518306,-3.04768 -0.1763869,-0.17774 0.038718,-0.79411 0.9013455,-2.58278 8.4078761,-17.43384 24.6650221,-29.75911 43.5679821,-33.03084 6.67693,-1.15564 12.668775,-1.21449 19.534884,-0.19186 5.43139,0.80894 13.554817,3.24072 13.554817,4.05768 0,0.28989 -5.647122,13.93417 -5.851347,14.13772 -0.05621,0.056 -1.007719,-0.21909 -2.11446,-0.61136 -5.185897,-1.83809 -8.535546,-2.38543 -14.658777,-2.39527 -5.107687,-0.008 -6.269061,0.11311 -10.365449,1.08271 -12.623776,2.988 -23.567836,11.74636 -29.231224,23.39327 -0.695928,1.4312 -1.090614,2.03141 -1.328005,2.01953 -0.18578,-0.009 -3.36185,-1.28329 -7.057936,-2.83112 z"}
						/>
				</g>
				<animateTransform attributeName="transform" attributeType="XML" from="0" to="360" dur="2s" type="rotate" repeatCount="indefinite" />
			</svg>
			{/* <div className="loader" /> */}
			{text===undefined? 'Loading...' : text}
		</center>
	</div>);
	// <div>
	// 	<span className="glyphicon glyphicon-cog spinning" /> Loading {text || ''}...
	// </div>
};


/**
 * 
 * @param {
 * 	TODO?? noPadding: {Boolean} switch off Bootstrap's row padding.
 * }
 */
Misc.Col2 = ({children}) => (
	<div className='container-fluid'>
		<div className='row'>
			<div className='col-md-6 col-sm-6'>{children[0]}</div><div className='col-md-6 col-sm-6'>{children[1]}</div>
		</div>
	</div>
);

/**
 * Money span, falsy displays as 0
 * 
 * @param amount {Money|Number}
 */
Misc.Money = ({amount, minimumFractionDigits, maximumFractionDigits=2, maximumSignificantDigits}) => {
	if ( ! amount) amount = 0;
	if (_.isNumber(amount) || _.isString(amount)) {
		amount = {value: amount, currency:'GBP'};
	}
	let value = amount? amount.value : 0;
	if (isNaN(value)) value = 0; // avoid ugly NaNs
	if (maximumFractionDigits===0) { // because if maximumSignificantDigits is also set, these two can conflict
		value = Math.round(value);
	}
	let snum = new Intl.NumberFormat(Settings.locale, 
		{maximumFractionDigits, minimumFractionDigits, maximumSignificantDigits}
	).format(value);

	if ( ! minimumFractionDigits) {
		// remove .0 and .00
		if (snum.substr(snum.length-2) === '.0') snum = snum.substr(0, snum.length-2);
		if (snum.substr(snum.length-3) === '.00') snum = snum.substr(0, snum.length-3);
	}
	// pad .1 to .10
	if (snum.match(/\.\d$/)) snum += '0';

	const currencyCode = (amount.currency || 'GBP').toUpperCase();
	return (
		<span className='money'>
			<span className='currency-symbol'>{Money.CURRENCY[currencyCode]}</span>
			<span className='amount'>{snum}</span>
		</span>
	);
};
/**
 * Handle a few formats, inc gson-turned-a-Time.java-object-into-json
 * null is also accepted.
 */
Misc.Time = ({time}) => {
	if ( ! time) return null;
	try {
		if (_.isString(time)) {
			return <span>{new Date(time).toLocaleDateString()}</span>;			
		}
		if (time.ut) {
			return <span>{new Date(time.ut).toLocaleDateString()}</span>;
		}
		return <span>{printer.str(time)}</span>;
	} catch(err) {
		return <span>{printer.str(time)}</span>;
	}
};

/** eg a Twitter logo 
 TODO transparent/opaque */
Misc.Logo = ({service, size, transparent, bgcolor, color}) => {
	assert(service, 'Misc.Logo');
	if (service==='twitter' || service==='facebook'|| service==='instagram') {
		return <span className={'color-'+service}><Misc.Icon fa={service+"-square"} size={size==='small'? '2x' : '4x'} /></span>;
	}
	let klass = "img-rounded logo";
	if (size) klass += " logo-"+size;
	let file = '/img/'+service+'-logo.svg';
	if (service === 'instagram') file = '/img/'+service+'-logo.png';
	if (service === C.app.service) {
		file = C.app.logo;
	}
	return (
		<img alt={service} data-pin-nopin="true" className={klass} src={file} />
	);
}; // ./Logo

/**
 * Font-Awesome or Glyphicon icons
 */
Misc.Icon = ({glyph, fa, size, className, ...other}) => {	
	if (glyph) {
		return (<span className={'glyphicon glyphicon-'+glyph
								+ (size? ' fa-'+size : '')
								+ (className? ' '+className : '')} 
					aria-hidden="true" {...other} />);
	}
	return (<i className={'fa fa-'+fa + (size? ' fa-'+size : '') + (className? ' '+className : '') } 
				aria-hidden="true" {...other} />);
};

/**
 * Try to make a thumbnail image for a data item by checking: logo, img
 */
Misc.Thumbnail = ({item}) => {
	if ( ! item) return null;
	let img = item.logo || item.img;
	return img? <img src={img} className='logo img-thumbnail pull-left' /> : null;
};


/**
 * Input bound to DataStore
 * 
 * @param saveFn {Function} {path, prop, item, value} You are advised to wrap this with e.g. _.debounce(myfn, 500).
 * NB: we cant debounce here, cos it'd be a different debounce fn each time.
 * label {?String}
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
 */
Misc.PropControl = ({type="text", path, prop, label, help, tooltip, error, validator, recursing, inline, ...stuff}) => {
	assMatch(prop, "String|Number");
	assMatch(path, Array);
	const proppath = path.concat(prop);

	// HACK: catch bad dates and make an error message
	// TODO generalise this with a validation function
	if (ControlTypes.isdate(type) && ! validator) {
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
	if (stuff.https !== false && (ControlTypes.isurl(type) || ControlTypes.isimg(type) || ControlTypes.isimgUpload(type))
			&& ! validator)
	{
		validator = v => {
			if (v && v.substr(0,5) === 'http:') {
				return "Please use https for secure urls";
			}
			return null;
		};
	}
	// validate!
	if (validator) {
		const value = DataStore.getValue(proppath);
		const rawPath = path.concat(prop+"_raw");
		const rawValue = DataStore.getValue(rawPath);
		error = validator(value, rawValue);
	}

	// label / help? show it and recurse
	// NB: Checkbox has a different html layout :( -- handled below
	if ((label || help || tooltip || error) && ! ControlTypes.ischeckbox(type) && ! recursing) {
		// Minor TODO help block id and aria-described-by property in the input
		const labelText = label || '';
		const helpIcon = tooltip ? <Misc.Icon glyph='question-sign' title={tooltip} /> : '';
		// NB: The label and PropControl are on the same line to preserve the whitespace in between for inline forms.
		// NB: pass in recursing error to avoid an infinite loop with the date error handling above.
		return (
			<div className={'form-group' + (error? ' has-error' : '')}>
				{label || tooltip? <label htmlFor={stuff.name}>{labelText} {helpIcon}</label> : null}
				{inline? ' ' : null}
				<Misc.PropControl
					type={type} path={path} prop={prop} error={error} {...stuff} recursing 
				/>
				{help? <span className="help-block">{help}</span> : null}
				{error? <span className="help-block">{error}</span> : null}
			</div>
		);
	}

	// unpack
	let {item, bg, dflt, saveFn, modelValueFromInput, ...otherStuff} = stuff;
	if ( ! modelValueFromInput) modelValueFromInput = standardModelValueFromInput;
	assert( ! type || ControlTypes.has(type), 'Misc.PropControl: '+type);
	assert(_.isArray(path), 'Misc.PropControl: not an array:'+path);
	assert(path.indexOf(null)===-1 && path.indexOf(undefined)===-1, 'Misc.PropControl: null in path '+path);
	// // item ought to match what's in DataStore - but this is too noisy when it doesn't
	// if (item && item !== DataStore.getValue(path)) {
	// 	console.warn("Misc.PropControl item != DataStore version", "path", path, "item", item);
	// }
	if ( ! item) {
		item = DataStore.getValue(path) || {};
	}
	let value = item[prop]===undefined? dflt : item[prop];

	// Checkbox?
	if (ControlTypes.ischeckbox(type)) {
		const onChange = e => {
			// console.log("onchange", e); // minor TODO DataStore.onchange recognise and handle events
			const val = e && e.target && e.target.checked;
			DataStore.setValue(proppath, val);
			if (saveFn) saveFn({path, prop, item, value: val});		
		};
		if (value===undefined) value = false;
		const helpIcon = tooltip ? <Misc.Icon glyph='question-sign' title={tooltip} /> : null;
		return (<div>
			<Checkbox checked={value} onChange={onChange} {...otherStuff}>{label} {helpIcon}</Checkbox>
			{help? <span className="help-block">{help}</span> : null}
			{error? <span className="help-block">{error}</span> : null}
		</div>);
	} // ./checkbox

	// HACK: Yes-no (or unset) radio buttons? (eg in the Gift Aid form)
	if (type === 'yesNo') {
		const onChange = e => {
			// console.log("onchange", e); // minor TODO DataStore.onchange recognise and handle events
			const val = e && e.target && e.target.value && e.target.value !== 'false';
			DataStore.setValue(proppath, val);
			if (saveFn) saveFn({path, prop, item, value: val});		
		};

		// Null/undefined doesn't mean "no"! Don't check either option until we have a value.
		const noChecked = value !== null && value !== undefined && !value;

		return (
			<div className='form-group'>
				<Radio value name={prop} onChange={onChange} checked={value} inline>Yes</Radio>
				<Radio value={false} name={prop} onChange={onChange} checked={noChecked} inline>No</Radio>
			</div>
		);
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
		console.log("event", e, e.type);
		// TODO a debounced property for "do ajax stuff" to hook into. HACK blur = do ajax stuff
		DataStore.setValue(['transient', 'doFetch'], e.type==='blur');	
		let mv = modelValueFromInput(e.target.value, type, e.type);
		DataStore.setValue(proppath, mv);
		if (saveFn) saveFn({path, value:mv});
		e.preventDefault();
		e.stopPropagation();
	};

	if (type === 'arraytext') {
		// Pretty hacky: Value stored as ["one", "two", "three"] but displayed as "one two three"
		// Currently used for entering list of unit-variants for publisher
		const arrayChange = e => {
			const oldString = DataStore.getValue(proppath);
			const newString = e.target.value;

			// Split into space-separated tokens
			let newValue = newString.split(' ');
			// Remove falsy entries, if deleting (ie newString is substring of oldString) but not if adding
			// allows us to go 'one' (['one']) -> "one " ('one', '') -> "one two" ('one', 'two')
			if (oldString.indexOf(newString) >= 0) {
				newValue = newValue.filter(val => val);
			}
			
			DataStore.setValue(proppath, newValue);
			if (saveFn) saveFn({path});
			e.preventDefault();
			e.stopPropagation();
		};
		return <FormControl type={type} name={prop} value={value.join(' ')} onChange={arrayChange} {...otherStuff} />;
	}

	if (type==='textarea') {
		return <textarea className="form-control" name={prop} onChange={onChange} {...otherStuff} value={value} />;
	}
	if (type==='json') {
		let spath = ['transient'].concat(proppath);
		let svalue = DataStore.getValue(spath) || JSON.stringify(value);
		const onJsonChange = e => {
			console.log("event", e.target && e.target.value, e, e.type);
			DataStore.setValue(spath, e.target.value);
			try {				
				let vnew = JSON.parse(e.target.value);
				DataStore.setValue(proppath, vnew);
				if (saveFn) saveFn({path:path});
			} catch(err) {
				console.warn(err);
				// TODO show error feedback
			}			
			e.preventDefault();
			e.stopPropagation();
		};
		return <textarea className="form-control" name={prop} onChange={onJsonChange} {...otherStuff} value={svalue} />;
	}

	if (type==='img') {
		delete otherStuff.https;
		return (<div>
				<FormControl type='url' name={prop} value={value} onChange={onChange} {...otherStuff} />
			<div className='pull-right' style={{background: bg, padding:bg?'20px':'0'}}><Misc.ImgThumbnail url={value} style={{background:bg}} /></div>
				<div className='clearfix' />
			</div>);
	}

	if (type === 'imgUpload') {
		delete otherStuff.https;
		const uploadAccepted = (accepted, rejected) => {
			const progress = (event) => console.log('UPLOAD PROGRESS', event.loaded);
			const load = (event) => console.log('UPLOAD SUCCESS', event);
	
			accepted.forEach(file => {
				ServerIO.upload(file, progress, load)
					.done(response => {
						let imgurl = response.cargo.url;
						// ?? odd relative path bug seen by DA July 2018: //path ??
						DataStore.setValue(path.concat(prop), imgurl);
					});
			});
	
			rejected.forEach(file => {
				// TODO Inform the user that their file had a Problem
			});
		};

		return (
			<div>
				<FormControl type='url' name={prop} value={value} onChange={onChange} {...otherStuff} />
				<div className='pull-left'>
					<Dropzone
						className='DropZone'
						accept='image/jpeg, image/png, image/svg+xml'
						style={{}}
						onDrop={uploadAccepted}
					>
						Drop a JPG, PNG, or SVG image here
					</Dropzone>
				</div>
				<div className='pull-right' style={{background: bg, padding:bg?'20px':'0'}}><Misc.ImgThumbnail style={{background: bg}} url={value} /></div>
				<div className='clearfix' />
			</div>
		);
	} // ./imgUpload

	if (type==='url') {
		delete otherStuff.https;
		return (<div>
			<FormControl type='url' name={prop} value={value} onChange={onChange} onBlur={onChange} {...otherStuff} />
			<div className='pull-right'><small>{value? <a href={value} target='_blank'>open in a new tab</a> : null}</small></div>
			<div className='clearfix' />
		</div>);
	}

	// date
	// NB dates that don't fit the mold yyyy-MM-dd get ignored by the date editor. But we stopped using that
	//  && value && ! value.match(/dddd-dd-dd/)
	if (ControlTypes.isdate(type)) {
		const acprops = {prop, item, value, onChange, ...otherStuff};
		return <PropControlDate {...acprops} />;
	}

	if (type==='select') {
		const { options, defaultValue, labels, ...rest} = otherStuff;

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
		// make the options html
		let domOptions = options.map(option => <option key={"option_"+option} value={option} >{labeller(option)}</option>);
		let sv = value || defaultValue;
		return (
			<select className='form-control' name={prop} value={sv} onChange={onChange} {...rest} >
				{sv? null : <option></option>}
				{domOptions}
			</select>
		);
	}
	if (type==='autocomplete') {
		let acprops ={prop, value, path, proppath, item, bg, dflt, saveFn, modelValueFromInput, ...otherStuff};
		return <PropControlAutocomplete {...acprops} />;
	}
	// normal
	// NB: type=color should produce a colour picker :)
	return <FormControl type={type} name={prop} value={value} onChange={onChange} {...otherStuff} />;
}; //./PropControl

/**
 * Strip commas £/$/euro and parse float
 * @param {*} v 
 * @returns Number. undefined/null are returned as-is.
 */
const numFromAnything = v => {
	if (v===undefined || v===null) return v;
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
		value = Money.make({value});
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
		if (saveFn) saveFn({path, value});
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
	if ( ! otherStuff.placeholder) otherStuff.placeholder = 'yyyy-mm-dd, e.g. today is '+isoDate(new Date());
	return (<div>
		<FormControl type='text' name={prop} value={value} onChange={onChangeWithRaw} {...otherStuff} />
		<div className='pull-right'><i>{datePreview}</i></div>
		<div className='clearfix' />
	</div>);	
};


const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;
const YEAR = 365 * DAY;

Misc.RelativeDate = ({date, ...rest}) => {
	const dateObj = new Date(date);
	const now = new Date();

	let diff = now.getTime() - dateObj.getTime();
	let relation = diff > 0 ? 'ago' : 'in the future';
	diff = Math.abs(diff);
	const absoluteDate = dateObj.toLocaleString('en-GB');
	let count = 'less than one';
	let counter = 'second';

	const calcCount = (divisor) => Math.round(diff / divisor);

	if (diff > YEAR) {
		count = calcCount(YEAR);
		counter = 'year';
	} else if (diff > 4 * WEEK) {
		// months is fiddly, so let Date handle it
		count = (now.getMonth() - dateObj.getMonth()) + (12 * (now.getYear() - dateObj.getYear()));
		counter = 'month';	
	} else if (diff > WEEK) {
		count = calcCount(WEEK);
		counter = 'week';
	} else if (diff > DAY) {
		count = calcCount(DAY);
		counter = 'day';
	} else if (diff > HOUR) {
		count = calcCount(HOUR);
		counter = 'hour';
	} else if (diff > MINUTE) {
		count = calcCount(MINUTE);
		counter = 'minute';
	} else if (diff > SECOND) {
		count = calcCount(SECOND);
		counter = 'second';
	}

	if (count > 1) {
		counter += 's';
	}

	return <span title={absoluteDate} {...rest}>{count} {counter} {relation}</span>;
};

const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const shortWeekdays = weekdays.map(weekday => weekday.substr(0, 3));
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const shortMonths = months.map(month => month.substr(0, 3));

const oh = (n) => n<10? '0'+n : n;

Misc.LongDate = ({date}) => {
	if (_.isString(date)) date = new Date(date);
	return <span>{`${weekdays[date.getDay()]} ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`}</span>;
};

/**
 * Human-readable, unambiguous date+time string which doesn't depend on toLocaleString support
 */
Misc.dateTimeString = (d) => (
	`${d.getDate()} ${shortMonths[d.getMonth()]} ${d.getFullYear()} ${oh(d.getHours())}:${oh(d.getMinutes())}`
);

Misc.AvatarImg = ({peep, ...props}) => {
	if ( ! peep) return null;
	let { img, name } = peep;
	let { className, alt, ...rest} = props;
	const id = getId(peep);

	name = name || (id && XId.id(id)) || 'anon';
	alt = alt || `Avatar for ${name}`;

	if ( ! img) {
		// try a gravatar -- maybe 20% will have one c.f. http://euri.ca/2013/how-many-people-use-gravatar/index.html#fnref-1104-3
		if (id && XId.service(id) === 'email') {
			let e = XId.id(id);
			img = 'https://www.gravatar.com/avatar/'+md5(e);						
		}
		// security paranoia -- but it looks like Gravatar dont set a tracking cookie
		// let html = `<img className='AvatarImg' alt=${'Avatar for '+name} src=${src} />`;
		// return <iframe title={nonce()} src={'data:text/html,' + encodeURIComponent(html)} />;
	}

	return <img className={`AvatarImg img-thumbnail ${className}`} alt={alt} src={img} {...rest} />;
};

/**
 * wraps the reactjs autocomplete widget
 */
const PropControlAutocomplete = ({prop, value, options, getItemValue, renderItem, path, proppath, 
									item, bg, dflt, saveFn, modelValueFromInput, ...otherStuff}) => {
	// a place to store the working state of this widget
	let widgetPath = ['widget', 'autocomplete'].concat(path);
	if ( ! getItemValue) getItemValue = s => s;
	if ( ! renderItem) renderItem = a => printer.str(a);
	const type='autocomplete';
	let items = _.isArray(options)? options : DataStore.getValue(widgetPath) || [];
	// NB: typing sends e = an event, clicking an autocomplete sends e = a value
	const onChange2 = (e, optItem) => {
		console.log("event", e, e.type, optItem);
		// TODO a debounced property for "do ajax stuff" to hook into. HACK blur = do ajax stuff
		DataStore.setValue(['transient', 'doFetch'], e.type==='blur');	
		// typing sneds an event, clicking an autocomplete sends a value
		const val = e.target? e.target.value : e;
		let mv = modelValueFromInput(val, type, e.type);
		DataStore.setValue(proppath, mv);
		if (saveFn) saveFn({path:path, value:mv});
		// e.preventDefault();
		// e.stopPropagation();
	};
	const onChange = (e, optItem) => {
		onChange2(e, optItem);
		if ( ! e.target.value) return;
		if ( ! _.isFunction(options)) return;
		let optionsOutput = options(e.target.value);
		let pvo = PV(optionsOutput);
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
 * @param d {Date}
 * @returns {String}
 */
const isoDate = (d) => d.toISOString().replace(/T.+/, '');

/**
 * 
 * @param {
 * 	url: {?String} The image url. If falsy, return null
 * 	style: {?Object}
 * }
 */
Misc.ImgThumbnail = ({url, style}) => {
	if ( ! url) return null;
	// add in base (NB this works with style=null)
	style = Object.assign({width:'100px', maxHeight:'200px'}, style);
	return (<img className='img-thumbnail' style={style} alt='thumbnail' src={url} />);
};

Misc.VideoThumbnail = ({url, width=200, height=150, controls=true}) => url? <video width={width} height={height} src={url} controls /> : null;

/** Hack: a debounced auto-save function for the save/publish widget */
const saveDraftFn = _.debounce(
	({type, id}) => {
		ActionMan.saveEdits(type, id);
		return true;
	}, 5000);

const publishDraftFn = _.debounce(
	({type, id}) => {
		ActionMan.publishEdits(type, id);
		return true;
	}, 5000);


/**
 * save buttons
 * TODO auto-save on edit -- copy from sogive
 */
Misc.SavePublishDiscard = ({type, id, hidden, cannotPublish, cannotDelete, publishTooltipText='Your account cannot publish this.', autoPublish, autoSave = true}) => {
	// No anon edits
	if ( ! Login.isLoggedIn()) {
		return (<div className='SavePublishDiscard'><i>Login to save or publish edits</i></div>);
	}
	assert(C.TYPES.has(type), 'Misc.SavePublishDiscard');
	assMatch(id, String);
	let localStatus = DataStore.getLocalEditsStatus(type, id);
	let isSaving = C.STATUS.issaving(localStatus);	
	const status = C.KStatus.DRAFT; // editors always work on drafts
	let item = DataStore.getData(status, type, id);
	// request a save?
	if (autoSave && C.STATUS.isdirty(localStatus) && ! isSaving) {
		saveDraftFn({type,id});
	}
	// If setting enabled, will automatically publish every five seconds
	if (autoPublish && C.STATUS.isdirty(localStatus)) {
		publishDraftFn({type, id});
	}
	// if nothing has been edited, then we can't publish, save, or discard
	// NB: modified is a persistent marker, managed by the server, for draft != published
	let noEdits = item && C.KStatus.isPUBLISHED(item.status) && C.STATUS.isclean(localStatus) && ! item.modified;

	let disablePublish = isSaving || noEdits || cannotPublish;
	let publishTooltip = cannotPublish? publishTooltipText : (noEdits? 'Nothing to publish' : 'Publish your edits!');
	let disableDelete = isSaving || cannotDelete;
	// Sometimes we just want to autosave drafts!
	if (hidden) return <span />;
	const vis ={visibility: isSaving? 'visible' : 'hidden'};

	// debug info on DataStore state
	let pubv = DataStore.getData(C.KStatus.PUBLISHED, type, id);
	let draftv = DataStore.getData(C.KStatus.DRAFT, type, id);
	let dsi = pubv? (draftv? (pubv===draftv? "published = draft" : "published & draft") : "published only") 
					: (draftv? "draft only" : "nothing loaded");

	return (<div className='SavePublishDiscard' title={item && item.status}>
		<div><small>Status: {item && item.status}, Modified: {localStatus} {isSaving? "saving...":null}, DataStore: {dsi}</small></div>
		<button className='btn btn-default' disabled={isSaving || C.STATUS.isclean(localStatus)} onClick={() => ActionMan.saveEdits(type, id)}>
			Save Edits <span className="glyphicon glyphicon-cd spinning" style={vis} />
		</button>
		&nbsp;
		<button className='btn btn-primary' disabled={disablePublish} title={publishTooltip} onClick={() => ActionMan.publishEdits(type, id)}>
			Publish Edits <span className="glyphicon glyphicon-cd spinning" style={vis} />
		</button>
		&nbsp;
		<button className='btn btn-warning' disabled={isSaving || noEdits} onClick={() => ActionMan.discardEdits(type, id)}>
			Discard Edits <span className="glyphicon glyphicon-cd spinning" style={vis} />
		</button>
		&nbsp;
		<button className='btn btn-danger' disabled={disableDelete} onClick={() => ActionMan.delete(type, id)} >
			Delete <span className="glyphicon glyphicon-cd spinning" style={vis} />
		</button>
	</div>);
};
/**
 * 
 * @param {Boolean} once If set, this button can only be clicked once.
 */
Misc.SubmitButton = ({path, url, once, className='btn btn-primary', onSuccess, children}) => {
	assMatch(url, String);
	assMatch(path, 'String[]');
	const tpath = ['transient','SubmitButton'].concat(path);

	let formData = DataStore.getValue(path);
	// DataStore.setValue(tpath, C.STATUS.loading);
	const params = {
		data: formData
	};
	const doSubmit = e => {
		DataStore.setValue(tpath, C.STATUS.saving);
		ServerIO.load(url, params)
			.then(res => {
				DataStore.setValue(tpath, C.STATUS.clean);
			}, err => {
				DataStore.setValue(tpath, C.STATUS.dirty);
			});
	};
	
	let localStatus = DataStore.getValue(tpath);
	// show the success message instead?
	if (onSuccess && C.STATUS.isclean(localStatus)) {
		return onSuccess;
	}
	let isSaving = C.STATUS.issaving(localStatus);	
	const vis ={visibility: isSaving? 'visible' : 'hidden'};
	let disabled = isSaving || (once && localStatus);
	let title ='Submit the form';
	if (disabled) title = isSaving? "saving..." : "Submitted :) To avoid errors, you cannot re-submit this form";	
	return (<button onClick={doSubmit} 
		className={className}
		disabled={disabled}
		title={title}
	>
		{children}
		<span className="glyphicon glyphicon-cd spinning" style={vis} />
	</button>);
};

/**
 * A minor convenience for raw html
 */
Misc.RawHtml = ({html}) => {
	// extract and add scripts?!
	let cleanhtml = html.replace(/<script[^>]+><\/script>/g, stag => {
		let src = $(stag).attr('src');
		addScript(src, {});
		return '<!-- snip: script '+src+' -->';
	});
	return (<div>
			<div dangerouslySetInnerHTML={{__html:cleanhtml}} />;
		</div>);
};

/**
 * BootStrap radio button group
 * Records which radio is currently active in DataStore[path, prop]
 * @param headers Array of possible options
 * @param noDefault If unset, first header will be selected by default.
 */
Misc.RadioGroup = ({path, prop, headers, noDefault}) => {
	assMatch(path, 'String[]');
	assMatch(prop, 'String');
	assMatch(headers, 'String[]');

	const proppath = path.concat(prop);
	const checkedValue = DataStore.getValue(proppath) || (!noDefault && headers[0]);
	const colSize = Math.floor(12/headers.length);

	//Place default value in DataStore
	if(!noDefault && !DataStore.getValue(proppath)) {
		DataStore.setValue(proppath, headers[0]);
	}

	return (
		<div>
			<ul className="nav nav-tabs">
				{headers.map((h, i) => {
					return(
						<li
							className={checkedValue === h ? "active" : ""}
							id={h}
							key={h}
							onClick={() => {
								DataStore.setValue(proppath, h);
							}}
						>
							<a data-toggle="tab">{h}</a>
						</li>
					)
				})}
			</ul>
		</div>
	);
};

export default Misc;
