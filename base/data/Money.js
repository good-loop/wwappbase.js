/**
	Money NB: based on the thing.org type MonetaryAmount
	TODO It'd be nice to make this immutable (can we use Object.freeze to drive that thrgough??)
*/
import {assert, assMatch} from 'sjtest';
import {asNum} from 'wwutils';
import DataClass, {getType} from './DataClass';
import C from '../CBase';

/** impact utils */
class Money extends DataClass {
	/** {Number} 1/100 of a penny, so £1 = 10,000 */
	value100p;
	currency = 'GBP'; // default

	constructor(base) {
		super(base);
		Money.value(this); // init v100p from value
	};
}

const This = Money;
export default Money;

/* 

{
	currency: {String}
	value: {String|Number} The Java backend stores values as String and uses BigDecimal to avoid numerical issues.
	The front end generally handles them as Number, but sometimes as String.
}

*/
// ref: https://stackoverflow.com/questions/18082/validate-decimal-numbers-in-javascript-isnumeric
const isNumeric = value => {
	return ! isNaN(value - parseFloat(value));
};

/**
 * 
 * @param {?Money} ma If null, returns 0
 * @returns {Number}
 */
Money.value = ma => {
	// if(ma && ma.value === '') return '';
	return v100p(ma) / 10000;
};

/**
 * 
 * @param {!Money} m 
 * @param {!Number|falsy} newVal Can be null or '' for unset -- which will produce a value of 0
 * @returns {Money} value and value100p set to newVal
 */
Money.setValue = (m, newVal) => {
	Money.assIsa(m);
	if (newVal) assMatch(newVal, Number, "Money.js - setValue() "+newVal);
	m.value = newVal;
	m.value100p = newVal? newVal * 10000 : 0; // NB: null x Number = 0 nut undefined x Number = NaN. So let's standardise on 0
	// remove the raw field 'cos otherwise v100p() will use it to overwrite the new value!
	delete m.raw;
	if (Money.value(m) != newVal) {
		console.warn("Money.js - setValue() mismatch "+newVal+" != "+Money.value(m), m);
	}
	return m;
};

/**
 * @param m If null, return 0. The canonical field is `value100p` but this method will also read `value`
 * @returns {Number} in hundredth of a penny. Defaults to 0.
 */
const v100p = m => {
	if ( ! m) return 0;
	// Patch old server data?
	if (m.value100) {
		if ( ! m.value100p && ! m.raw) m.value100p = m.value100 * 100;
		delete m.value100; // remove so it cant cause confusion esp if value becomes 0
	}
	// historical bug, seen April 2018 in SoGive: value edits lost! But preserved in .raw
	if (m.raw) {
		try {
			let v = asNum(m.raw);
			m.value = v;
			m.value100p = v? v*10000 : 0;
		} catch(err) {
			console.warn("Money.js", err, m);
		}
	}
	// end of patching
	if (m.value100p) {
		return m.value100p;
	}
	if (m.value) {
		let v = parseFloat(m.value); // string or number
		m.value100p = v * 10000;
		return m.value100p;
	}
	return 0;
};



/** duck type: needs a value or currency */
Money.isa = (obj) => {
	if ( ! obj) return false;
	if (isa(obj, C.TYPES.Money)) return true;
	// OLD format
	if (getType(obj) === 'MonetaryAmount') return true;	
	if (obj.value100p) return true;
	if (obj.value100) return true;
		// allow blank values
	if (isNumeric(obj.value) || obj.value==='') return true;
	if (obj.currency) return true;
	return false;
};

Money.str = obj => (Money.CURRENCY[obj.currency]||'') + Money.value(obj);

/**
 * currency code to everyday symbol
 */
Money.CURRENCY = {
	GBP: "£",
	USD: "$"
};

/**
 * @deprecated -- use new Money()
 * @param base e.g. £1 is {currency:'GBP', value:1}
 * WARNING - only pass in one definition of value, or you may get odd behaviour!
 */
Money.make = (base = {}) => {
	let item = new Money(base);
	return item;
};

/**
 * Check currencies match. Case insensitive.
 */
const assCurrencyEq = (a, b, msg) => {
	const m = "Money.js assCurrencyEq "+(msg||'')+" a:"+JSON.stringify(a)+"  b:"+JSON.stringify(b);
	Money.assIsa(a, m);
	Money.assIsa(b, m);
	// allow no-currency to padd
	if ( ! a.currency || ! b.currency) {
		return true;
	}
	assert(typeof(a.currency) === 'string' && typeof(b.currency) === 'string', m);
	assert(a.currency.toUpperCase() === b.currency.toUpperCase(), m);
};

/** Will fail if not called on 2 Moneys of the same currency
 * @returns {Money} a fresh object
 */
Money.add = (amount1, amount2) => {	
	Money.assIsa(amount1);
	Money.assIsa(amount2);
	assCurrencyEq(amount1, amount2, "add()");
	const b100p = v100p(amount1) + v100p(amount2);
	return moneyFromv100p(b100p, amount1.currency || amount2.currency);
};

/**
 * Convenience to process the results from arithmetic ops, without the gotchas of make() keeping bits of stale data
 * @param {*} b100p 
 * @param {*} currency 
 */
const moneyFromv100p = (b100p, currency) => {
	const res = {
		currency: currency,
		value: b100p/10000,
		value100p: b100p
	};
	const m = Money.make(res);	
	return m;
};

Money.total = amounts => {
	// assMatch(amounts, "Money[]", "Money.js - total()");
	let zero = Money.make();
	Money.assIsa(zero);
	let ttl = amounts.reduce( (acc, m) => {
		if ( ! Money.isa(m)) {
			console.warn(new Error("Money.total() - Not Money? "+JSON.stringify(m)), amounts);
			return acc;
		}
		return Money.add(acc, m);
	}, zero);
	return ttl;
};

// Will fail if not called on 2 Moneys of the same currency
Money.sub = (amount1, amount2) => {
	Money.assIsa(amount1);
	Money.assIsa(amount2);
	assCurrencyEq(amount1, amount2, "sub");
	const b100p = v100p(amount1) - v100p(amount2);
	return moneyFromv100p(b100p, amount1.currency || amount2.currency);
};

/** Must be called on a Money and a scalar */
Money.mul = (amount, multiplier) => {
	Money.assIsa(amount);
	assert(isNumeric(multiplier), "Money.js - mul() "+multiplier);
	// TODO Assert that multiplier is numeric (kind of painful in JS)
	const b100p = v100p(amount) * multiplier;
	return moneyFromv100p(b100p, amount.currency);
};

/** 
 * Called on two Moneys
 * @returns {Number}
 */
Money.divide = (total, part) => {
	Money.assIsa(total);
	Money.assIsa(part);
	assCurrencyEq(total, part);
	return Money.value(total) / Money.value(part);
};

/**
 * get/set an explanation text
 * This is transient - it is NOT saved by Money.java
 * @returns {?String}
 */
Money.explain = (money, expln) => {
	Money.assIsa(money);
	if (expln) money.explain = expln;
	return money.explain;
};
