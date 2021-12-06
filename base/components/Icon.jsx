import React from 'react';
import { space } from '../utils/miscutils';

/**
 * TODO standardise use of icons and emojis
 */

 /**
  * See https://unicode-table.com/
  * https://www.unicode.org/emoji/charts/full-emoji-list.html
  */
const EMOJI = {
	camera: "📷",
	copy: "⎘",
	clipboard: "📋",
	globe: "🌍",
	hourglass: "⏳",
	info: "🛈", // ℹ or 🛈
	intray: "📥",
	memo: "📝",
	outtray: "📤",
	plus: "⨁", // ⊕
	search: "🔍",
	tick: "✔",
	trashcan: "🗑", //&#x1f5d1;
	".txt":"🖹",
 };
/**
 * Hack: list a few icons here.
 * We should prob standardise on an icon font - see https://getbootstrap.com/docs/5.0/extend/icons/#bootstrap-icons
 */
 const ICONS = {
	download: "https://icons.getbootstrap.com/assets/icons/download.svg"
 }
 
 /**
  * 
  * @param {Object} p
  * @param {?String} p.name camera|trashcan|memo etc
  * @param {?String} p.color black|white|grey
  * @param {?String} p.size xs|sm|lg|xl
  */
const Icon = ({name,size="sm",className,color,...props}) => {
	if (EMOJI[name]) {
		if (color && ! ['black','white','grey'].includes(color)) {
			console.warn("Icon.jsx color not directly supported: "+color+" Icons can only reliably use a few set colors cross-device.");
		}
		// see Icon.less
		return <span className={space("emoji", color&&"emoji-"+color, size&&"logo-"+size, className)} dangerouslySetInnerHTML={{__html:EMOJI[name]}} {...props} />;
	}
	let url;
	if (name === C.app.id) {
		url = C.app.logo;
	}
	// Social media
	if ('twitter facebook instagram chrome google-sheets github linkedin'.indexOf(name) !== -1) {
		url = '/img/gl-logo/external/' + name + '-logo.svg';
		if (name === 'instagram') url = '/img/gl-logo/external/instagram-logo.png'; // NB (Instagram's mesh gradient can't be done in SVG)
	}
	if ( ! url) url = ICONS[name];

	let classes = 'rounded logo' + (size ? ' logo-' + size : '');
	if (url) {
		return <img alt={name} data-pin-nopin="true" className={classes} src={url} {...props} />;
	}
	console.warn("No icon for "+name);
	return null;
};

export default Icon;
