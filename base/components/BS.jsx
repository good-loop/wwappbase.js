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
 * Convenience for doing base-css-class + optional-extra-css-class
 */
const join = (...strings) => strings.filter(s => s).join(' ');

/**
 * Turns eg { prefix: 'col', sep: '-', lg: 2, md: 1 } into 'col-lg-2 col-md-1'
 * Useful for Bootstrap context-sensitive sizing - used by Col in BS3.jsx
 */
const classes = ({ prefix, sep = '', dflt, ...props }) => {
	if (!props) return dflt;
	let entries = Object.entries(props);
	
	return entries.reduce((acc, [key, val], i) => (
		acc + (i > 0 ? ' ' : '' + prefix + sep + key + sep + val)
	), '') || dflt;
};

/**
 * NB: Some elements are identical - they are defined in BS3
 */

export {
	join,
	classes
}
