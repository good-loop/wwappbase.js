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
	seedling: "🌱",
	tick: "✔",
	trashcan: "🗑", //&#x1f5d1;
	".txt":"🖹",	
	mobile: "📱",
	desktop: "💻", // or 🖳	
 };
 const SVG = {
	 // (cc) https://icons8.com/icons/set/share
	share: <svg fill="#000000" xmlns="http://www.w3.org/2000/svg"  viewBox="0 0 30 30" width="1em" height="1em"><path d="M 23 3 A 4 4 0 0 0 19 7 A 4 4 0 0 0 19.09375 7.8359375 L 10.011719 12.376953 A 4 4 0 0 0 7 11 A 4 4 0 0 0 3 15 A 4 4 0 0 0 7 19 A 4 4 0 0 0 10.013672 17.625 L 19.089844 22.164062 A 4 4 0 0 0 19 23 A 4 4 0 0 0 23 27 A 4 4 0 0 0 27 23 A 4 4 0 0 0 23 19 A 4 4 0 0 0 19.986328 20.375 L 10.910156 15.835938 A 4 4 0 0 0 11 15 A 4 4 0 0 0 10.90625 14.166016 L 19.988281 9.625 A 4 4 0 0 0 23 11 A 4 4 0 0 0 27 7 A 4 4 0 0 0 23 3 z"/></svg>,
 }
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
		// TODO test for character support -- try this https://stackoverflow.com/a/63520666
		// see Icon.less for emoji-X 
		return <span className={space("emoji", color&&"emoji-"+color, size&&"logo-"+size, className)} dangerouslySetInnerHTML={{__html:EMOJI[name]}} {...props} />;
	}
	if (SVG[name]) {
		return SVG[name]; // ??color size as style
	}
	let url;
	if (name === C.app.id) {
		url = C.app.logo;
	}
	// Social media
	if ('twitter facebook instagram chrome edge google-sheets github linkedin safari'.indexOf(name) !== -1) {
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
