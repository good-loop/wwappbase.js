import React from 'react';
import { assert, assMatch } from 'sjtest';
import Login from 'you-again';
import { Modal, ModalHeader, ModalBody, ModalFooter, Button } from 'reactstrap';
import {uid } from '../utils/miscutils';
import Cookies from 'js-cookie';
import PromiseValue from 'promise-value';
import DataStore from '../plumbing/DataStore';
import Misc from './Misc';
import C from '../CBase';
import DataClass, {getType, getId, getClass} from '../data/DataClass';
import Roles, {getRoles} from '../Roles';
import Shares, {Share, canRead, canWrite, shareThingId} from '../Shares';
import PropControl from './PropControl';

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
		<Misc.Icon fa="share-square" /> Share
	</a>);
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
 * confirm and delete
 */
const deleteShare = ({share}) => {
	let ok = confirm('Remove access: Are you sure?');
	if ( ! ok) return;
	// call the server
	const thingId = share.item;
	assMatch(thingId, String);
	Shares.doDeleteShare(share);
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
 *
 * @param {DataClass} item - The item to be shared
 * @param {?String}	name - optional name for the thing
 *
 * Note: This does NOT include the share button -- see ShareLink for that
*/
const ShareWidget = ({item, type, id, name}) => {
	if (item) {
		type = getType(item);
		id = getId(item);
		name = getClass(type) && getClass(type).getName(item);
	}
	if ( ! type || ! id) {
		return null;
	}
	const shareId = shareThingId(type, id);
	const basePath = ['widget', 'ShareWidget', shareId];
	let data = DataStore.getValue(basePath) || DataStore.setValue(basePath, {form: {}}, false);
	const {warning, show, form} = data;
	const formPath = basePath.concat('form');
	if ( ! name) name = shareId;
	let title = "Share "+name;
	let { email: withXId, enableNotification } = form;
	if (withXId) withXId += '@email';
	let sharesPV = Shares.getShareListPV(shareId);
	let validEmailBool = C.emailRegex.test(DataStore.getValue(formPath.concat('email')));
	// TODO share by url on/off
	// TODO share message email for new sharers

	return (
		<Modal isOpen={show} className="share-modal" toggle={() => DataStore.setValue([...basePath, 'show'], !show)}>
			<ModalHeader closeButton>
				<Misc.Icon fa="share-square" size="large" />
				{title}
			</ModalHeader>
			<ModalBody>
				<div className="container-fluid">
					<div className="row form-inline">
						<PropControl inline label="Email to share with" path={formPath} prop="email" type="email" />
					</div>
					<div className="row">
						<PropControl path={formPath} prop="enableNotification" label="Send a notification email" type="checkbox"/>
						{enableNotification? <PropControl path={formPath} prop="optionalMessage" id="OptionalMessage" label="Attached message" type="textarea" /> : null}
						<Button color="primary" size="lg" className="btn-block" disabled={!validEmailBool}
							onClick={() => {
								const {form} = DataStore.getValue(basePath) || {};
								shareThing({shareId, withXId});
								sendEmailNotification('/testEmail', {...form, senderId: Login.getId()});
							}}
						>
							Submit
						</Button>
					</div>
					<div className="row">
						<h4>Shared with</h4>
						<ListShares list={sharesPV.value} />
					</div>
				</div>
			</ModalBody>
			<ModalFooter />
		</Modal>
	);
}; // ./ShareWidget

const ListShares = ({list}) => {
	if ( ! list) return <Misc.Loading text="Loading current shares" />;
	// console.warn('ListShares', list);
	if ( ! list.length) return <div className="ListShares">Not shared.</div>;
	return (<div className="ListShares">
		{list.map(s => <SharedWithRow key={JSON.stringify(s)} share={s} />)}
	</div>);
};

const SharedWithRow = ({share}) => {
	assert(share, 'SharedWithRow');
	return (
		<div className="clearfix">
			<p className="pull-left">{share._to}</p>
			<Button outline color="danger" className="pull-right"
				title="remove this person's access"
				onClick={ () => deleteShare({share}) } 
			>&#8855;</Button>
	</div>);
};

const AccessDenied = ({thingId}) => {
	if ( ! getRoles().resolved) return <Misc.Loading text="Checking roles and access..." />;
	return (<Misc.Card title="Access Denied :(">
		<div>Sorry - you don't have access to this content.
			{thingId? <div><code>Content id: {thingId}</code></div> : null}
			<div>Your id: <code>{Login.isLoggedIn()? Login.getId() : "not logged in"}</code></div>
			<div>Your roles: <code>{getRoles().value? getRoles().value.join(", ") : "no roles"}</code></div>
		</div>
	</Misc.Card>);
};

/**
 *
 * @param {String} id - The app item ID.
 */
const ClaimButton = ({type, id}) => {
	const sid = shareThingId(type, id);
	const plist = Shares.getShareListPV(sid);
	if ( ! plist.resolved) {
		return <Misc.Loading text="Loading access details" />;
	}
	if (plist.value.length !== 0) {
		return <div>Access is held by: {plist.value.map( v => v._to + '\n')}</div>;
	}

	return (
		<div>
			This {type} has not been claimed yet. If you are the owner or manager, please claim it.
			<div>
				<Button color="secondary" onClick={() => Shares.claimItem({type, id})} >
					Claim {id}
				</Button>
			</div>
		</div>);
};

export default ShareWidget;
export {ShareLink, ShareWidget, AccessDenied, ClaimButton, canRead, canWrite, shareThingId};


