import React, { useState } from 'react';
import { Button } from 'reactstrap';
import PropControlPills from '../PropControlPills';
import Ego, { Identity, Pronoun } from '../../data/Ego';

// PropControlGender - is a PropControlPills

export const DEFAULT_GENDER_LABELS = {
    "male": "Male",
    "female": "Female",
    "non-binary": "Non-Binary",
    "trans": "Transgender",
    "intersex": "Intersex",
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

/**
 * Specialised inner control to replace PropControlAutoComplete - potentially migrate/expand into it's own PropControl later 
 * @param {Object} options in format {option:label}
 * @param {Function} onSelect
 */
const Autofill = ({value, onSelect, options}) => {

    let labels = Object.values(options);
    labels = labels.filter(label => label.includes(value));
    let filteredOptions = {};
    labels.forEach(label => {
        Object.keys(options).forEach(option => {
            if (options[option] === label) {
                filteredOptions[option] = label;
                return;
            }
        });
    });

    return <div className="position-absolute bg-white autofill" style={{top:0}}>
        {Object.keys(filteredOptions).map(option => <>
            <div className="autofill-option" onClick={() => onSelect(option)}>
                <p>{options[option]}</p>
                <hr/>
            </div>
        </>)}
    </div>
};

export const PropControlGender = ({path, prop, ...props}) => {
    
    const [showAutofill, setShowAutofill] = useState(false);
    const [typedVal, setTypedVal] = useState("");

    return <div className="form-control prop-control-gender position-relative">
        <PropControlPills path={path} prop={prop} onType={val => setTypedVal(val)} onFocus={() => setShowAutofill(true)} onBlur={() => setShowAutofill(false)} {...props}/>
        {showAutofill && <Autofill value={typedVal} options={DEFAULT_GENDER_LABELS} onSelect={() => {}}/>}
    </div>
};

export const PropControlPronoun = ({path, prop, ...props}) => {

};

/**
 * See Ego.js for more information
 * @param {*} param0 
 */
const PropControlEgo = ({path, prop, saveFn, style, className, ...props}) => {
    


};

export default PropControlEgo;
