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
 * @returns {!Boolean} true if the input is a JSend or WW's JsonResponse object
 */
JSend.isa = jobj => {
	if ( ! jobj) return false;
	if (jobj.cargo) return true;
	let s = JSend.success(jobj);
	if (s === null) return false;
	return true;	
};

/**
 * 
 * @param {*} jobj 
 * @returns {KAjaxStatus String} success | error | fail
 */
JSend.status = jobj => jobj.status 
	|| (jobj.success===true && 'success') || (jobj.success===false && 'error'); // WW's JsonResponse format

/**
 * Boolean alternative to status
 * @returns {?Boolean} null if the success is not provided
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

/**
 * @returns the data|cargo from a jsend response, or null
 */
JSend.data = jobj => {
	return jobj.data 
		|| jobj.cargo; // WW's JsonResponse format
};
