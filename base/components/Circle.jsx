
import React from 'react';
import { space } from '../../base/utils/miscutils';

/**
 * Put the childrem in a circle.
 * @param {Object} p
 * @param {?String} p.circleCrop Set to e.g. "50%" to shrink the contents so they fit in the circle. Defaults to 75%
 */
 const Circle = ({color="white",border="2px solid black",children,circleCrop="75%",width,height,style,className,center}) => {
    let style2 = Object.assign({width,height,border,borderRadius:"50%"}, style);
    const centering = {display:"flex",alignItems:"center",justifyContent:"center"};
    if (center) {
        Object.assign(style2, centering);
    }
	// shrink the contents to fit in the circle?
	let contentStyle = Object.assign({
		width: circleCrop,
		height: circleCrop,
        flexDirection: "column"
	}, centering);
    return <div style={style2} className={space(color && "bg-"+color, className)}><div style={contentStyle}>{children}</div></div>;
};

export default Circle;
