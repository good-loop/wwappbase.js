import React from 'react';
import C from '../CBase';
import { space, randomPick } from '../utils/miscutils';

/**
 * TODO standardise use of icons and emojis
 */

/**
 * See https://unicode-table.com/
 * https://www.unicode.org/emoji/charts/full-emoji-list.html
 */
const EMOJI = {
	bug: "🐛", //🪲🐞
	camera: "📷",
	caretup:"△", // ‸⋀⋁△▽▵▾▿
	caretdown:"▽",
	circlearrow: "⟳",
	clipboard: "📋",
	genie: "🧞",
	globe: "🌍",
	help: "?", // use the normal q-mark - though we also have ❓？
	hourglass: "⏳",
	info: "ⓘ", // ℹ or 🛈
	intray: "📥",
	link:"🔗",
	memo: "📝",
	outtray: "📤",
	plus: "⨁", // ⊕
	reload: "↻", // clockwise open circle arrow ♺⥁
	scroll: "📜",
	search: "🔍",
	seedling: "🌱",
	settings: "⚙", // gear
	stopwatch: "⏱️",
	tick: "✔",
	trashcan: "🗑", //&#x1f5d1;
	".txt":"🖹",
	warning: "⚠",
	mobile: "📱",
	desktop: "💻", // or 🖳	
	yinyang: "☯️",
};


const SVG = {
	// (cc) https://icons8.com/icons/set/share
	share: <svg fill="currentColor" viewBox="0 0 30 30" width="1em" height="1em"><path d="M19.988 9.625A4 4 0 1019.094 7.836L10.012 12.377a4 4 0 10.002 5.248L19.09 22.165A4 4 0 1019.986 20.375L10.91 15.835A4 4 0 0010.906 14.166Z"/></svg>,
	// Rights with Good-Loop (5-minute inkscape sketches by RM who hereby releases etc)
	copy: <svg fill="currentColor" viewBox="0 0 100 100" width="1em" height="1em"><path d="M40 0v25H0v75h60V75h40V20L80 0H40zm5 5h32.93v17.07H95V70H45V5zM5 30H40V75h15v20H5V30z" /></svg>,
	download: <svg fill="currentColor" viewBox="0 0 100 100" width="1em" height="1em"><path d="m5 60v25h90v-25h-10v15h-70v-15z"/><path d="m42.5 15v35h-10l17.5 17.5 17.5-17.5h-10v-35z"/></svg>,
	edit: <svg fill="currentColor" viewBox="0 0 19 19" width="1em" height="1em"><path d="M15 10v7h-13v-15h9l2-2h-13v19h17v-11l-2 2zM9 7l-1 4 4-1 5-5-3-3zM17 .5c-.5-.5-1-.5-1.5 0l-1 1 3 3 1-1c.5-.5.5-1 0-1.5z" /></svg>
};


/**
 * Hack: list a few icons here.
 * We should prob standardise on an icon font - see https://getbootstrap.com/docs/5.0/extend/icons/#bootstrap-icons
 */
const ICONS = {
	// download: "https://icons.getbootstrap.com/assets/icons/download.svg"
};


/**
 * Unified interface for rendering various emoji, SVG icons, etc by name
 * @param {Object} p
 * @param {string} [p.className] className passthrough
 * @param {string} p.name camera|trashcan|memo etc
 * @param {string} [p.color] black|white|grey
 * @param {string} [p.size] xs|sm|lg|xl
 */
function Icon({name,size="sm",className,color,...props}) {
	if (name==="spinner") name = randomPick("yinyang hourglass stopwatch genie circlearrow".split(" "));
	if (EMOJI[name]) {
		if (color && ! 'black white grey success info warning danger'.includes(color)) {
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
}

export default Icon;
