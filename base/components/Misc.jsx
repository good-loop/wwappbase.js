import React, {useState} from 'react';

import BS, { space } from './BS';
import {assert, assMatch} from 'sjtest';
import _ from 'lodash';
import Enum from 'easy-enums';
import { setHash, XId, addScript, join, modifyHash} from 'wwutils';
import PromiseValue from 'promise-value';
import Dropzone from 'react-dropzone';

import JSend from '../data/JSend';

import DataStore from '../plumbing/DataStore';
import ServerIO from '../plumbing/ServerIOBase';
import ActionMan from '../plumbing/ActionManBase';
import printer from '../utils/printer';
import {LoginLink} from './LoginWidget';
import C from '../CBase';
import Money from '../data/Money';
// import I18n from 'easyi18n';
import {getType, getId, nonce} from '../data/DataClass';
import md5 from 'md5';
import Settings from '../Settings';
import Login from 'you-again';

const Misc = {};


/**
E.g. "Loading your settings...""
See https://www.w3schools.com/howto/howto_css_loader.asp
http://tobiasahlin.com/spinkit/

@param {?PromiseValue} pv If set, this will be checked for errors. This is for the common use-case, where Loading is used during an ajax call (which could fail).
*/
Misc.Loading = ({text, pv}) => {
	// handle ajax error?
	if (pv && pv.error) {
		let emsg = _.isString(pv.error)? pv.error : join(pvCharity.error.status, pvCharity.error.statusText);
		let edetails = join(pvCharity.error.statusText, pvCharity.error.responseText);
		return <BS.Alert><h4>Sorry - there was a problem. {emsg}</h4><div className='details'><small>{edetails}</small></div></BS.Alert>;
	}
	return (<div className='loader-box' style={{textAlign: 'center'}}>
			<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" style={{margin: 'auto', display:'block', height: '120px', width: '120px'}}>
				<g style={{stroke: 'none'}}>
						<path style={{fill: '#f6ecd1'}} d="M 50 0 a 50 50 0 0 0 -50 50 L 10 50 a 40 40 0 0 1 40 -40 Z" />
						<path style={{fill: '#507e88'}} d="M 0 50 a 50 50 0 0 0 50 50 L 50 90 a 40 40 0 0 1 -40 -40 Z" />
						<path style={{fill: '#656565'}} d="M 50 100 a 50 50 0 0 0 50 -50 L 90 50 a 40 40 0 0 1 -40 40 Z" />
						<path style={{fill: '#c73413'}} d="M 100 50 a 50 50 0 0 0 -50 -50 L 50 10 a 40 40 0 0 1 40 40 Z" />
				</g>
				<animateTransform attributeName="transform" attributeType="XML" from="0" to="360" dur="2s" type="rotate" repeatCount="indefinite" />
			</svg>
			{text === undefined? 'Loading...' : text}
	</div>)
};


/** Used by Misc.ListEditor below */
const DefaultItemEditor = ({item, path}) => <div>{JSON.stringify(item)}</div>;

/**
 * list with add, TODO remove, reorder. A simpler in-memory cousin of ListLoad
 * @param path {String[]} path to the list (which must be an array)
 * @param ItemEditor {Function} {item, path: to item i, i, ...stuff} -> jsx
 * @param blankFactory {?Function} path -> blank
 */
Misc.ListEditor = ({path, ItemEditor = DefaultItemEditor, blankFactory, noneMessage, createText = "Create", className="list-editor", ...stuff}) => {
	let list = DataStore.getValue(path) || [];
	assert(_.isArray(list), "ListEditor " + path, list);

	const addBlank = () => {
		const blank = blankFactory ? blankFactory(path) : {};
		list = list.concat(blank);
		DataStore.setValue(path, list);
	};

	const remove = index => {
		if (!confirm("Remove - Are you sure?")) return; // Confirm before delete

		list.splice(index, 1); // modify list to remove the item
		DataStore.setValue(path, list, true); // update
	};

	const itemElements = list.map((item, index) => (
		<BS.Well className="item-editor" key={'item' + index}>
			{item.name ? <h4>{index}. {item.name}</h4> : null}
			<button onClick={e => remove(index)} className='btn btn-danger btn-xs pull-right'><Misc.Icon glyph='trash'/></button>
			<ItemEditor i={index} item={item} path={path.concat(index)} list={list} {...stuff} />
		</BS.Well>
	));

	return (
		<div className={className}>
			{itemElements}
			{list.length? null : <p>{noneMessage || "None"}</p>}
			<div>
				<button className='btn btn-default' onClick={addBlank}><Misc.Icon glyph='plus' /> {createText}</button>
			</div>
		</div>
	);
};


/**
 * @param noContainer {Boolean} Dont wrap in a .container, this is going in a context which permits .rows already
 * TODO?? noPadding: {Boolean} switch off Bootstrap's row padding.
 */
Misc.Col2 = ({children, noContainer}) => {
	const row = (
		<div className='row'>
			<div className='col-md-6 col-sm-6'>{children[0]}</div><div className='col-md-6 col-sm-6'>{children[1]}</div>
		</div>
	);
	return noContainer ? row : <div className='container-fluid'>{row}</div>;
};


/**
 * Money span, falsy displays as 0
 * 
 * @param amount {?Money|Number}
 */
Misc.Money = ({amount, minimumFractionDigits, maximumFractionDigits = 2, maximumSignificantDigits}) => {
	if (_.isString(amount)) {
		console.warn("Misc.Money - Please use numbers NOT strings: ", amount);
		// sanitise string and parse to number
		amount = parseFloat(amount.replace(/[£$,]/g,''));
	}
	const snum = Money.prettyString({amount, minimumFractionDigits, maximumFractionDigits, maximumSignificantDigits});
	const currencyCode = ((amount || 0).currency || 'GBP').toUpperCase();
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


/**
 * A Logo for a known web service - eg Twitter, Facebook, Instagram, "this app"
 * TODO transparent/opaque (??? -RM)
 * TODO merge with Misc.Icon
 * @param {String} service e.g. "twitter"
 * @param {?String} url Can be used instead of `service` to provide an img link
 * @param {Boolean} color True: Use the service's brand colour as foreground colour
 * @param {Boolean} square True: Put the logo inside a rounded square
 * @param {String} size - e.g. lg (33% bigger) or '2x', '3x' etc
 */
Misc.Logo = ({service, url, size, color = true, square = true, className}) => {
	assert(service || url, 'Misc.Logo');
	// Social media - We can handle these services with FontAwesome icons
	if (service && 'twitter facebook instagram'.indexOf(service) !== -1) {
		const className = join(className, color? 'color-' + service : null);
		const fa = service + (square ? '-square' : '');
		const faSize = (size === 'xsmall') ? null : (size === 'small') ? '2x' : '4x'; // default to xlarge size, allow normal or large
		return <Misc.Icon className={className} fa={fa} prefix={Misc.FontAwesome===5?'fab':"fa"} size={faSize} />
	};
	
	// The rest we have to use images for (Instagram's mesh gradient can't be done in SVG)
	let file = url || '/img/' + service + '-logo.svg';
	if (service === 'instagram') file = '/img/instagram-logo.png';
	else if (service === C.app.service) file = C.app.logo;

	let classes = 'img-rounded logo' + (size ? ' logo-' + size : '');

	return <img alt={service} data-pin-nopin="true" className={classes} src={file} />;
}; // ./Logo


/**
 * Font-Awesome or Glyphicon icons. See also Misc.Logo
 * @param {String} fa Font Awesome icon name, e.g. "twitter" or "star"
 * @param {String} prefix Font Awesome v5 prefix e.g. "fab" for brands
 */
Misc.Icon = ({glyph, fa, size, className, prefix="fa", ...rest}) => {
	// FontAwesome favours <i>
	const Tag = glyph ? 'span' : 'i';
	const classes = glyph ? ['glyphicon glyphicon-' + glyph] : [prefix, 'fa-' + fa];

	if (size) {
		classes.push('fa-' + size);
	}
	if (className) classes.push(className);
	
	return <Tag className={classes.join(' ')} aria-hidden="true" {...rest} />;
};


/**
 * Try to make a thumbnail image for a data item by checking: logo, img
 */
Misc.Thumbnail = ({item}) => {
	if (!item) return null;
	// Newer ads store logo under item.branding.logo
	// Kept old syntax in as back-up so that the #advert page will still show icons for old ads
	let img = (item.branding && item.branding.logo) || item.logo || item.img;
	return img ? <img src={img} className='logo img-thumbnail' /> : null;
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

Misc.LongDate = ({date, noWeekday}) => {
	if (!date) return null;
	if (_.isString(date)) date = new Date(date);
	const weekday = noWeekday ? '' : weekdays[date.getDay()];
	return <time dateTime={date.toISOString()}>{weekday + ' '}{date.getDate()} {months[date.getMonth()]} {date.getFullYear()}</time>;
};

/**
 * Print a date with more specificity the closer it is to the present. Omits year for dates in the current year.
 * TODO Generalise to future dates, allow a different reference point to "now"
 * TODO Either fine tuning (eg can probably omit day-of-month ~90 days out) or options
 */
Misc.RoughDate = ({date}) => {
	if (!date) return null;
	if (_.isString(date) || _.isNumber(date)) date = new Date(date);
	const now = new Date();
	 // No, we don't care about leap seconds etc. 86400 seconds per day is fine.
	const thisYear = now.getFullYear() === date.getFullYear();
	const daysSince = (now.getTime() - date.getTime()) / 86400000;

	const time = daysSince > 2 ? null : (oh(date.getHours()) + ':' + oh(date.getMinutes())); // yesterday/today? show time
	const day = thisYear ? date.getDate() : null; // just month+year if last year or older
	const month = months[date.getMonth()]; // always show month
	const year = thisYear ? null : date.getFullYear(); // no year if it's the same

	return <time dateTime={date.toISOString()}>{[time, day, month, year].filter(a => a).join(' ')}</time>;
};


/**
 * @deprecated use dateTimeTag
 * Human-readable, unambiguous date+time string which doesn't depend on toLocaleString support
 * ??wrap in <time>??
 */
Misc.dateTimeString = (d) => (
	`${d.getDate()} ${shortMonths[d.getMonth()]} ${d.getFullYear()} ${oh(d.getHours())}:${oh(d.getMinutes())}`
);

/**
 * Human-readable, unambiguous date+time string which doesn't depend on toLocaleString support
 */
Misc.dateTimeTag = (d) => d?
	<time datetime={d.toISOString()}>{d.getDate()} {shortMonths[d.getMonth()]} {d.getFullYear()} {oh(d.getHours())}:{oh(d.getMinutes())}</time>
	: null;

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
 * @param d {Date}
 * @return {String} iso format 
 */
Misc.isoDate = (d) => d.toISOString().replace(/T.+/, '');


/**
 * 
 * @param {
 * 	url: {?String} The image url. If falsy, return null
 * 	style: {?Object} Use to override default 100px width & height
 * 	background: {?String} convenience for style={{background}}, since that's commonly needed for handling transparency
 * }
 * @return {JSX}
 */
Misc.ImgThumbnail = ({url, background, style, className = '', ...props}) => {
	if (!url) return null;
	// add in base (NB this works with style=null)
	style = Object.assign({width: '100px', height: '100px', objectFit: 'contain'}, style);
	if (background) style.background = background;
	return <img className={`img-thumbnail ${className}`} style={style} alt='thumbnail' src={url} />;
};


Misc.VideoThumbnail = ({url, width=200, height=150, controls=true}) => url ? (
	<video className="video-thumbnail" width={width} height={height} src={url} controls />
) : null;


/** Hack: a debounced auto-save function for the save/publish widget 
 * @param {type, id}
*/
Misc.saveDraftFn = _.debounce(
	({type, id}) => {
		ActionMan.saveEdits(type, id);
		return true;
	}, 5000
);


/**
 * A TODO:debounced auto-publish function for the save/publish widget, or for SimpleTable saveFn
 * Must provide type and id, or path
 * * @param {type, id, path}
 */
Misc.publishDraftFn = _.debounce(
	({type, id, path}) => {
		if ( ! type || ! id) {
			let item = DataStore.getValue(path);
			id = id || getId(item);
			type = type || getType(item);
		}
		assert(C.TYPES.has(type), "Misc.jsx publishDraftFn bad/missing type: "+type+" id: "+id);
		assMatch(id, String,"Misc.jsx publishDraftFn id?! "+type+" id: "+id);
		ActionMan.publishEdits(type, id);
		return true;
	}, 3000
);


/**
 * save buttons
 * 
 * @param saveAs {?Boolean} If set, offer a save-as button which will copy, tweak the ID and the name, then save.
 */
Misc.SavePublishDiscard = ({
	type, id, hidden, cannotPublish, cannotDelete,
	publishTooltipText = 'Your account cannot publish this.',
	autoPublish, autoSave = true,
	saveAs, unpublish
}) => {
	// No anon edits
	if (!Login.isLoggedIn()) {
		if (hidden) return null;
		return <div className='SavePublishDiscard'><i>Login to save or publish edits</i></div>;
	}

	assert(C.TYPES.has(type), 'Misc.SavePublishDiscard');
	assMatch(id, String);

	let localStatus = DataStore.getLocalEditsStatus(type, id) || C.STATUS.clean;
	let isSaving = C.STATUS.issaving(localStatus);
	const status = C.KStatus.DRAFT; // editors always work on drafts
	let item = DataStore.getData({status, type, id});

	// request a save?
	if (autoSave && C.STATUS.isdirty(localStatus) && !isSaving) {
		Misc.saveDraftFn({type,id});
	}

	// If setting enabled, will automatically publish every five seconds
	if (autoPublish && C.STATUS.isdirty(localStatus)) {
		Misc.publishDraftFn({type, id});
	}

	// Sometimes we just want to autosave drafts!
	if (hidden) return <span />;


	// if nothing has been edited, then we can't publish, save, or discard
	// NB: modified is a persistent marker, managed by the server, for draft != published
	// this no longer works as we force the item to be pulled from "DRAFT"
	// will therefore never have status of "PUBLISHED"
	let noEdits = item && C.KStatus.isPUBLISHED(item.status) && C.STATUS.isclean(localStatus) && ! item.modified;

	let disablePublish = isSaving || noEdits || cannotPublish;
	let publishTooltip = cannotPublish? publishTooltipText : (noEdits? 'Nothing to publish' : 'Publish your edits!');
	let disableDelete = isSaving || cannotDelete;

	const vis = { visibility: (isSaving ? 'visible' : 'hidden') };

	// debug info on DataStore state
	let pubv = DataStore.getData({status:C.KStatus.PUBLISHED, type, id});
	let draftv = DataStore.getData({status:C.KStatus.DRAFT, type, id});
	let dsi = pubv? (draftv? (pubv===draftv? "published = draft" : "published & draft") : "published only") 
					: (draftv? "draft only" : "nothing loaded");
	// Does a published version exist? (for if we show unpublish)
	// NB: item.status = MODIFIED should be reliable but lets not entirely count on it.
	let pubExists = pubv || (item && item.status !== C.KStatus.DRAFT);

	// merge discard / unpublish / delete into one button with a dropdown of options??
	// merge save / saveAs into one button with a dropdown of options?

	const confirmSaveAs = () => {
		const confirmed = window.confirm('Save changes onto a new advert?');
		const customVertiser = DataStore.getValue(['misc', 'targetVertiserId']);
		if (confirmed) ActionMan.saveAs({ type, id, onChange: _.isFunction(saveAs)? saveAs : null, customVertiser });
	}

	/**
	 * Inform user delete action was succesful, and redirect to home preserving search params.
	 */
	const deleteAndRedirect = () => {
		ActionMan.delete(type, id);
		// To be extra safe we'll redirect back to the origin, preserving any params already present
		const currentUrl = new URL(window.location);
		window.location.href = (currentUrl.origin + '/' + currentUrl.search)
		window.alert('Item deleted successfully!');
	}

	return (
		<div className='SavePublishDiscard' title={item && item.status}>
			<div><small>Status: {item && item.status} | Unpublished changes: {localStatus}{isSaving? ", saving...":null} | DataStore: {dsi}</small></div>
			<BS.Button name="save" color='default' disabled={isSaving || C.STATUS.isclean(localStatus)} onClick={() => ActionMan.saveEdits(type, id)}>
				Save Edits <span className="glyphicon glyphicon-cd spinning" style={vis} />
			</BS.Button>
			{saveAs ? <>&nbsp;
				<BS.Button name="save-as" color='default' disabled={isSaving} 
					title='Copy and save with a new ID'
					onClick={confirmSaveAs} >
					<small>Save As</small> <span className="glyphicon glyphicon-cd spinning" style={vis} />
				</BS.Button>
			</> : null}
			&nbsp;
			<BS.Button name="publish" color='primary' disabled={disablePublish} title={publishTooltip}
				onClick={() => ActionMan.publishEdits(type, id)}>
				Publish Edits <span className="glyphicon glyphicon-cd spinning" style={vis} />
			</BS.Button>
			&nbsp;
			<BS.Button name="discard" color='warning' disabled={isSaving || noEdits} 
				onClick={() => ActionMan.discardEdits(type, id)}>
				Discard Edits <span className="glyphicon glyphicon-cd spinning" style={vis} />
			</BS.Button>
			{unpublish && pubExists ? <>&nbsp;
				<BS.Button name="unpublish" color='warning' disabled={isSaving || noEdits} 
					title='Move from published to draft'
					onClick={() => ActionMan.unpublish(type, id)} >
					Un-Publish <span className="glyphicon glyphicon-cd spinning" style={vis} />
				</BS.Button>
			</> : null}
			&nbsp;
			<BS.Button name="delete" color='danger' disabled={disableDelete}
				onClick={deleteAndRedirect} >
				Delete <span className="glyphicon glyphicon-cd spinning" style={vis} />
			</BS.Button>
		</div>
	);
};



/**
 * 
 * @param path {?String[]} path to the form-data to submit.
 * @param {Boolean} once If set, this button can only be clicked once.
 * @param responsePath {?String[]} If set, the (JSend unwrapped) response data will be set in DataStore here.
 * @param onSuccess {JSX} TODO rename this! shown after a successful submit. This is not a function to call!
 */
Misc.SubmitButton = ({formData, path, url, responsePath, once, className='btn btn-primary', onSuccess, children}) => {
	assMatch(url, String);
	// assMatch(path, 'String[]');
	// track the submit request
	const [submitStatus, setSubmitStatus] = useState();
	// const tpath = ['transient','SubmitButton'].concat(path);	
	if ( ! formData && path) formData = DataStore.getValue(path);
	// DataStore.setValue(tpath, C.STATUS.loading);
	const params = {
		data: formData
	};
	const doSubmit = e => {
		setSubmitStatus(C.STATUS.saving);
		// DataStore.setValue(tpath, C.STATUS.saving);
		ServerIO.load(url, params)
			.then(res => {
				setSubmitStatus(C.STATUS.clean); // DataStore.setValue(tpath,
				if (responsePath) {
					const resdata = JSend.data(res);
					DataStore.setValue(responsePath, resdata);
				}
			}, err => {
				setSubmitStatus(C.STATUS.dirty); // DataStore.setValue(tpath,
			});
	};

	// let localStatus = DataStore.getValue(tpath);
	// show the success message instead?
	if (onSuccess && C.STATUS.isclean(submitStatus)) {
		return onSuccess;
	}
	let isSaving = C.STATUS.issaving(submitStatus);
	const vis = {visibility: isSaving? 'visible' : 'hidden'};
	let disabled = isSaving || (once && submitStatus);
	let title = 'Submit the form';
	if (disabled) title = isSaving? "Saving..." : "Submitted :) To avoid errors, you cannot re-submit this form";

	return (
		<button onClick={doSubmit} className={className} disabled={disabled} title={title}>
			{children}
			<span className="glyphicon glyphicon-cd spinning" style={vis} />
		</button>
	);
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
	return (
		<div>
			<div dangerouslySetInnerHTML={{__html:cleanhtml}} />;
		</div>
	);
};

/**
 * Markdown text
 */
Misc.MDText = ({source}) => {

}

/**
 * Expect children to have an "option" property which should match the "selected" attribute
 */
Misc.Tabs = ({children, path}) => {
	// TODO replace path with useState here
	// Option currently selected
	// Could use state hook for this, but would be inconsistent with the rest of the code base
	const selected = DataStore.getValue(path) || children[0].props.option;
	
	// Options to display
	const headers = children.reduce((headers, child) => [...headers, child.props.option], []);
	// Width assigned to each tab heading
	const colSize = Math.floor(12 / headers.length);

	// Show component selected, or the first option as a default
	const headerElements = headers.map(h => {
		const onClick = () => DataStore.setValue(path, h);
		return (
			<a className={space('nav-link', selected===h? 'active' : '')} id={h} key={h} onClick={onClick}>
				{h}
			</a>
		);
	});
	// https://getbootstrap.com/docs/4.4/components/navs/#javascript-behavior
	// NB: In BS, tab-content and tab-pane are used to manage show/hide -- which we do here in jsx instead
	return (
		<div>
			<BS.NavTabs>{headerElements}</BS.NavTabs>
			<div>
				{children.find(child => child.props.option === selected) || "Missing tab: "+selected }
			</div>
		</div>
	);
};


Misc.LoginToSee = ({desc}) => <div>Please login to see {desc||'this'}. <LoginLink className='btn btn-default' /></div>;

export default Misc;
