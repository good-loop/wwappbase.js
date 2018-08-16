/**
 * JSend ajax wrapper. A simple format:
 * 
 * {
 * 	status: {String} "success" | "fail" | "error"
 * 	message: {?String} error message
 * 	data: {?Object} the data/value/cargo
 * }
 * 
 * This file supports BOTH JSend and Winterwell's JsonResponse format.
 */

import Enum from 'easy-enums';

const JSend = {};
export default JSend;

const KAjaxStatus = new Enum("success fail error");

/**
 * 
 * @param {*} jobj 
 * @returns {KAjaxStatus String} success | error | fail
 */
JSend.status = jobj => jobj.status 
	|| (jobj.success===true && 'success') || (jobj.success===false && 'error'); // WW's JsonResponse format

/**
 * Boolean alternative to status
 */
JSend.success = jobj => {	
	if (jobj.success===true) return true;
	if (jobj.success===false) return false;

	if (jobj.status===KAjaxStatus.success) return true;
	if (jobj.status===KAjaxStatus.fail || jobj.status===KAjaxStatus.error) return false;

	console.warn("JSend: status unknown", jobj);
	return null;
};

/**
 * Optional error message
 */
JSend.message = jobj => {
	if (jobj.message) return jobj.message;

	// WW's JsonResponse format
	if (jobj.errors) {
		let m = jobj.errors[0];
		if (typeof(m)==='string') return m;
		return m.text || JSON.stringify(m);
	} 
	
	return null;
};

JSend.data = jobj => {
	return jobj.data 
		|| jobj.cargo; // WW's JsonResponse format
};
