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
 * Prune nulls and join with prefixclass space
 */
const classes = ({prefix, sep="", dflt, ...props}) => {
	let c = "";
	let keys = Object.keys(props);
	for(let i=0; i<keys.length; i++) {
		const k = keys[i];
		const v = props[k];
		if ( ! v) continue;
		c += (i===0?"":" ")+prefix+sep+k+sep+v;
	}
	if ( ! c) return dflt;
	return c;
};

/**
 * NB: Some elements are identical - they are defined in BS3
 */

export {
	classes
}
