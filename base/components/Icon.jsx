import React from 'react';

/**
 * TODO standardise use of icons and emojis
 */

 const EMOJI = {
	 trashcan: "&#x1f5d1;"
 };
 
 /**
  * 
  * @param {Object} p
  * @param {?Boolean} p.color true = use the icon's natural colours if possible
  * @param {?String} p.size xs|sm|lg|xl
  */
const Icon = ({name,size,className,color}) => {
	if (EMOJI[name]) {
		if (color===true) return EMOJI[name];
		return <span className={space("emoji",className)}>{EMOJI[name]}</span>; // TODO color off
		// color: transparent;  
  		// text-shadow: 0 0 0 red; < bleurgh we'll want a few rules, e.g. the BS colour classes
	}
	let url;
	if (name === C.app.service) {
		url = C.app.logo;
	}
	// Social media - We can handle these services with FontAwesome icons
	if ('twitter facebook instagram'.indexOf(name !== -1)) {
		url = '/img/' + service + '-logo.svg';
		if (service === 'instagram') file = '/img/instagram-logo.png'; // NB (Instagram's mesh gradient can't be done in SVG)
	}

	let classes = 'rounded logo' + (size ? ' logo-' + size : '');
	if (url) {
		return <img alt={service} data-pin-nopin="true" className={classes} src={url} />;
	}
};

export default Icon;
