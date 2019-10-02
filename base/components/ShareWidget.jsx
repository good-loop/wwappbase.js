import React from 'react';
import { assert, assMatch } from 'sjtest';
import Login from 'you-again';
import {Modal} from 'react-bootstrap';
import { XId, uid } from 'wwutils';
import Cookies from 'js-cookie';
import PromiseValue from 'promise-value';
import DataStore from '../plumbing/DataStore';
import Misc from './Misc';
import C from '../CBase';
import {getType, getId, getClass} from '../data/DataClass';
import Roles, {getRoles} from '../Roles';

/**
 * a Share This button
 */
const ShareLink = ({item, type, id, thingId}) => {
	assert( ! thingId, "old code - switch to item, or type+id");
	if (item) {
		type = getType(item);
		id = getId(item);
	}
	if ( ! type || ! id) {
		return null;
	}
	thingId = shareThingId(type, id);
	const basePath = ['widget', 'ShareWidget', thingId];
	return (<a href={window.location} onClick={ e => { e.preventDefault(); e.stopPropagation(); DataStore.setValue(basePath.concat('show'), true); } } >
		<Misc.Icon glyph='share' /> Share
	</a>);
};

const shareThing = ({thingId, withXId}) => {
	// call the server
	Login.shareThing(thingId, withXId);
	// optimistically update the local list
	const spath = ['misc','shares', thingId];
	let shares = DataStore.getValue(spath) || [];
	shares = shares.concat({
		item: thingId,
		by: Login.getId(),
		_to: withXId 
	});
	DataStore.setValue(spath, shares);
	// clear the form
	DataStore.setValue(['widget', 'ShareWidget', 'add'], {});
};

/**
 * confirm and delete
 */
const deleteShare = ({share}) => {
	let ok = confirm('Remove access: Are you sure?');
	if ( ! ok) return;
	// call the server
	const thingId = share.item;
	assMatch(thingId, String);
	Login.deleteShare(thingId, share._to);
	// optimistically update the local list
	const spath = ['misc','shares', thingId];
	let shares = DataStore.getValue(spath) || [];
	shares = shares.filter(s => s !== share);
	DataStore.setValue(spath, shares);
};

//Collate data from form and shares paths, then send this data off to the server
const sendEmailNotification = (url, emailData) => {
	assMatch(url, String);

	const params = {
		data: emailData
	};
	ServerIO.load(url, params);
};

/**
 * A dialog for adding and managing shares
 * {
 * 	thingId: {!String} id for the share
 * 	name: {?String} optional name for the thing
 * }
 * 
 * Note: This does NOT include the share button -- see ShareLink for that
*/
const ShareWidget = ({item, type, id, thingId, name}) => {
	assert( ! thingId, "old code - switch to item, or type+id");
	if (item) {
		type = getType(item);
		id = getId(item);
		name = getClass(type) && getClass(type).getName(item);
	}
	if ( ! type || ! id) {
		return null;
	}
	thingId = shareThingId(type, id);
	const basePath = ['widget', 'ShareWidget', thingId];
	let data = DataStore.getValue(basePath) || DataStore.setValue(basePath, {form: {}}, false);
	const {warning, show, form} = data;	
	const formPath = basePath.concat('form');
	if ( ! name) name = thingId;
	let title = "Share "+name;
	let { email: withXId, enableNotification } = form;
	if (withXId) withXId += '@email';
	let sharesPV = DataStore.fetch(['misc','shares', thingId], () => {
		let req = Login.getShareList(thingId);
		return req;
	});
	let validEmailBool = C.emailRegex.test(DataStore.getValue(formPath.concat('email')));
	// TODO share by url on/off
	// TODO share message email for new sharers

	return (
		<Modal show={show} className="share-modal" onHide={() => DataStore.setValue(basePath.concat('show'), false)}>
			<Modal.Header closeButton>
				<Modal.Title>
					<Misc.Icon glyph='share' size='large' />
					{title}
				</Modal.Title>
			</Modal.Header>
			<Modal.Body>
				<div className="container-fluid">
					<div className="row form-inline">
						<Misc.PropControl inline label='Email to share with' path={formPath} prop='email' type='email' />
					</div>	
					<div className="row">
						<Misc.PropControl path={formPath} prop='enableNotification' label='Send a notification email' type='checkbox'/>
						{enableNotification? <Misc.PropControl path={formPath} prop='optionalMessage' id='OptionalMessage' label='Attached message' type='textarea' /> : null}
						<button className='btn btn-primary btn-lg btn-block' disabled={!validEmailBool} 
							onClick={()=>{
								const {form} = DataStore.getValue(basePath) || {};

								shareThing({thingId, withXId});
								sendEmailNotification('/testEmail', {...form, senderId: Login.getId()});
								}}>
							Submit
						</button>
					</div>
					<div className="row">
						<h4>Shared with</h4>
						<ListShares list={sharesPV.value} />
					</div>
				</div>
			</Modal.Body>
			<Modal.Footer>
			</Modal.Footer>
		</Modal>
	);
}; // ./ShareWidget

const ListShares = ({list}) => {
	if ( ! list) return <Misc.Loading text='Loading current shares' />;
	console.warn('ListShares', list);
	if ( ! list.length) return <div className='ListShares'>Not shared.</div>;
	return (<div className='ListShares'>
		{list.map(s => <SharedWith key={JSON.stringify(s)} share={s} />)}
	</div>);
};

const SharedWith = ({share}) => {
	return (
		<div className='clearfix'>		
			<p className='pull-left'>{share._to}</p>
			<button className='btn btn-outline-danger pull-right' 
				title="remove this person's access"
				onClick={ () => deleteShare({share}) }
			>
				<Misc.Icon glyph='remove'/>
			</button>
	</div>);
};

/**
 * Namespaces data item IDs for sharing
 * @param {!String} type e.g. Publisher
 * @param {!String} id the item's ID
 * @returns {String} the thingId to be used with Login.share functions
 */
const shareThingId = (type, id) => {
	assert(C.TYPES.has(type), "ShareWidget.jsx shareThingId: "+type+" not in "+C.TYPES);
	assMatch(id, String);
	return type+":"+id;
};


/**
 * 
 * @returns {PromiseValue<Boolean>} .value resolves to true if they can read
 */
const canRead = (type, id) => canDo(type, id, 'read');

const canDo = (type, id, rw) => {
	let sid = shareThingId(type, id);
	return DataStore.fetch(['misc','shares', id, 'canDo', rw], () => 
		{
			return Login.checkShare(sid)
				.then(res => {
					let yes = res.cargo && res.cargo[rw];
					if (yes) return yes;
					// superuser powers? NB: this does need Roles to be pre-loaded by some other call for it to work.					
					if (C.CAN.sudo) {
						// sudo?
						yes = Roles.iCan(C.CAN.sudo).value;
					}
					return yes;
				});
		}
	);	 // ./fetch
};

/**
 * 
 * @returns {PromiseValue<Boolean>} .value resolves to true if they can read
 */
const canWrite = (type, id) => canDo(type, id, 'write');

const AccessDenied = ({thingId}) => {
	return (<Misc.Card title='Access Denied :('>
		<div>Sorry - you don't have access to this content.
			{thingId? <div><code>Content id: {thingId}</code></div> : null}
			{Login.isLoggedIn()? <div><code>Your id: {Login.getId()}</code></div> : null}
			{getRoles().value && getRoles().value.join? <div><code>Your roles: {getRoles().value.join(", ")}</code></div> : null}
		</div>
	</Misc.Card>);
};

const ClaimButton = ({type, id}) => {
	const sid = shareThingId(type, id);
	const plist = DataStore.fetch(['misc','shares', sid, 'list'], () => Login.getShareList(sid));
	if ( ! plist.resolved) {
		return <Misc.Loading text='Loading access details' />;
	}
	if (plist.value.length !== 0) {
		return <div>Access is held by: {plist.value.map( v => v._to + '\n')}</div>;
	}

	return (
		<div>
			This {type} has not been claimed yet. If you are the owner or manager, please claim it. 
			<div>
				<button className='btn btn-default' onClick={() => {
					Login.claim(shareThingId(type, id))
					.then(DataStore.update);}}
				>
					Claim {id}
				</button>
			</div>
		</div>);
};

export default ShareWidget;
export {ShareLink, ShareWidget, AccessDenied, ClaimButton, canRead, canWrite, shareThingId};


