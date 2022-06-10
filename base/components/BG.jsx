
import React from 'react';
import { addImageCredit } from './AboutPage';
import ImageObject from '../data/ImageObject';

/**
 * Drops a background image behind the children.
 * See: https://studio.good-loop.com/#bg
 * 
 * See also: BGImg in AdUnit
 * 
 * @param {Object} p
 * @param {?ImageObject|string} p.image If image.author is provided, a (cc) credit is shown in the bottom-right.
 * @param {?boolean} p.fullscreen
 * @param {?number} p.top rect top position
 * @param {?number} p.bottom rect bottom position
 * @param {?number} p.left rect left position
 * @param {?number} p.right rect right position
 * @param {?string} p.size cover|contain|fit How to size the background image. Fit means stretch to fit
 * @param {?number} p.opacity [0-100] ONLY works for fullscreen backgrounds
 * @param {?string} p.color css background colour
 * @param {?boolean} p.fitToImage arrange so that the container sizes itself to the image size, while remaining in the background
 * @param {?boolean} p.center center the image
 * @param {?number} p.ratio percentage ratio height:width, if set will maintain size ratio from width
 * @param {?string} p.minHeight min height of the BG
 */
const BG = ({image, color, src, children, size='cover', top=0, left=0, right=0, bottom=0, repeat, fullscreen, opacity, style, className, fitToImage, center, ratio, minHeight}) => {
	if (size==='fit') size = "100% 100%";
	if (image) {
		src = typeof(image)==='string'? image : image.url;
		addImageCredit(image);
	}
	let credit = image && image.author? <div className='img-credit'><small>{image.name} image (cc) by {image.author}</small></div> : null;
	if ( ! fullscreen) {
		// TODO opacity for the bg without affecting the content 
		// NB: position relative, so the (cc) credit can go bottom-right
		if (!fitToImage) {
			return (<div style={{
							backgroundImage: `url('${src}')`,
							backgroundSize: size, 
							backgroundPosition:center ? 'center' : null,
							backgroundRepeat: repeat,
							position: image&&'relative', ...style,
							paddingBottom: ratio ? `${ratio}%` : null,
							minHeight: minHeight ? minHeight : null,
						}}
						className={className}>
				{children}
				{credit}
			</div>);
		} else {
			return (<div style={{position:"relative", ...style}} className={className}>
				<img src={src} className='w-100 position-absolute'/>
				{children}
				{credit}
			</div>)
		}
	}
	// NB: z-index only works on positioned elements
	let baseStyle= {
		backgroundImage: src? `url('${src}')` : null,
		backgroundColor: color,
		backgroundSize: size,
		backgroundRepeat: repeat,
		backgroundPosition: center ? 'center' : null,
		position: fullscreen? 'fixed' : 'absolute',
		opacity,
		top:top,left:left,right:right,bottom:bottom,
		zIndex: -1
	};
	// Assign custom style overrides
	if (style) Object.assign(baseStyle, style);
	
	return (<>
		<div className='BG-img' style={baseStyle} className={className}/>
		{children}
		{credit}
	</>);
};
export default BG;
