
/**
 * Allow for Bootstrap 3 or Bootstrap 4 -- depending on what MainDiv imports
 * 
 * To initialise this, add an import to MainDiv:
 * import BS from '../base/components/BS3'; // or BS4
 * This will populate BS with actual code.
 * 
 * BS3.jsx and BS4.jsx have the same interface, so our code can work across Bootstrap versions.
 */
const BS = {};
export default BS;

/**
 * 3 or 4
 */
BS.version;

/**
 * Convenience for spacing base-css-class + optional-extra-css-class.
 * Skips falsy.
 * Recursive, so you can pass an arg list or an array OR multiple arrays.
 * @returns {!string}
 */
const space = (...strings) => {	
	let js = '';
	if ( ! strings) return js;
	strings.forEach(s => {
		if ( ! s) return;
		if (s.forEach && typeof(s) !== 'string') {
			// recurse
			s = space(...s);
			if ( ! s) return;
		}
		js += ' '+s;
	});
	return js.trim();
};
window.space = space;

/**
 * @deprecated Use `space` for clarity
 */
const join = space;

/**
 * Turns eg { prefix: 'col', sep: '-', lg: 2, md: 1 } into 'col-lg-2 col-md-1'
 * Useful for Bootstrap context-sensitive sizing - used by Col in BS3.jsx
 */
const classes = ({ prefix, sep = '', dflt, ...props }) => {
	if (!props) return dflt;
	let entries = Object.entries(props);
	let cs = entries.map(kv => kv[1]? [prefix, kv[0], kv[1]].filter(s => !!s).join(sep) : null);
	cs = cs.filter(k => k);
	return cs.length? cs.join(" ") : dflt;
};

/**
 * NB: Some elements are identical - they are defined in BS3
 */
export {
	space,
	join,
	classes
}
