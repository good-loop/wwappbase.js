
import {assert, assMatch} from 'sjtest';
import {isa, defineType, getType} from './DataClass';
import Enum from 'easy-enums';

const JSend = defineType('JSend');
const This = JSend;
export default JSend;

const KAjaxStatus = new Enum("success fail error");

/**
 * 
 * @param {*} jobj 
 * @returns {KAjaxStatus String} success | error | fail
 */
JSend.status = jobj => jobj.status || (jobj.success===true && 'success') || (jobj.success===false && 'error');

JSend.success = jobj => {
	if (jobj.success===true) return true;
	if (jobj.success===false) return false;

	if (jobj.status===KAjaxStatus.success) return true;
	if (jobj.status===KAjaxStatus.fail || jobj.status===KAjaxStatus.error) return false;

	console.warn("JSend: status unknown", jobj);
	return null;
};

JSend.message = jobj => {
	if (jobj.message) return jobj.message;

	if (jobj.errors) {
		let m = jobj.errors[0];
		if (typeof(m)==='string') return m;
		return m.text || JSON.stringify(m);
	} 
	
	return null;
};

