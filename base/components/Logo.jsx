
import React from 'react';
import { space, ellipsize } from '../utils/miscutils';
import DataClass, {getName} from '../data/DataClass';
import { assert } from '../utils/assert';
/**
 * Logo from branding (also handles NGOs)
 * @param {Object} p
 * @param {DataClass} p.item
 */
const Logo = ({item, className, size, style, nameCap=24}) => {
	if (! item) return null;
    assert(item.id, "Not a DataItem", item);
    // get branding
    let branding = item.branding || item; // HACK: NGOs have .logo on the item
    let altText = item.displayName || item.name || item.id;
    if (nameCap) altText = ellipsize(altText, nameCap);
    if ( ! branding.logo) {            
        return <span className={space(className, "logo", size&&"logo-"+size)} style={style}>{altText}</span>; // fallback to their name
    }
    // Check for SVG and use specific width if so
	let svgClasses="";
	let imgType = /^.*\.([a-zA-Z]*).*$/g.exec(branding.logo);
	if (imgType) {
		imgType = imgType[1];
		if (imgType.toLowerCase() === "svg") {
			svgClasses = "w-100"; // width 100?? won't that make it giant in the wrong setting??
		}
	}
	// 'logo' class forces the logos to be too small for the circle - so leaving it out	
    return <img className={space(className, "logo", size&&"logo-"+size, svgClasses)} 
        style={style} src={branding.logo} alt={altText} />;
};

export default Logo;
