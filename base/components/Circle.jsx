
import React from 'react';
import { space } from '../../base/utils/miscutils';


const centerStyle = { display: 'flex', alignItems: 'center', justifyContent: 'center' };


/**
 * Put the children in a circle.
 * @param {Object} p
 * @param {?String} p.circleCrop Set to e.g. "50%" to shrink the contents so they fit in the circle. Defaults to 75%
 * @param {?Boolean} p.center If set, center the contents in the circle, and use text-align:center.
 */
 const Circle = ({color = 'white', border = '2px solid black', children, circleCrop = '75%', width, height, style: extraStyle, className, center}) => {
	const style = { borderRadius: '50%', border, width, height, ...extraStyle };

	if (center) Object.assign(style2, centerStyle);

	// shrink the contents to fit in the circle?
	const contentStyle = {
		flexDirection: 'column',
		textAlign: 'center',
		width: circleCrop,
		height: circleCrop,
		...centerStyle
	};

	return <div style={style} className={space(color && `bg-${color}`, className)}>
		<div style={contentStyle}>{children}</div>
	</div>;
};


export default Circle;
