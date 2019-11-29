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
 * Convenience for doing base-css-class + optional-extra-css-class
 * The call to flat() means you can pass an arg list or an array OR multiple arrays
 * ...but not more than 1 layer deep without changing it to flat(2) etc
 */
const join = (...strings) => strings.filter(s => !!s).join(' ');

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
	join,
	classes
}
