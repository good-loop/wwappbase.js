import React from 'react';
import { space } from '../utils/miscutils';

/**
 * TODO standardise use of icons and emojis
 */

 /**
  * See https://unicode-table.com/
  */
 const EMOJI = {
	 trashcan: "🗑", //&#x1f5d1;
	 info: "🛈", // ℹ or 🛈
	 ".txt":"🖹",
 };
 
 /**
  * 
  * @param {Object} p
  * @param {?Boolean} p.color true = use the icon's natural colours if possible
  * @param {?String} p.size xs|sm|lg|xl
  */
const Icon = ({name,size="sm",className,color,...props}) => {
	if (EMOJI[name]) {
		if (color===true) return <span dangerouslySetInnerHTML={{__html:EMOJI[name]}} {...props} />;
		return <span className={space("emoji",className)} dangerouslySetInnerHTML={{__html:EMOJI[name]}} {...props} />; // TODO color off
		// color: transparent;  
  		// text-shadow: 0 0 0 red; < bleurgh we'll want a few rules, e.g. the BS colour classes
	}
	let url;
	if (name === C.app.service) {
		url = C.app.logo;
	}
	// Social media
	if ('twitter facebook instagram google-sheets'.indexOf(name !== -1)) {
		url = '/img/gl-logo/external/' + name + '-logo.svg';
		if (name === 'instagram') file = '/img/gl-logo/external/instagram-logo.png'; // NB (Instagram's mesh gradient can't be done in SVG)
	}

	let classes = 'rounded logo' + (size ? ' logo-' + size : '');
	if (url) {
		return <img alt={name} data-pin-nopin="true" className={classes} src={url} {...props} />;
	}
};

export default Icon;
