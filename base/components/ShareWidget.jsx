import React, { useState } from 'react';
import { assert, assMatch } from '../utils/assert';
import Login from '../youagain';
import { Modal, ModalHeader, ModalBody, ModalFooter, Button } from 'reactstrap';
import {copyTextToClipboard, setUrlParameter, isEmail, stopEvent, uid } from '../utils/miscutils';
import DataStore from '../plumbing/DataStore';
import Misc from './Misc';
import C from '../CBase';
import DataClass, {getType, getId, getClass} from '../data/DataClass';
import XId from '../data/XId';
import Roles, {getRoles} from '../Roles';
import Shares, {Share, canRead, canWrite, shareThingId, doShareThing, getShareListPV} from '../Shares';
import PropControl from './PropControl';
import Icon from './Icon';
import JSend from '../data/JSend';


/**
 * a Share This button
 */
function ShareLink({className, style, item, type, id, shareId, children, button, size, color="secondary"}) {
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

	if (children) {
		return <Button id='share-widget-btn' className={className} style={style} color={color} onClick={doShow} size={size} title="Share"><Icon name="share" /> {children}</Button>;
	}
	if (button) {
		return <Button id='share-widget-btn' className={className} style={style} color={color} onClick={doShow} size={size} title="Share"><Icon name="share" /></Button>;
	}

	return (
		<a id='share-widget-btn' className={className} style={style} onClick={doShow} title="Share">
			<Icon name="share" />
		</a>
	);
}


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
 * @param {?boolean} p.hasButton - Show the standard share button? Otherwise this would NOT include the share button -- see ShareLink for handling that separately.
 * @param {?boolean} p.hasLink offer a share-by-link option
 * @param {?String}	p.email - optional, auto-populate the email field with this value
 *
 */
function ShareWidget({shareId, item, type, id, name, email, hasButton, hasLink, noEmails, children, className, style}) {
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

	const toggle = () => {
		DataStore.setValue([...basePath, 'show'], !show)
	};

	const doShare = () => {
		const {form} = DataStore.getValue(basePath) || {};
		shareThing({shareId, withXId});
	};

	return <>
		{hasButton && <ShareLink className={className} style={style} shareId={shareId}>{children}</ShareLink>}
		<Modal isOpen={show} className="share-modal" toggle={toggle}>
			<ModalHeader toggle={toggle}>
				<Icon name="share" /> {title}
			</ModalHeader>
			<ModalBody>
				{!noEmails && <>
					<div className="clearfix">
						<p>Grant another user access to this item</p>
						<PropControl inline label="Email to share with" path={formPath} prop="email" type="email" dflt={email || ""} />
						<Button color="primary" disabled={!emailOK} onClick={doShare}>Share</Button>
						{/* TODO <PropControl path={formPath} prop="enableNotification" label="Send a notification email" type="checkbox"/> */}
						{enableNotification ? (
							<PropControl path={formPath} prop="optionalMessage" id="OptionalMessage" label="Attached message" type="textarea" />
						) : null}
					</div>
					<h5>Shared with</h5>
					<ListShares list={shares} />
				</>}
				{hasLink && <ShareByLink name={name} shareId={shareId} />}
			</ModalBody>
		</Modal>
	</>;
} // ./ShareWidget


/**
 * NB: Use an async function for nicer code around the server comms
 * @param {Object} p See ShareWidget which calls this
 * @returns 
 */
const doShareByLink = async({link, slink, setSlink, shareId}) => {
	// NB: pseudo-user is tied to the user, to allow the user to get access again later
	const withXId = `${shareId}_by_${Login.getId()}@pseudo`;
	if (slink) {
		copyTextToClipboard(slink);
		return;
	}
	let shares = await getShareListPV(shareId).promise;
	console.log("ShareByLink shares", shares);
	let pseudoShare = shares.find(s => s._to === withXId);
	if (pseudoShare) {
		try {
			// get the jwt for the already made pseudo user
			let jwtres = await Login.getJWT({txid:withXId}); // TODO allow one pseudo-user for the item across users, via:shareId+"@share"});
			let jwt = JSend.data(jwtres);
			let link2 = doShareByLink2({link, shareId, withXId, jwt});
			setSlink(link2);
			return;
		} catch(err) {
			console.warn("cant use existing pseudoShare",pseudoShare," for "+withXId);
			console.warn(err);
		}
	}	
	// request a pseudo user jwt
	console.log("ShareByLink make a new pseudo user...");
	let res = await Login.registerStranger({name:"Pseudo user for "+name, person:withXId});
	console.warn("pPseudoUser then", res, res?.cargo?.user);
	let user = JSend.data(res).user;
	let jwt = user.jwt;
	// claim the pseudo-user
	Login.claim(withXId);
	// ?? share the pseudo-user with the shareId (modified to be an XId) (so TODO e.g. users of a dashbaord can access the pseudo-user)
	// doShareThing({shareId:withXId, withXId:shareId+"@share"});

	// share the item with the pseudo-user 
	let link2 = doShareByLink2({link, shareId, withXId, jwt});
	// copy to clipboards
	setSlink(link2);	
}; // ./ doShareByLink


function ShareByLink({link, name, shareId}) {
	if ( ! link) link = window.location+"";
	let [slink, setSlink] = useState();
	return <><h5>General Access</h5>
		<Button onClick={e => doShareByLink({link, slink, setSlink, shareId})} id='copy-share-widget-link' ><Icon name="clipboard" /> Copy access link</Button>
	</>;
}

const doShareByLink2 = ({link, shareId, withXId, jwt}) => {
	console.log("ShareByLink2...");
	let pShare = doShareThing({shareId, withXId});
	let link2 = setUrlParameter(link, "jwt", jwt);
	copyTextToClipboard(link2);
	return link2;
};

/**
 * 
 * @param {Object} p
 * @param {Share[]} p.list
 * @returns 
 */
function ListShares({list}) {
	if (!list) return <Misc.Loading text="Loading current shares" />;
	// dont show pseudo users
	if (!Roles.isDev()) {
		list = list.filter(s => s._to && XId.service(s._to) !== 'pseudo');
	}
	return (
		<ul className="ListShares">
			{list.length ? (
				list.map(s => <SharedWithRow key={JSON.stringify(s)} share={s} />)
			) : 'Not shared.'}
		</ul>
	);
}


function SharedWithRow({share}) {
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
}


function AccessDenied({thingId}) {
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
}


/**
 *
 * @param {String} id - The app item ID.
 */
function ClaimButton({type, id}) {
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
}


export default ShareWidget;
export {ShareLink, ShareWidget, AccessDenied, ClaimButton, canRead, canWrite, shareThingId};
