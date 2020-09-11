
import React from 'react';

/**
 * Drops a background image behind the children.
 * See: https://studio.good-loop.com/#bg
 * @param {?ImageObject} image
 * @param {?string} size cover|contain|fit Fit means stretch to fit
 * @param {?string} height defaults to auto, which should take its size from the children.
 * Note: don't use height:"100%" unless the surrounding element has a fixed height! Otherwise this will render a background of 0 height.
 */
const BG = ({image, src, children, size='cover', fullscreen, opacity}) => {
	if (size==='fit') size = "100% 100%";
	if (image) src = image.url;

	if ( ! fullscreen) {
		// TODO opacity
		// NB: position relative, so the (cc) credit can go bottom-right
		return (<div style={{backgroundImage: `url('${src}')`, backgroundSize: size, position: image&&'relative'}}>
			{children}
			{image && <div className='img-credit'><small>{image.name} image (cc) by {image.author}</small></div>}
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
		{image && <div className='img-credit'><small>{image.name} image (cc) by {image.author}</small></div>}
	</>);
};
export default BG;
