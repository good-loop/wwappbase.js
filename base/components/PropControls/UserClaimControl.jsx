import React, { useEffect } from 'react';
import { assert } from '../../utils/assert';
import PropControl from '../PropControl';
import Login from '../../youagain';
import DataStore from '../../plumbing/DataStore';
import Person, { getProfile, getClaimValue, setClaimValue, savePersons } from '../../data/Person';
import { getDataItem } from '../../plumbing/Crud';
import { FormGroup } from 'reactstrap';
import { Help } from '../PropControl';

const USER_WIDGET_PATH = ['widget', 'UserClaimControl'];
const SAVE_PERSONS_DELAY = 500;

/**
 * Set a claim value on a person locally
 * @param {String} key 
 * @param {String|Boolean|Number} value 
 */
 export const setPersonSetting = ({xid, key, value, callback}) => {
	assMatch(key, String, "setPersonSetting - no key");
	assMatch(value, "String|Number|Boolean");
    // Set to logged in user if no xid specified - this check is done in UserClaimControl but needs to be here if its used in an exported context
    if (!xid) xid = Login.getId();
	assert(xid, "setPersonSetting - no login");
	let pvp = getProfile({ xid });
	let person = pvp.value || pvp.interim;
	assert(person, "setPersonSetting - no person", pvp);
	console.log("setPersonSetting", xid, key, value, person);
	setClaimValue({ person, key, value });
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
* Get a claim value from profiler
* @param {String} key 
* @returns 
*/
export const getPersonSetting = ({key, xid}) => {
   if (!xid) xid = Login.getId();
   assert(xid, 'getPersonSetting requires an xid or to be logged in!');
   let pvp = getProfile({xid});
   let person = pvp.value || pvp.interim;
   return getClaimValue({person, key});
}

export const getEmailProp = () => {
    let person = getProfile().value;
	let email = Person.getEmail(person);
    let help = "Email is set from your login. Let us know if you need to change it by contacting support@good-loop.com.";

    return (
    <FormGroup>
        <label className='mr-1'>Your Email</label>
        <Help>{help}</Help>
        <input type="text" name='email' className='form-control' value={email || ''} readOnly/>
    </FormGroup>)
}

/**
 * Get the charity object directly 
 * @returns charity object
 */
export const getCharityObject = () => {
    const cid = getPersonSetting({key:"charity"});
    let pvCharity = getDataItem({ type: 'NGO', id: cid });
    if (pvCharity.resolved) {
        return pvCharity.value;
    }
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
 * @param {String} prop
 * @param {?String} xid
 * @param {?Function} saveFn normal saveFn functionality from PropControl
 * @param {?Function} serverSaveFn a callback for after the server has also saved the user settings
 * @returns 
 */
const UserClaimControl = ({prop, xid, saveFn, serverSaveFn, ...props}) => {

    if (!xid) xid = Login.getId();
    assert(xid, 'UserClaimControl if no xid is specified, must be logged in! ' + xid);
    assert(prop, 'UserClaimControl must have a prop');

    if (props.path) {
        console.warn("UserClaimControl saves to profiler which does not use path, it will be ignored!");
        delete props.path;
    }

    const controlPath = getPersonWidgetPath({xid});

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

    const json = json_types.includes(props.type);

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

    const parseValue = (value) => {
        // We can't implicitly tell if a prop value is meant to be JSON parsed or just a string that happens to be parseable, which could break PropControl -
        // Ideally we could tell if we need JSON parsing by type, but there's a lot of them, so for now just use 'json' prop if UserClaimControl doesn't work with the type by default
        if (json) {
            let obj;
            try {
                obj = JSON.parse(value);
                return obj;
            } catch (e) {
                return value;
            }
        } else return value;
    }

    // PropControl will maintain the DataStore value JSON-friendly by default, so we only need to parse a JSON value from the saved user profile once
    useEffect(() => {
        DataStore.setValue(controlPath.concat(prop), parseValue(getPersonSetting({key:prop, xid})));
    }, [prop, xid]);

    const fullSaveFn = ({path, prop, value, event}) => {
        if (!value) value = DataStore.getValue(path.concat(prop));
        setPersonSetting({xid, key:prop, value:formatValue(value), callback:serverSaveFn});
        saveFn && saveFn({path, prop, value, event});
    }

    return <PropControl path={controlPath} prop={prop} saveFn={fullSaveFn} {...props}/>;
}

export default UserClaimControl;
