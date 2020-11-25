import React, { useState } from 'react';

import {Button} from 'reactstrap';

import { assert, assMatch } from '../utils/assert';
import _ from 'lodash';

import Misc from './Misc';
import DataStore, {getPath} from '../plumbing/DataStore';
import ServerIO from '../plumbing/ServerIOBase';
import ActionMan from '../plumbing/ActionManBase';
import C from '../CBase';
// // import I18n from 'easyi18n';
import DataClass, {getType, getId, nonce, getStatus} from '../data/DataClass';
import {notifyUser} from '../plumbing/Messaging';
import {publishEdits, saveEdits} from '../plumbing/Crud';

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

/**
 * Save if no edits for 2 seconds
 */
const DEBOUNCE_MSECS = 2000;

/** Hack: a debounced auto-save function for the save/publish widget
 * @param {type, id, item, previous}
*/
const saveDraftFn = _.debounce(
	({type, id, item, previous}) => {
		ActionMan.saveEdits({type, id, item, previous});
		return true;
	}, DEBOUNCE_MSECS
);


/**
 * A debounced auto-publish function for the save/publish widget, or for SimpleTable saveFn
 * Must provide type and id, or path
 * path is only used to fill in for missing item info
 * * @param {type, id, item, path}
 */
const autoPublishFn = _.debounce(
	({type, id, path, item}) => {
		if ( ! type || ! id) {
			let item = item || DataStore.getValue(path);
			id = id || getId(item);
			type = type || getType(item);
		}
		assert(C.TYPES.has(type), "Misc.jsx publishDraftFn bad/missing type: "+type+" id: "+id);
		assMatch(id, String,"Misc.jsx publishDraftFn id?! "+type+" id: "+id);
		// still wanted?
		const localEditStatus = DataStore.getLocalEditsStatus(type, id);
		const status = getStatus(item);
		const isdirty = C.STATUS.isdirty(localEditStatus) || C.STATUS.issaveerror(localEditStatus);
		const isSaving = C.STATUS.issaving(localEditStatus);
		if (status===C.KStatus.PUBLISHED && ! isdirty) {
			return;
		}
		// Do it
		publishEdits(type, id, item);
		return true;
	}, DEBOUNCE_MSECS
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
 * @param {?string} position fixed|relative
 */
const SavePublishDeleteEtc = ({
	type, id, 
	hidden, position,
	cannotPublish, cannotDelete, canArchive,
	publishTooltipText = 'Your account cannot publish this.',
	autoPublish, autoSave = true,
	saveAs, unpublish,
	prePublish=T, preDelete=T, preArchive=T, preSaveAs=T
}) => {
	// No anon edits
	if (!Login.isLoggedIn()) {
		if (hidden) return null;
		return <div className="SavePublishDiscard"><i>Login to save or publish edits</i></div>;
	}

	assert(C.TYPES.has(type), 'SavePublishDeleteEtc - not a type: '+type);
	assMatch(id, String);

	let localStatus = DataStore.getLocalEditsStatus(type, id) || C.STATUS.clean;
	const isdirty = C.STATUS.isdirty(localStatus) || C.STATUS.issaveerror(localStatus);
	let isSaving = C.STATUS.issaving(localStatus);
	const status = C.KStatus.DRAFT; // editors always work on drafts
	let item = DataStore.getData({status, type, id});

	// request a save?
	if (autoSave && isdirty && ! isSaving) {
		saveDraftFn({type,id,item});
	}

	// If enabled, will automatically publish every five seconds -- BUT the save-draft has to have succeeded first (isdirty=false)
	if (autoPublish && ! isdirty && item.status !== 'PUBLISHED' && item.status !== 'ARCHIVED') {
		autoPublishFn({type, id, item});
	}

	// Sometimes we just want to autosave drafts!
	if (hidden) return <span />;


	// if nothing has been edited, then we can't publish, save, or discard
	// ??this no longer works as we force the item to be pulled from "DRAFT"
	// will therefore never have status of "PUBLISHED" <- what about an unmodified published item??
	let noEdits = item && C.KStatus.isPUBLISHED(item.status) && C.STATUS.isclean(localStatus);

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
		<div className="SavePublishDeleteEtc SavePublishDiscard" style={{position}} title={item && item.status}>
			<div><small>Status: {item && item.status} | Unsaved changes: {localStatus}{isSaving ? ', saving...' : null} | DataStore: {dsi}</small></div>

			<Button name="save" 
				color={C.STATUS.issaveerror(localStatus)? 'danger' : 'secondary'} 
				title={C.STATUS.issaveerror(localStatus)? 'There was an error when saving' : null}
				disabled={isSaving || C.STATUS.isclean(localStatus)} 
				onClick={() => saveEdits({type, id, item})}>
				Save Edits <span className="fa fa-circle-notch spinning" style={vis} />
			</Button>

			{saveAs ? <>&nbsp;
				<Button name="save-as" color="secondary" disabled={isSaving}
					title="Copy and save with a new ID"
					onClick={doSaveAs} >
					<small>Save As</small> <span className="fa fa-circle-notch spinning" style={vis} />
				</Button>
			</> : null}
			&nbsp;

			<Button name="publish" color="primary" disabled={disablePublish} title={publishTooltip}
				onClick={() => check(prePublish({item, action:C.CRUDACTION.publish})) && publishEdits(type, id)}>
				Publish Edits <span className="fa fa-circle-notch spinning" style={vis} />
			</Button>
			&nbsp;

			<Button name="discard" color="warning" disabled={isSaving || noEdits}
				onClick={() => ActionMan.discardEdits(type, id)}>
				Discard Edits <span className="fa fa-circle-notch spinning" style={vis} />
			</Button>

			{unpublish && pubExists ? <>&nbsp;
				<Button name="unpublish" color="warning" disabled={isSaving || noEdits}
					title="Move from published to draft"
					onClick={() => ActionMan.unpublish(type, id)} >
					Un-Publish <span className="fa fa-circle-notch spinning" style={vis} />
				</Button>
			</> : null}
			
			{canArchive? <>&nbsp;
				<Button name="archive" color="warning" disabled={isSaving || noEdits}
					title="Archive"
					onClick={() => check(preArchive({item,action:'archive'})) && ActionMan.archive({type, id})} >
					Archive <span className="fa fa-circle-notch spinning" style={vis} />
				</Button>
			</> : null}

			&nbsp;
			<Button name="delete" color="danger" disabled={disableDelete}
				onClick={doDeleteAndRedirect} >
				Delete <span className="fa fa-circle-notch spinning" style={vis} />
			</Button>
		</div>
	);
};

// backwards compatibility
Misc.SavePublishDiscard = SavePublishDeleteEtc;
Misc.publishDraftFn = autoPublishFn;
Misc.saveDraftFn = saveDraftFn;

export default SavePublishDeleteEtc;
export {
	confirmUserAction,
	autoPublishFn as publishDraftFn,
	saveDraftFn
}
