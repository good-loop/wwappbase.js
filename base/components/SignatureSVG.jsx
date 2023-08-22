import React, { useEffect, useState } from 'react';
// import { Pronoun } from '../data/Ego';

const lightRed = '#af2009';
const darkRed = '#770f00';
const offBlack = '#1d1d1b';

const profilePicStyle = {
	filter: 'grayscale(100%)'
};

const textStyle = {
	fontFamily: 'Montserrat',
	fill: {offBlack},
	textTransform: 'uppercase',
	letterSpacing: '0.1em'
};


const SignatureSVG = ({name, pronouns, title, href, hideLogo, ...props}) => {
	const [svgEl, setSvgEl] = useState(null);
	const [viewBoxWidth, setViewBoxWidth] = useState(100);

	useEffect(() => {
		if (!svgEl) return;
		const { width: screenWidth, right: svgRight } = svgEl.getBoundingClientRect();
		const rightmost = Array.from(svgEl.querySelectorAll('*')).reduce((acc, el) => {
			console.log(el);
			return Math.max(el.getBoundingClientRect().right, acc);
		}, 0);
		const widthDiff = rightmost - svgRight;
		if (widthDiff < 0 && widthDiff > -1) return;
		const unitRatio = viewBoxWidth / screenWidth;
		setViewBoxWidth(prevWidth => Math.ceil(prevWidth + (widthDiff * unitRatio)));
	}, [svgEl, name, pronouns, title, hideLogo]);

	const svgRef = el => {
		if (el === svgEl) return;
		setSvgEl(el);
	};

	return <svg id="svgOutput" viewBox={`0 -178.699 ${viewBoxWidth} ${hideLogo ? '160' : '300'}`} xmlns="http://www.w3.org/2000/svg" ref={svgRef} {...props} >
		{!hideLogo && <g className="logo" transform="matrix(1, 0, 0, 1, -41.027996, -239.068924)">
			<g className="roundel">
				<g className="left" fill={darkRed}>
					<path d="m 119.551,282.518 c 1.178,-1.415 2.332,-2.848 3.4,-4.343 4.371,-6.089 7.145,-12.561 7.262,-20.2 0.053,-3.516 -0.678,-9.036 -3.681,-10.451 a 4.767,4.767 0 0 0 -4.305,0.4 c -0.13,0.064 -0.244,0.152 -0.369,0.224 -6.6,3.731 -7.329,15.021 -7.47,21.5 -0.056,2.5 0.029,5.023 0.215,7.544 a 3.468,3.468 0 0 0 0.04,0.67 71.2,71.2 0 0 0 2.487,14.245 c 1.313,-1.455 2.52,-2.877 3.656,-4.281 q -0.743,-2.62 -1.239,-5.308" />
					<path d="M 94.935,312.457 Q 93.877,311.71 92.8,310.986 c 1.481,-1.686 2.975,-3.332 4.419,-4.877 2.726,-2.917 5.574,-5.752 8.43,-8.586 0.263,0.8 0.537,1.585 0.83,2.364 0.26,0.691 0.55,1.377 0.84,2.063 1.157,-1.093 2.335,-2.217 3.547,-3.39 a 85.772,85.772 0 0 1 -4.018,-19.191 c -1,-9.712 -0.763,-20.449 3.5,-29.342 a 21.757,21.757 0 0 1 6.236,-7.674 17.913,17.913 0 0 1 1.835,-1.237 58.968,58.968 0 0 0 -74.369,56.521 58.466,58.466 0 0 0 29.17,50.546 c -4.427,-8.137 -0.7,-19.458 5.654,-25.6 0.287,-0.279 1.061,-0.983 1.061,-0.983 a 31.71,31.71 0 0 1 3.475,2.526 c 0.878,-0.912 1.832,-1.859 2.84,-2.83 -2.058,-1.616 -4.143,-3.161 -6.358,-4.645 -2.909,-1.949 -5.98,-3.938 -8.265,-6.629 -7.113,-8.385 -8.02,-22.119 -1.055,-30.857 a 19.937,19.937 0 0 1 1.989,-2.184 16.4,16.4 0 0 1 11.724,-4.661 c 6.079,0.138 11.982,3.736 15.689,9.536 a 3.558,3.558 0 0 1 -1.367,5.214 4.61,4.61 0 0 1 -1.414,0.537 3.809,3.809 0 0 1 -4.093,-1.76 c -3.175,-4.97 -8.389,-6.98 -12.865,-4.627 a 11.1,11.1 0 0 0 -3.691,3.231 c -0.133,0.175 -0.244,0.362 -0.367,0.542 -4.036,5.962 -2.935,14.631 1.572,19.987 3.776,4.494 9.036,7.451 13.841,10.852 0.1,0.072 0.191,0.159 0.29,0.234 1.141,-1.035 2.327,-2.106 3.574,-3.228 -0.176,-0.125 -0.343,-0.258 -0.519,-0.383" />
				</g>
				<g className="right" fill={lightRed}>
					<path d="m 137.881,250.457 c 1.811,8.4 -0.97,19.228 -4.042,25.265 a 67.422,67.422 0 0 1 -8.443,12.49 c -1.053,1.265 -2.143,2.507 -3.257,3.731 -0.516,-1.351 -0.955,-2.729 -1.348,-4.117 -1.138,1.4 -2.343,2.827 -3.657,4.281 a 46.084,46.084 0 0 0 2.3,6.252 c 1.564,3.4 4.343,9.6 8.462,10.538 1.55,0.354 2.946,-0.611 3.882,-3.765 a 22.889,22.889 0 0 0 0.654,-3.05 3.123,3.123 0 0 1 3.641,-2.821 4.582,4.582 0 0 1 1.353,0.335 4.236,4.236 0 0 1 2.681,4.589 18.418,18.418 0 0 1 -2.713,7.43 c -3.01,4.566 -7.9,6.457 -12.859,4.67 a 16.051,16.051 0 0 1 -6.127,-4.159 c -3.266,-3.439 -5.425,-7.85 -7.079,-12.238 -0.165,-0.439 -0.311,-0.885 -0.465,-1.329 -1.213,1.172 -2.391,2.3 -3.548,3.393 0.5,1.18 1.024,2.356 1.617,3.5 -1.138,1.133 -2.279,2.265 -3.374,3.4 -2.154,2.234 -4.321,4.534 -6.406,6.906 a 47.139,47.139 0 0 0 -3.7,-2.92 c -1.247,1.122 -2.433,2.191 -3.574,3.226 a 30.838,30.838 0 0 1 8.627,9.732 23.959,23.959 0 0 1 1.967,4.446 c 2.968,9.262 -0.21,21.558 -9.91,25.031 a 59.454,59.454 0 0 0 10.416,0.931 58.5,58.5 0 0 0 34.9,-105.75" />
					<path d="m 83.411,324.128 a 19.592,19.592 0 0 1 2.539,2.5 c 0.114,0.138 -2.88,3.226 -3.18,3.6 a 15.711,15.711 0 0 0 -3,5.957 c -1.011,4.076 -0.2,9.626 3.9,11.785 6.273,3.308 12.217,-4.324 12.012,-10.445 -0.181,-5.348 -2.165,-10.278 -6.233,-13.658 -1.066,-0.885 -2.13,-1.736 -3.2,-2.574 -1.008,0.971 -1.963,1.915 -2.84,2.83" />
				</g>
			</g>
			<g className="name" fill={offBlack}>
				<path className="G" d="m 231.888,296.323 h 15.449 v 25.451 c -7.153,5.089 -16.952,7.812 -25.961,7.812 -19.694,0 -34.08,-13.253 -34.08,-31.947 0,-18.694 14.386,-31.95 34.434,-31.95 11.567,0 20.927,3.952 27.017,11.235 l -11.121,10 a 19.349,19.349 0 0 0 -15.014,-6.842 c -10.6,0 -17.656,6.932 -17.656,17.553 0,10.357 7.06,17.553 17.484,17.553 a 22.344,22.344 0 0 0 9.448,-2.018 z" />
				<path className="O1" d="m 306.358,297.638 c 0,-10.621 -7.326,-17.553 -16.686,-17.553 -9.36,0 -16.686,6.932 -16.686,17.553 0,10.621 7.326,17.556 16.686,17.556 9.36,0 16.686,-6.938 16.686,-17.556 m -51.032,0 c 0,-18.431 14.567,-31.947 34.346,-31.947 19.779,0 34.346,13.516 34.346,31.947 0,18.431 -14.567,31.947 -34.346,31.947 -19.779,0 -34.346,-13.516 -34.346,-31.947" />
				<path className="O2" d="m 381.1,297.638 c 0,-10.621 -7.326,-17.553 -16.686,-17.553 -9.36,0 -16.689,6.932 -16.689,17.553 0,10.621 7.326,17.556 16.689,17.556 9.363,0 16.686,-6.938 16.686,-17.556 m -51.032,0 c 0,-18.431 14.567,-31.947 34.346,-31.947 19.779,0 34.345,13.516 34.345,31.947 0,18.431 -14.566,31.947 -34.345,31.947 -19.779,0 -34.346,-13.516 -34.346,-31.947" />
				<path className="D" d="m 436.515,314.489 c 10.5,0 17.564,-6.231 17.564,-16.851 0,-10.62 -7.06,-16.852 -17.564,-16.852 h -11.043 v 33.7 z m -28.522,-47.57 h 29.227 c 20.483,0 34.524,11.849 34.524,30.719 0,18.87 -14.044,30.718 -34.524,30.718 h -29.227 z" />
				<rect className="hyphen" x="486.58099" y="287.73801" width="32.717999" height="18.117001" />
				<polygon className="L" points="557.188,314.579 586.681,314.579 586.681,328.356 539.71,328.356 539.71,266.919 557.188,266.919" />
				<path className="O3" d="m 640.487,297.638 c 0,-10.621 -7.326,-17.553 -16.686,-17.553 -9.36,0 -16.686,6.932 -16.686,17.553 0,10.621 7.326,17.556 16.686,17.556 9.36,0 16.686,-6.938 16.686,-17.556 m -51.032,0 c 0,-18.431 14.567,-31.947 34.346,-31.947 19.779,0 34.346,13.516 34.346,31.947 0,18.431 -14.567,31.947 -34.347,31.947 -19.78,0 -34.346,-13.516 -34.346,-31.947" />
				<path className="O4" d="m 715.232,297.638 c 0,-10.621 -7.326,-17.553 -16.686,-17.553 -9.36,0 -16.689,6.932 -16.689,17.553 0,10.621 7.326,17.556 16.689,17.556 9.363,0 16.686,-6.938 16.686,-17.556 m -51.032,0 c 0,-18.431 14.567,-31.947 34.346,-31.947 19.779,0 34.343,13.516 34.343,31.947 0,18.431 -14.564,31.947 -34.343,31.947 -19.779,0 -34.346,-13.516 -34.346,-31.947" />
				<path className="P" d="m 780.178,289.651 c 0,-5.706 -3.624,-9.041 -10.865,-9.041 H 759.6 v 17.99 h 9.714 c 7.241,0 10.865,-3.334 10.865,-8.951 m 17.657,0 c 0,13.953 -10.6,22.643 -27.458,22.643 H 759.6 v 16.062 h -17.477 v -61.436 h 28.254 c 16.861,0 27.458,8.69 27.458,22.733" />
			</g>
		</g>}
		<g style={textStyle}>
			<text className="name" fontSize="62px" fontWeight="800" fill={lightRed} x="145.217" y="-109.521">{name}</text>
			<text className="title" fontSize="42px" fontWeight="600" x="145.217" y="-60">{title}</text>
			{pronouns && <text className="pronouns" fontSize="30px" fontWeight="400" x="145.217" y="-15">({pronouns})</text>}
		</g>
		<clipPath id="clip" clipPathUnits="objectBoundingBox">
			<rect rx="60" ry="60" width="1" height="1" fill="black" />
		</clipPath>
		<image className="profile-pic" href={href} style={profilePicStyle} width="120" height="120" x="3" y="-158.9" clipPath="url(#clip)" />
		<circle className="profile-pic-circle" fill="none" stroke={lightRed} strokeWidth="5px" cx="63.022" cy="-98.891" r="60" />
	</svg>;
};

export default SignatureSVG;
