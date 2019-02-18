/**
*/

import _ from 'lodash';
import {assert, assMatch} from 'sjtest';
import {endsWith} from 'wwutils';

/*
 * Coding Style??
 * 
 * ??Would it be better to use class MyType extends DataClass??
 * And MyType only defines static methods??
 * 
 * These files are all about defining a convention, so let's set some rules??
 * 
 * Standard use

import DataClass, {getType} from './DataClass';
import C from './C';
class MyType extends DataClass {};
DataClass.register(MyType, "MyType");
// or
class MyType extends ParentType {}

const This = MyType;
export default MyType;

...custom functions

 */

// SOme useful Types
/**
 * @typedef {String} XIdString
 */
/**
 * @typedef {String} TimeString
 */


class DataClass {

	/**
	 * Sub-classes with properties/fields MUST define a constructor with the line:
	 * Object.assign(this, base);
	 * For example:
	 * ```
	constructor(base) {
		super(base);
		Object.assign(this, base);
	}
	```
	 * 
	* WARNING: IF your class defines any property values, then
	 * these take precedence over anything this base constructor does.
	 * So data could easily be lost!
	 */
	constructor(base) {
		Object.assign(this, base);
		this['@type'] = this.constructor._name || this.constructor.name;		
	}

	/**
	 * check the type!
	 */
	static isa(obj) {
		if ( ! _.isObject(obj) || obj.length) return false;
		console.warn(this, this.name);
		let typ = this;
		const sotyp = getType(obj);
		if ( ! sotyp) return false;
		if (sotyp === typ.name) return true;
		let otyp = getDataClass(sotyp);
		return isa2(otyp, typ);
	}

	static assIsa(obj, msg) {
		assert(this.isa(obj), (msg||'')+" "+this.name+" expected, but got "+JSON.stringify(obj));
	}

	/**
	* @returns {?String} An instance name, e.g. "Daniel" NOT the class name
	*
	* Note: Not all classes or instance have a name. This function is defined here as it is
	* a bit of a special case. Instances can have their own names. But you cant reassign the 
	* builtin class property `MyClass.name` = the class name, so we can't follow the fluent naming 
	* convention of X.f(x) => x.f. Hence why this is called getName(). And defined here so we 
	* can explain that once.
	*/
	static getName(obj) {
		return obj.name;
	}	

} // ./DataClass


/**
 * @param otyp {!DataClass}
 * @param typ {!DataClass}
 */
const isa2 = (otyp, typ) => {
	if ( ! otyp) return false;
	// console.warn(typ.prototype, typ.__proto__, otyp.prototype, otyp.__proto)
	if (otyp === typ) return true;
	// sub-type?
	return isa2(otyp.__proto__, typ);
};
window.isa2 = isa2; // debug

/**
 * Uses schema.org or gson class to get the type.
 * Or null
 * @param item {?any}
 * @return {?String} e.g. "Money"
 */
const getType = function(item) {
	if ( ! item) return null;
	// schema.org type?
	let type = item['@type'];
	if (type) return type;
	// Java class from FlexiGson?
	let klass = item['@class'];
	if ( ! klass) return null;
	type = klass.substr(klass.lastIndexOf('.')+1);
	return type;
};

/**
 * Prefers a plain .id but also supports schema.org @id and WW's xid.
 * null returns null
 */
const getId = (item) => {
	if ( ! item) return null;
	if (item.id && item['@id'] && item.id !== item['@id']) {
		console.warn("conflicting id/@id item ids "+item.id+" vs "+item['@id'], item);
	}
	const id = item.id || item['@id'] || item.xid;
	if ( ! id) { // sanity check that the user hasnt passed a promise or promise-value
		assert( ! item.then, "Passed a promise to getId()");
		assert( ! item.promise, "Passed a promise-value to getId()");
	}
	// e.g. Person has an array of IDs
	if (_.isArray(id)) {
		return id[0]; // HACK: use the first
	}
	return id;
};
DataClass.id = getId;

/**
 * @returns DRAFT / PUBLISHED
 * null returns null
 */
const getStatus = (item) => {
	if ( ! item) return null;
	const s = item.status;
	if ( ! s) return null;
	assert(C.KStatus.has(s), "DataClass.js getStatus", item);
	return s;
};
DataClass.status = getStatus;

/**
 * TODO move into SoGive
 * access functions for source, help, notes??
 */
const Meta = {};

/** {notes, source} if set
 * Never null (may create an empty map). Do NOT edit the returned value! */
// If foo is an object and bar is a primitive node, then foo.bar has meta info stored at foo.meta.bar
Meta.get = (obj, fieldName) => {
	if ( ! fieldName) {
		return obj.meta || {};
	}
	let fv = obj[fieldName];
	if (fv && fv.meta) return fv.meta;
	if (obj.meta && obj.meta[fieldName]) {
		return obj.meta[fieldName];
	}
	// nope
	return {};
};

/**
 * nonce vs uid? nonce is shorter (which is nice) and it avoids -s (which upset ES searches if type!=keyword)
 * @param {?Number} n Defaults to 10, which is safe for most purposes
 * @returns random url-safe nonce of the requested length.
 * 
 * Let's see:
 * 60^6 ~ 50 bn
 * But the birthday paradox gives n^2 pairings, so consider n^2 for likelihood of a clash.
 * For n = 1000 items, this is safe. For n = 1m items, 6 chars isn't enough - add a timestamp to avoid the all-to-all pairings.
 */
const nonce = (n=10) => {
	const s = [];
	const az = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
	for (let i = 0; i < n; i++) {
		s[i] = az.substr(Math.floor(Math.random() * az.length), 1);
	}
	return s.join("");
};

// NB: cannot assign DataClass.name as that is a reserved field name for classes
DataClass.title = obj => obj && (obj.title || DataClass.getName(obj.name));
DataClass.str = obj => JSON.stringify(obj);

/**
 * @param typeOrItem {String|Object} If object, getType() is used
 * @returns {?DataClass} the DataClass if defined for this type
 */
const getDataClass = typeOrItem => {
	if ( ! typeOrItem) return;
	if (_.isString(typeOrItem)) {
		return allTypes[typeOrItem];
	}
	let type = getType(typeOrItem);
	return allTypes[type];
};

/**
 * @param dclass {Class} the class
 * @param name {String} name, because Babel might mangle the class.name property.
 */
DataClass.register = (dclass, name) => {
	if ( ! name) {
		console.warn("DataClass.register - no name for "+dclass.name+". This is NOT safe as Babel may mangle it.")
		name = dclass.name;
	}
	assert(name);
	allTypes[name] = dclass;
	// Store the "proper" text name safe from Babel
	dclass._name = name;

	// sanity check: no non static methods
	// NB: f is defined as dclass.f => static, as does dclass.f = inherited __proto__.f
	const nonStatic = Object.getOwnPropertyNames(dclass.__proto__)
		.filter(fname => ! dclass.hasOwnProperty(fname) && dclass.__proto__[fname] !== dclass[fname]);
	assert( ! nonStatic.length, "DataClasses can only have static methods: "+name+" "+JSON.stringify(nonStatic));		
};

/**
 * Keep the defined types
 */
const allTypes = {};
// Debug hack: export classes to global! Don't use this in code - use import!
window.allTypes = allTypes
window.DataClass = DataClass;

export {getType, getId, getStatus, Meta, nonce, getDataClass};	
export default DataClass;
