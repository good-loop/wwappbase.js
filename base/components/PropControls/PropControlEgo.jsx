import React from 'react';
import { Button } from 'reactstrap';
import PropControlPills from '../PropControlPills';

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

export const PropControlGender = ({path, prop, ...props}) => {
    
    return <div className="d-flex flex-row">
        <PropControlPills path={path} prop={prop} {...props}/>
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
