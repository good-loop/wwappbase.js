
// See test code: test.promise.value.js

/**
 * {value: ?Object, promise: !Promise, error: ?Object, resolved: boolean} 
* The promise part is always set.
* The behaviour depends on the valueOrPromise passed to the constructor:
*  - If it's a value -> resolved Promise
*  - If it's a Promise (or thenable) -> the input Promise
*  - null/undefined -> rejected Promise
* 
* The `value` and `error` properties will be set instantly if known, and otherwise set when the promise resolves.
* The `resolved` flag records the promise status, and changes to true once the promise is resolved.
 */
class PromiseValue {
	/** @type {?Error} 
	 * NB: This can use an ersatz {message,name} object. */
	error;
	/** 
	 * @type {?Object} an interim value for value, e.g. a local memory whilst we fetch a fresh value from the server
	*/
	interim;
	/** @type {!Promise} */
	promise;
	/** @type {!boolean} */
	resolved;
	/** 
	 * @type {?any} The result from the promise.
	 * 
	 * Note: If pending() is used, then is possible for `value` to be null. 
	*/
	value;

	/** @type {?Function} Only set by `PromiseValue.pending` Call this with a value to resolve the PV. */
	resolve;
	/** @type {?Function} Only set by `PromiseValue.pending` Call this with an error to reject the PV. */
	reject;

	/** @type {boolean} Is this value out of date? Set by DataStore if using a cache-period. `true` indicates that a refresh should be in progress. */
	stale;

	/** @type {PromiseValue} Internal property for PromiseValue.then() */
	_then;

	/**
	 * @param {?Object|Promise} valueOrPromise If null, the PV will have a rejected promise and an error.
	 * @returns {value: ?Object, promise: !Promise, error: ?Object, resolved: boolean} 
	 *  The return is never null, and the promise part is always set.
	 * 	The behaviour depends on valueOrPromise:
	 * 	 - If it's a value -> resolved Promise
	 *   - If it's a Promise (or thenable) -> the input Promise
	 * 	 - null/undefined -> rejected Promise
	 * 	 - PromiseValue -> copy out the promise/value (probably a mistake but handle it gracefully)
	 * 
	 * The `value` and `error` properties will be set instantly if known, and otherwise set when the promise resolves.
	 * The `resolved` flag records the promise status, and changes to true once the promise is resolved.
	 */
	constructor(valueOrPromise) {
		// Sanity check the input: Has someone mistakenly passed in a PromiseValue?
		if (valueOrPromise instanceof PromiseValue) {
			console.warn("Double wrapped PromiseValue", valueOrPromise);
			// Hm -- keep on trucking?? Or would it better to throw an error?
			valueOrPromise = valueOrPromise.value || valueOrPromise.promise;
		}
		if (valueOrPromise === null || valueOrPromise === undefined) {
			// NB: new Error() is Misleadingly noisy in the console - So use an ersatz error instead (which is still noisy, but as bit less)
			const e = {message:"null value for PromiseValue", name:"Error"};
			this.error = e;
			this.promise = Promise.reject(this.error);
			this.resolved = true; // NB: resolved:true and no value implies an error
			return;
		}
		// NB: Promise.resolve() can be used with Promises without nesting	
		if (typeof (valueOrPromise.then) === 'function') {
			// Having then() is the only real requirement for a Promise
			const vp = this;
			this.resolved = false;
			// set the value when we have it
			// NB: the promise we expose is _after_ resolved and value gets set
			let _promise = valueOrPromise.then(
				function (r) {
					// Warning: this on-success function will also be called if the server
					// returns a code 200 (OK http) but {status:error} (JSend error) response.
					// Handling this should be done in the Ajax layer.

					if (PromiseValue.isa(r)) { // unwrap? (what triggers this??)
						if ( ! r.resolved) {
							console.error("promise done but nested pv not resolved??", r);
						}
						r = r.value;
					}
					vp.value = r;
					vp.resolved = true;
					return r;
				},
				function (err) {
					// oh dear - store the error
					setError(vp, err);
					vp.resolved = true;
					// carry on error-handling if the promise has any catches
					throw err;
				});
			this.promise = _promise;
			return;
		}
		// It's a value - resolve now
		this.value = valueOrPromise;
		this.resolved = true;
		this.promise = Promise.resolve(valueOrPromise);
	}

};

/**
 * Convenience to call `then` on the promise and rewrap the result.
 * 
 * Be careful with calls in a React render call! These can create lots of equivalent overlapping thens.
 * 
 * Differences from `Promise.then` (added to avoid gotchas): 
 * 
 * 1. If the input is resolved, then the output is also instantly resolved. 
 * By contrast, a Promise.then in this case would start unresolved, then resolve a moment later.
 * 
 * @param {!PromiseValue} pv 
 * @param {Function} onResolve input:value
 * @param {?Function} onReject input:error
 * @returns {!PromiseValue} a new PV with the promise pv.promise.then
 */
PromiseValue.then = (pv, onResolve, onReject) => {
	assert(PromiseValue.isa(pv), pv);
	// NB: How about no action on repeated calls? No, it can lead to gotchas (we can't really test for equivalent functions)
	// Multiple .then()? just chain them
	if (pv._then) {
		// go down the chain
		return PromiseValue.then(pv._then, onResolve, onReject);
	}
	// Input is resolved? Make an already resolved response (otherwise it wouldn't resolve until a moment later)
	if (pv.resolved) {
		let pv2 = PromiseValue.pending(); // NB: this allows for thenV = null without an ugly error message in the console
		pv._then = pv2;
		if (pv.error) {
			const thenErr = onReject ? onReject(pv.error) : pv.error;
			if (PromiseValue.isa(thenErr)) {
				return thenErr;
			}
			pv2.reject(thenErr);
		} else {
			let thenV = onResolve ? onResolve(pv.value) : pv.value;
			if (PromiseValue.isa(thenV)) {
				return thenV;
			}
			pv2.resolve(thenV);
		}
		return pv2;
	}
	// ...then...
	const p2 = pv.promise.then(onResolve, onReject);
	let pv2 = new PromiseValue(p2);
	pv._then = pv2;
	return pv2;
};

/**
 * Make error formats consistent
 * @param {PromiseValue} pv 
 * @param {Error|JSend|String|Object} err 
 */
const setError = (pv, err) => {
	if (err === undefined || err === null) err = "";
	// Is it an Error? instanceof will mostly work, but not across windows -- so also do duck-typing
	// See https://stackoverflow.com/a/30469297/346629
	if (err instanceof Error || err.stack) {
		pv.error = err;
		return;
	}
	// Handle ajax xhr or JSend or String/number/whatever
	const msg = err.responseText || err.statusText || err.message || err.status || "" + err;
	pv.error = new Error('PromiseValue rejected: ' + msg);
	// JSend? Keep `data` if we have it
	pv.error.data = err.data;
};

/**
 * Create a pending PV, which you manually set to be fulfilled via pv.resolve(value) or pv.reject(error)
 * @returns {PromiseValue} pv
 */
PromiseValue.pending = () => {
	const rr = {};
	const p = new Promise((resolve, reject) => {
		rr.resolve = resolve;
		rr.reject = reject;
	});
	let pv = new PromiseValue(p);
	pv.resolve = v => {
		if (PromiseValue.isa(v)) {
			console.warn("TODO unwrap pending?", v);
		}
		pv.value = v;
		pv.resolved = true;
		rr.resolve(v);
	};
	pv.reject = err => {
		setError(pv, err);
		pv.resolved = true;
		rr.reject(err);
	};
	return pv;
};

/**
 * @param {PromiseValue|Object} valueOrPromise 
 * @returns {boolean} true if this is a ProimiseValue;
 */
PromiseValue.isa = valueOrPromise => valueOrPromise instanceof PromiseValue;

// Uncomment for release
// Hack: comment out to run test.promise-value.html
// export default PromiseValue;
