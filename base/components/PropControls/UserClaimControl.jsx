import React, { useEffect } from 'react';
import { assert } from '../../utils/assert';
import PropControl from '../PropControl';
import Login from '../../youagain';
import DataStore from '../../plumbing/DataStore';
import Person, { getProfile, getClaimValue, setClaimValue, savePersons, getPVClaim } from '../../data/Person';
import { getDataItem } from '../../plumbing/Crud';

const USER_WIDGET_PATH = ['widget', 'UserClaimControl'];
const SAVE_PERSONS_DELAY = 500;

/**
 * Set a claim value on a person locally
 * @param {String} key 
 * @param {String|Boolean|Number} value 
 */
 export const setPersonSetting = ({xid, key, value, consent, callback}) => {
	assMatch(key, String, "setPersonSetting - no key");
	assMatch(value, "String|Number|Boolean");
    // Set to logged in user if no xid specified - this check is done in UserClaimControl but needs to be here if its used in an exported context
    if (!xid) xid = Login.getId();
	assert(xid, "setPersonSetting - no login");
	let pvp = getProfile({ xid });
	let person = pvp.value || pvp.interim;
	assert(person, "setPersonSetting - no person", pvp);
	console.log("setPersonSetting", xid, key, value, person);
	setClaimValue({ person, key, value, consent });
	DataStore.update();
    savePersonSettings({xid, callback});
};

/**
 * Returns the path to the widget value of a prop
 * If no prop specified, gives path to all user widget props of xid
 * @param {?String} xid 
 * @param {?String} prop
 * @returns 
 */
export const getPersonWidgetPath = ({xid, prop}) => {
    if (!xid) xid = Login.getId();
    assert(xid, 'getPersonWidgetPath must have xid or be logged in!');
    let userWidgetPath = USER_WIDGET_PATH.concat(xid);
    if (prop) userWidgetPath = userWidgetPath.concat(prop);
    return userWidgetPath;
}

/**
* Get a claim value from profiler. See also: the more sophisticated getPVClaim()
* @param {String} key 
* @returns {String|Number} the claim value. Warning: This may be an interim blank which can then change on data load
*/
export const getPersonSetting = ({key, xid}) => {
   if (!xid) xid = Login.getId();
   assert(xid, 'getPersonSetting requires an xid or to be logged in!');
   let pvp = getProfile({xid});
   let person = pvp.value || pvp.interim;
   return getClaimValue({person, key});
}

// FIXME buggy
export const getEmail = () => {
    let person = getProfile().value;
	let email = Person.getEmail(person);

    return email
}

/**
 * Get the charity promise value if it exists
 * @returns pvCharity or null
 */
export const getCharityObject = () => {
    const cid = getPersonSetting({key:"charity"});
    if (!cid) {
        console.warn("getCharityObject - no charity id");
        return null;
    }
    let pvCharity = getDataItem({ type: 'NGO', id: cid });
    return pvCharity;
}

/**
 * Debounced save all current local edits to server
 * @param {Function} callback triggers once save is complete
 */
const savePersonSettings = _.debounce(({xid, callback}) => {
	assert(xid, "savePersonSettings must have an XID!");
	let pvp = getProfile({xid});
	let person = pvp.value || pvp.interim;
	const pv = savePersons({ person });
	pv.promise.then(re => {
		console.log("... saved person settings");
		callback && callback();
	}).catch(e => {
		console.error("FAILED PERSON SAVE", e);
	});
}, SAVE_PERSONS_DELAY);

/**
 * A wrapper for PropControl that saves to a user's profile instead of DataStore.
 * (It does save to DataStore internally, the path of which can be found with getPersonWidgetPath)
 * 
 * WARNING: user claims are only known to work on string, boolean and number values.
 * If you find a complex PropControl failing with UserClaimControl, add to the json_types list
 * @param {Object} p
 * @param {String} p.prop
 * @param {?String} p.xid
 * @param {?Function} p.saveFn NOT used
 * @param {?String[]} p.privacyOptions If set, show a choice of privacy levels
 * @param {?String[]} p.privacyLabels labels for privacyOptions
 * @param {?String} p.privacyDefault for privacyOptions
 * @returns 
 */
const UserClaimControl = ({prop, xid, privacyOptions, privacyLabels, privacyDefault, saveFn, ...props}) => {
	assert( ! saveFn) // TODO delete if not used
    if (!xid) xid = Login.getId();
    assert(xid, 'UserClaimControl if no xid is specified, must be logged in! ' + xid);
    assert(prop, 'UserClaimControl must have a prop');

    if (props.path) {
        console.warn("UserClaimControl saves to profiler which does not use path, it will be ignored!");
        delete props.path;
    }

    const controlPath = getPersonWidgetPath({xid});

    // HACK - build options and labels before json type checkboxes, not in PropControl
    if (prop === 'causes') {
        props.options = ["culture", "education", "health", "community", "environment", "civil rights", "animals", "research", "international"]; // See NGO.CATEGORY
        props.labels = ["Arts and Culture", "Education", "Health", "Community Development", "Environment", "Civil Rights", "Animals", "Science and Research", "International Development"];
    } else if (prop === 'adstype') {
        props.options = ["fashion", "food", "sports", "technology", "games", "travel", "health", "business"]; // are there IAB labels for these??
        props.labels = ["Fashion", "Food and Drink", "Sports", "Technology", "Gaming", "Travel", "Healthy Living", "Business"];
    }

	// TODO is this needed? What is a specific example where it occurs?
    // Complex value handling by parsing to and from JSON
    // These PropControl types require complex data handling (add to this list if you find a PropControl type failing on UserClaimControl)
    const json_types = [
        "date",
        "arraytext",
        "keyset",
        "entryset",
        "address",
        "postcode",
        "json",
        "keyvalue",
        "pills",
        "checkboxes",
        "checkboxArray",
        "checkboxObject",
        "DataItem",
        "Money",
    ];
    const isJsonType = json_types.includes(props.type);

    const formatValue = (value) => {
        // Covers all 5 primitive data types - if it's not this, it must be complex
        if (_.isString(value) || _.isNumber(value) || _.isBoolean(value) || !value) return value;
        let jsonValue;
        try {
            jsonValue = JSON.stringify(value);
            return jsonValue;
        } catch (e) {
            // If it's not primitive or JSON parseable, then huh???
            console.error("UserClaimControl value is not basic or JSON compatible??");
            return value;
        }
    }

	/** @returns parse if isJsonType */
    const parseValue = (value) => {
        // We can't implicitly tell if a prop value is meant to be JSON parsed or just a string that happens to be parseable, which could break PropControl -
        // Ideally we could tell if we need JSON parsing by type, but there's a lot of them, so for now just use 'json' prop if UserClaimControl doesn't work with the type by default
        if (isJsonType) {
            try {
                let obj = JSON.parse(value);
                return obj;
            } catch (e) {
                return value;
            }
        }
		return value;
    }

	// What is the claim?
	let pvClaim = getPVClaim({key:prop, xid});
	let storedValue = Claim.value(pvClaim);
	const parsedValue = parseValue(storedValue); // NB no harm doing this repeatedly, and useEffect was causing an issue, April 2022
	DataStore.setValue(controlPath.concat(prop), parsedValue, false);

	// should save to server (done in setPersonSettings) be automatic, or only when a submit button is pressed??	
    const fullSaveFn = ({event}) => {
		// NB: Can be called by either the value or consent part of the control.
        let newClaimValue = DataStore.getValue(controlPath.concat(prop));
		let saveValue = formatValue(newClaimValue);
		let consent = null;
		if (privacyOptions) consent = DataStore.getValue(controlPath.concat(prop+"-privacy"));
		// privacy
        setPersonSetting({xid, key:prop, value:saveValue, consent});
    };

    return <>
		<PropControl path={controlPath} prop={prop} saveFn={fullSaveFn} {...props}/>
		{privacyOptions && <PropControl path={controlPath} prop={prop+"-privacy"} type="select" label="Usage Level" 
			saveFn={fullSaveFn}
			options={privacyOptions} labels={privacyLabels} dflt={privacyDefault} />}
	</>;
}

export default UserClaimControl;
