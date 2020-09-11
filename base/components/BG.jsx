
import React from 'react';

/**
 * Drops a background image behind the children.
 * See: https://studio.good-loop.com/#bg
 * @param {?ImageObject} image
 * @param {?string} size cover|contain|fit Fit means stretch to fit
 * @param {?string} height defaults to auto, which should take its size from the children.
 * Note: don't use height:"100%" unless the surrounding element has a fixed height! Otherwise this will render a background of 0 height.
 */
const BG = ({image, src, children, opacity=0.5, size='cover', height='auto', minHeight, fullscreen}) => {
	if (size==='fit') size = "100% 100%";
	if (image) src = image.url;
	let style= {
		backgroundImage: `url('${src}')`,
		backgroundSize: size,
		height:"100%", width:"100%",
		position: fullscreen? 'fixed' : 'absolute',
		top:0,left:0,right:0,bottom:0,
		zIndex: -1,
		opacity
	};
	// NB: the outer div with position relative avoids the whole thing being absolute
	// NB: the middle outer div with position abs seems to be needed to properly get full-size (oddities seen in chrome August 2020)	
	return (<div style={{position:'relative', width:'100%',minHeight, height}}>
		{/* <div style={{position:'absolute', width:'100%', height, top:0, left:0}} > */}
		<div style={style} />
		<div style={{zIndex:100}}>{children}</div>
		{image && <div className='img-credit'><small>{image.name} image (cc) by {image.author}</small></div>}
	{/* </div> */}
	</div>);
};
export default BG;
