import React, { useEffect, useState } from 'react';
import Ego, { Identity, Pronoun } from '../../data/Ego';
import { assert } from '../../utils/assert';
import PropControl, { registerControl, DSsetValue } from '../PropControl';
import TagInput, { TagInputMultiWord } from './Tags';

// PropControlGender - is a PropControlPills

export const DEFAULT_GENDER_LABELS = {
    "male": "Male",
    "female": "Female",
    "non-binary": "Non-Binary",
    "transgender": "Transgender",
    "transsexual": "Transsexual",
    "intersex": "Intersex",
    "bigender": "Bigender",
    "two-spirit": "Two-Spirit",
    "androgyne": "Androgyne",
    "femme": "Femme",
    "masc": "Masc",
    "agender": "Agender",
    "fluid": "Genderfluid"
};

export const DEFAULT_PRONOUNS = {
    "they/them/their": new Pronoun("they", "them", "their"),
    "he/him/his": new Pronoun("he", "him", "his"),
    "she/her/her": new Pronoun("she", "her", "her"),
    "it/it/its": new Pronoun("it", "it", "its"),
    "xe/xem/xyr": new Pronoun("xe", "xem", "xyr"),
    "fae/faer/faer": new Pronoun("fae", "faer", "faer"),
    "ae/aer/aer": new Pronoun("ae", "aer", "aer"),
    "ey/em/eir": new Pronoun("ey", "em", "eir"),
    "ze/hir/hir": new Pronoun("ze", "hir", "hir"),
    "ve/ver/vis": new Pronoun("ve", "ver", "vis")
};

export const PropControlGender = ({storeValue, modelValueFromInput, path, prop, proppath, type, fcolor, saveFn, ...props}) => {

    if (!storeValue) storeValue = [];
    if (typeof(storeValue) === "string") {
        // manage old data
        storeValue = storeValue.split(',');
    }

    const onAddTag = tag => {
        let tags2 = storeValue ? storeValue.concat(tag) : [tag];
		let tags3 = modelValueFromInput? modelValueFromInput(tags2) : tags2;
		DSsetValue(proppath, tags3);
		if (saveFn) saveFn({path, prop});
    }

    const onRemoveTag = tag => {
        if (!storeValue || !storeValue.length) return;
        let tags2 = storeValue.filter(t => t !== tag);
		// TODO refactor so this is done by PropControl standard code, not plugin widget code
		DSsetValue(proppath, tags2);
		if (saveFn) saveFn({path, prop});
    }

    return <div className="prop-control-gender position-relative">
        <TagInput tags={storeValue}
            onAddTag={onAddTag} 
            onRemoveTag={onRemoveTag}
            autofillOptions={DEFAULT_GENDER_LABELS}
        />
    </div>
};

export const PropControlPronoun = ({storeValue, modelValueFromInput, path, prop, proppath, type, fcolor, saveFn, ...props}) => {

    if (!storeValue) storeValue = [];
    if (typeof(storeValue) === "string") {
        // manage old data
        storeValue = storeValue.split(',');
    }

    const onAddTag = tag => {
        let tags2 = storeValue ? storeValue.concat(tag) : [tag];
		let tags3 = modelValueFromInput? modelValueFromInput(tags2) : tags2;
		DSsetValue(proppath, tags3);
		if (saveFn) saveFn({path, prop});
    }

    const onRemoveTag = tag => {
        if (!storeValue || !storeValue.length) return;
        let tags2 = storeValue.filter(t => t !== tag);
		// TODO refactor so this is done by PropControl standard code, not plugin widget code
		DSsetValue(proppath, tags2);
		if (saveFn) saveFn({path, prop});
    }

    return <div className="prop-control-gender position-relative">
        <TagInputMultiWord tags={storeValue}
            wordNum={3}
            placeholders={["they", "them", "their"]}
            onAddTag={onAddTag} 
            onRemoveTag={onRemoveTag}
            autofillOptions={DEFAULT_GENDER_LABELS}
        />
    </div>

};

/**
 * See Ego.js for more information
 * @param {*} param0 
 */
const PropControlEgo = ({storeValue, modelValueFromInput, path, prop, proppath, type, fcolor, saveFn, ...props}) => {

    const WIDGET_PATH = ["widget", "PropControlEgo", "controls"];

    const fullSaveFn = e => {
        saveFn && saveFn(e);
    }

    return <div className="prop-control-ego">
        <PropControl type="gender" path={proppath.concat("identities", 0, "genders")} prop={0} saveFn={fullSaveFn}/>
        <PropControl type="checkbox" path={WIDGET_PATH} prop="multigender" label="Multi-gender" help="Show more options for multi-gender identities"/>
    </div>

};

registerControl({type:'gender', $Widget: PropControlGender});
registerControl({type:'pronoun', $Widget: PropControlPronoun});
registerControl({type:'ego', $Widget: PropControlEgo});

export default PropControlEgo;
