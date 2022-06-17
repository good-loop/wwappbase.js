import React, { useState } from 'react';
import { assert, assMatch } from '../utils/assert';
import Login from '../youagain';
import { Modal, ModalHeader, ModalBody, ModalFooter, Button } from 'reactstrap';
import {isEmail, stopEvent, uid } from '../utils/miscutils';
import Cookies from 'js-cookie';
import PromiseValue from 'promise-value';
import DataStore from '../plumbing/DataStore';
import Misc from './Misc';
import C from '../CBase';
import DataClass, {getType, getId, getClass} from '../data/DataClass';
import Roles, {getRoles} from '../Roles';
import Shares, {Share, canRead, canWrite, shareThingId} from '../Shares';
import PropControl from './PropControl';
import Icon from './Icon';


/**
 * a Share This button
 */
const ShareLink = ({item, type, id, shareId, children}) => {
	if (!shareId) {
		if (item) {
			type = getType(item);
			id = getId(item);
		}
		if (!type || !id) return null;

		shareId = shareThingId(type, id);
	}

	const basePath = ['widget', 'ShareWidget', shareId];

	const doShow = e => {
		stopEvent(e);
		DataStore.setValue(basePath.concat('show'), true);
	};

	if (children) return (
		<Button color="secondary" onClick={doShow}><Icon name="share" /> {children}</Button>
	);

	return (
		<a onClick={doShow} title="Share">
			<Icon name="share" />
		</a>
	);
};


/**
 *
 * @param {!String} shareId - From shareThingId()
 */
const shareThing = ({shareId, withXId}) => {
	assMatch(shareId, String);
	Shares.doShareThing({shareId, withXId});
	// clear the form
	DataStore.setValue(['widget', 'ShareWidget', 'add'], {});
};


/**
 * Delete share after confirming
 */
const deleteShare = ({share}) => {
	if (!confirm('Remove access: Are you sure?')) return;

	// Confirmed, call the server
	const thingId = share.item;
	assMatch(thingId, String);
	Shares.doDeleteShare(share);
};


/**
 * A dialog for adding and managing shares
 *
 * @param {Object} p
 * @param {?String} p.shareId E.g. "role:editor" Set this, or item, or type+id.
 * @param {?DataClass} p.item - The item to be shared
 * @param {?String}	p.name - optional name for the thing
 * @param {?boolean} p.hasButton - Show the standard share button?
 *
 * Note: This does NOT include the share button -- see ShareLink for that
*/
const ShareWidget = ({shareId, item, type, id, name, hasButton, children}) => {
	if (!shareId) {
		if (item) {
			type = getType(item);
			id = getId(item);
			name = (getClass(type) && getClass(type).getName(item)) || DataClass.getName(item);
		}
		if (!type || !id) return null;

		shareId = shareThingId(type, id);
	}

	const basePath = ['widget', 'ShareWidget', shareId];
	let data = DataStore.getValue(basePath) || DataStore.setValue(basePath, {form: {}}, false);
	const {warning, show, form} = data;
	const formPath = basePath.concat('form');
	if (!name) name = shareId;
	let title = `Share ${name}`;
	let {email: withXId, enableNotification} = form;
	if (withXId) withXId += '@email';
	let shares = show && Shares.getShareListPV(shareId).value;
	let emailOK = isEmail(DataStore.getValue(formPath.concat('email')));
	// TODO share by url on/off
	// TODO share message email for new sharers

	const toggle = () => DataStore.setValue([...basePath, 'show'], !show);

	const doShare = () => {
		const {form} = DataStore.getValue(basePath) || {};
		shareThing({shareId, withXId});
	};
	
	return <>
		{hasButton && <ShareLink shareId={shareId}>{children}</ShareLink>}
		<Modal isOpen={show} className="share-modal" toggle={toggle}>
			<ModalHeader toggle={toggle}>
				<Icon name="share" /> {title}
			</ModalHeader>
			<ModalBody>
				<div className="clearfix">
					<p>Grant another user access to this item</p>
					<PropControl inline label="Email to share with" path={formPath} prop="email" type="email" />
					<Button color="primary" disabled={!emailOK} onClick={doShare}>Share</Button>
					{/* TODO <PropControl path={formPath} prop="enableNotification" label="Send a notification email" type="checkbox"/> */}
					{enableNotification ? (
						<PropControl path={formPath} prop="optionalMessage" id="OptionalMessage" label="Attached message" type="textarea" />
					) : null}
					
				</div>
				<h5>Shared with</h5>
				<ListShares list={shares} />
			</ModalBody>
		</Modal>
	</>;
}; // ./ShareWidget


const ListShares = ({list}) => {
	if (!list) return <Misc.Loading text="Loading current shares" />;

	return (
		<ul className="ListShares">
			{list.length ? (
				list.map(s => <SharedWithRow key={JSON.stringify(s)} share={s} />)
			) : 'Not shared.'}
		</ul>
	);
};


const SharedWithRow = ({share}) => {
	assert(share, 'SharedWithRow');
	return (
		<li className="clearfix">
				{share._to}
				<Button color="danger" className="pull-right"
					title={`Revoke access for ${share._to}`}
					onClick={() => deleteShare({share})} 
				>🗙</Button>
		</li>
	);
};


const AccessDenied = ({thingId}) => {
	if (!getRoles().resolved) return <Misc.Loading text="Checking roles and access..." />;

	return (
		<Misc.Card title="Access Denied :(">
			<div>Sorry - you don't have access to this content.
				{thingId? <div><code>Content id: {thingId}</code></div> : null}
				<div>Your id: <code>{Login.isLoggedIn()? Login.getId() : "not logged in"}</code></div>
				<div>Your roles: <code>{getRoles().value? getRoles().value.join(", ") : "no roles"}</code></div>
			</div>
		</Misc.Card>
	);
};


/**
 *
 * @param {String} id - The app item ID.
 */
const ClaimButton = ({type, id}) => {
	const sid = shareThingId(type, id);
	const plist = Shares.getShareListPV(sid);
	if (!plist.resolved) {
		return <Misc.Loading text="Loading access details" />;
	}
	if (plist.value.length !== 0) {
		return <div>Access is held by: {plist.value.map( v => v._to + '\n')}</div>;
	}

	return <div>
		This {type} has not been claimed yet. If you are the owner or manager, please claim it.
		<div>
			<Button color="secondary" onClick={() => Shares.claimItem({type, id})}>email
				Claim {id}
			</Button>
		</div>
	</div>;
};


export default ShareWidget;
export {ShareLink, ShareWidget, AccessDenied, ClaimButton, canRead, canWrite, shareThingId};
