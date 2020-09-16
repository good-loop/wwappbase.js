
import React from 'react';
import { addImageCredit } from './AboutPage';

/**
 * Drops a background image behind the children.
 * See: https://studio.good-loop.com/#bg
 * @param {?ImageObject} image If image.author is provided, a (cc) credit is shown in the bottom-right
 * @param {?boolean} fullscreen
 * @param {?string} size cover|contain|fit How to size the background image. Fit means stretch to fit
 * @param {?number} opacity [0-100] ONLY works for fullscreen backgrounds
 */
const BG = ({image, src, children, size='cover', fullscreen, opacity}) => {
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
	let style= {
		backgroundImage: `url('${src}')`,
		backgroundSize: size,
		position: fullscreen? 'fixed' : 'absolute',
		opacity,
		top:0,left:0,right:0,bottom:0,
		zIndex: -1
	};
	return (<>
		<div className='BG-img' style={style} />
		{children}
		{credit}
	</>);
};
export default BG;
