import React, { useState } from 'react';

import {Button} from 'reactstrap';

import {assert, assMatch} from 'sjtest';
import _ from 'lodash';

import Misc from './Misc';
import DataStore, {getPath} from '../plumbing/DataStore';
import ServerIO from '../plumbing/ServerIOBase';
import ActionMan from '../plumbing/ActionManBase';
import C from '../CBase';
// // import I18n from 'easyi18n';
import DataClass, {getType, getId, nonce} from '../data/DataClass';
import {notifyUser} from '../plumbing/Messaging';

/**
 * 
 * @param {*} item 
 * @param {String} action
 * @throws Error to cancel
 */
const confirmUserAction = ({item, action}) => {
	let name = DataClass.getName(item) || getId(item);
	let ok = confirm("Are you sure you want to "+action+" "+name+"?");
	if ( ! ok) throw new Error("User cancelled "+action);
	return true;
};

/** Hack: a debounced auto-save function for the save/publish widget
 * @param {type, id}
*/
const saveDraftFn = _.debounce(
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
const publishDraftFn = _.debounce(
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
 * no-op 
 * @returns {boolean} true
 */
const T = () => true;

/**
 * 
 * @param {Boolean} ok 
 * @returns {Boolean}
 */
const check = ok => {
	if (ok) return true;
	if (ok === false) return false;
	// bad output
	if ( ! ok) {
		console.error("pre-X should return true|false -- NOT falsy. Treating as OK and proceeding.");
	}
	return true;
};

/**
 * save buttons
 *
 * @param saveAs {?Boolean} If set, offer a save-as button which will copy, tweak the ID and the name, then save.
 */
const SavePublishDeleteEtc = ({
	type, id, hidden, 
	cannotPublish, cannotDelete, canArchive,
	publishTooltipText = 'Your account cannot publish this.',
	autoPublish, autoSave = true,
	saveAs, unpublish,
	prePublish=T, preDelete=T, preArchive=T, preSaveAs=T
}) => {
	// No anon edits
	if (!Login.isLoggedIn()) {
		if (hidden) return null;
		return <div className='SavePublishDiscard'><i>Login to save or publish edits</i></div>;
	}

	assert(C.TYPES.has(type), 'SavePublishDeleteEtc');
	assMatch(id, String);

	let localStatus = DataStore.getLocalEditsStatus(type, id) || C.STATUS.clean;
	const isdirty = C.STATUS.isdirty(localStatus) || C.STATUS.issaveerror(localStatus);
	let isSaving = C.STATUS.issaving(localStatus);
	const status = C.KStatus.DRAFT; // editors always work on drafts
	let item = DataStore.getData({status, type, id});	

	// request a save?
	if (autoSave && isdirty && ! isSaving) {
		saveDraftFn({type,id});
	}

	// If setting enabled, will automatically publish every five seconds
	if (autoPublish && isdirty && item.status !== 'ARCHIVED') {
		publishDraftFn({type, id}); // ??@AU - why was this switched off?
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

	/**
	 * Inform user delete action was succesful, and redirect to home preserving search params.
	 */
	const doDeleteAndRedirect = () => {
		let ok = check(preDelete({item, action:C.CRUDACTION.delete}));
		if ( ! ok) return;
		const pDel = ActionMan.delete(type, id);
		pDel.then(() => {
			Messaging.notifyUser(type+" "+id+" deleted");
		})
		// To be extra safe we'll redirect back to the origin, preserving any params already present
		const currentUrl = new URL(window.location);
		window.location.href = (currentUrl.origin + '/' + currentUrl.search)		
	}
	const doSaveAs = e => {
		let ok = check(preSaveAs({item,action:C.CRUDACTION.copy}));
		if ( ! ok) return;
		ActionMan.saveAs({ type, id, onChange: _.isFunction(saveAs)? saveAs : null});
	};

	return (
		<div className='SavePublishDeleteEtc SavePublishDiscard' title={item && item.status}>
			<div><small>Status: {item && item.status} | Unpublished changes: {localStatus}{isSaving? ", saving...":null} | DataStore: {dsi}</small></div>

			<Button name="save" 
				color={C.STATUS.issaveerror(localStatus)? 'danger' : 'default'} 
				title={C.STATUS.issaveerror(localStatus)? 'There was an error when saving' : null}
				disabled={isSaving || C.STATUS.isclean(localStatus)} 
				onClick={() => ActionMan.saveEdits(type, id)}>
				Save Edits <span className="fa fa-circle-notch spinning" style={vis} />
			</Button>

			{saveAs ? <>&nbsp;
				<Button name="save-as" color='default' disabled={isSaving}
					title='Copy and save with a new ID'
					onClick={doSaveAs} >
					<small>Save As</small> <span className="fa fa-circle-notch spinning" style={vis} />
				</Button>
			</> : null}
			&nbsp;

			<Button name="publish" color='primary' disabled={disablePublish} title={publishTooltip}
				onClick={() => check(prePublish({item, action:C.CRUDACTION.publish})) && ActionMan.publishEdits(type, id)}>
				Publish Edits <span className="fa fa-circle-notch spinning" style={vis} />
			</Button>
			&nbsp;

			<Button name="discard" color='warning' disabled={isSaving || noEdits}
				onClick={() => ActionMan.discardEdits(type, id)}>
				Discard Edits <span className="fa fa-circle-notch spinning" style={vis} />
			</Button>

			{unpublish && pubExists ? <>&nbsp;
				<Button name="unpublish" color='warning' disabled={isSaving || noEdits}
					title='Move from published to draft'
					onClick={() => ActionMan.unpublish(type, id)} >
					Un-Publish <span className="fa fa-circle-notch spinning" style={vis} />
				</Button>
			</> : null}
			
			{canArchive? <>&nbsp;
				<Button name="archive" color='warning' disabled={isSaving || noEdits}
					title='Archive'
					onClick={() => check(preArchive({item,action:'archive'})) && ActionMan.archive({type, id})} >
					Archive <span className="fa fa-circle-notch spinning" style={vis} />
				</Button>
			</> : null}

			&nbsp;
			<Button name="delete" color='danger' disabled={disableDelete}
				onClick={doDeleteAndRedirect} >
				Delete <span className="fa fa-circle-notch spinning" style={vis} />
			</Button>
		</div>
	);
};

// backwards compatibility
Misc.SavePublishDiscard = SavePublishDeleteEtc;
Misc.publishDraftFn = publishDraftFn;
Misc.saveDraftFn = saveDraftFn;

export default SavePublishDeleteEtc;
export {
	confirmUserAction,
	publishDraftFn,
	saveDraftFn
}
