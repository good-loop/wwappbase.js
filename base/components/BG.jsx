
import React from 'react';

/**
 * 
 * @param {?string} size cover|contain|fit Fit means stretch to fit
 */
const BG = ({src, children, opacity=0.5, size='cover', fullscreen}) => {
	if (size==='fit') size = "100% 100%";
	let style= {
		backgroundImage: `url('${src}')`,
		backgroundSize: size,
		height:"100%", width:"100%",
		position: fullscreen? 'fixed' : 'absolute',
		top:0,left:0,right:0,bottom:0,
		zIndex: -1,
		opacity
	};
	return (<div >
		<div style={style} />
		<div style={{zIndex:100}}>{children}</div>
	</div>);
};
export default BG;
