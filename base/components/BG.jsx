
import React from 'react';
import { addImageCredit } from './AboutPage';

/**
 * Drops a background image behind the children.
 * See: https://studio.good-loop.com/#bg
 * @param {?ImageObject} image If image.author is provided, a (cc) credit is shown in the bottom-right
 * @param {?boolean} fullscreen
 * @param {?number} top rect top position
 * @param {?number} bottom rect bottom position
 * @param {?number} left rect left position
 * @param {?number} right rect right position
 * @param {?string} size cover|contain|fit How to size the background image. Fit means stretch to fit
 * @param {?number} opacity [0-100] ONLY works for fullscreen backgrounds
 */
const BG = ({image, src, children, size='cover', top=0, left=0, right=0, bottom=0, fullscreen, opacity, style}) => {
	if (size==='fit') size = "100% 100%";
	if (image) {
		src = image.url;
		addImageCredit(image);
	}
	let credit = image && image.author? <div className='img-credit'><small>{image.name} image (cc) by {image.author}</small></div> : null;
	if ( ! fullscreen) {
		// TODO opacity for the bg without affecting the content 
		// NB: position relative, so the (cc) credit can go bottom-right
		return (<div style={{backgroundImage: `url('${src}')`, backgroundSize: size, position: image&&'relative'}}>
			{children}
			{credit}
		</div>);
	}
	// NB: z-index only works on positioned elements
	let baseStyle= {
		backgroundImage: `url('${src}')`,
		backgroundSize: size,
		position: fullscreen? 'fixed' : 'absolute',
		opacity,
		top:top,left:left,right:right,bottom:bottom,
		zIndex: -1
	};
	// Assign custom style overrides
	if (style) Object.assign(baseStyle, style);

	return (<>
		<div className='BG-img' style={baseStyle} />
		{children}
		{credit}
	</>);
};
export default BG;
