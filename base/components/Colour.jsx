/**
 * Functions used to calculate colour contrast ratio
 * Similar project: https://github.com/LeaVerou/contrast-ratio
 */
import React from 'react';
import { Alert } from 'reactstrap';

import { assMatch } from '../utils/assert';
import printer from '../utils/printer';

/* Regular expressions for recognising/validating/destructuring RGB hex codes*/
const hexDigit = '[0-9a-f]';
const hex3 = new RegExp(`#?(${hexDigit})(${hexDigit})(${hexDigit})`, 'i');
const hex6 = new RegExp(`#?(${hexDigit}{2})(${hexDigit}{2})(${hexDigit}{2})`, 'i');


/**
 * @param {String} hex A 3- or 6-digit hex colour string (RGBA accepted but opacity discarded)
 * @returns {Object} {r: , g: 243, b: 243}
 */
const rgbFromHex = hex => {
	assMatch(hex, 'String');

	let components = (hex.length < 6 ? hex3 : hex6).exec(hex);
	if (!components) return {}; // Regexes reject too-short codes
	// Double up 3-digit colours
	if (hex.length < 6) components = components.map(c => `${c}${c}`);
	const [, r, g, b] = components.map(c => parseInt(c, 16));
	return { r, g, b };
};


const isValidRGB = v => v <= 255 && v >= 0;

/** 
 * Numerical representation of colour brightness
 * https://www.w3.org/TR/WCAG20/#relativeluminancedef
 * @params {r, g, b} RGB colour values 
*/
const luminance = ({r, g, b}) => {
	if (!isValidRGB(r) || !isValidRGB(g) || !isValidRGB(b)) {
		console.warn('Invalid RGB value provided to luminance', {r, g, b});
		return NaN;
	}

	// Linearize presumed sRGB to CIE XYZ
	const [rLin, gLin, bLin] = [r, g, b].map(channel => {
		channel /= 255;
		if (channel <= 0.03928) return channel / 12.92;
		return ((channel + 0.055) / 1.055) ** 2.4;
	});

	return (0.2126 * rLin) + (0.7152 * gLin) + (0.0722 * bLin);
};


/**
 * Parse a HTML colour string to numeric RGB, then extract the luminance value
 */
const luminanceFromHex = hex => {
	const rgb = rgbFromHex(hex);
	return luminance(rgb);
};


/**
 * https://www.w3.org/TR/WCAG20/#contrast-ratiodef
 * @params luminance1, luminance2 numerical representation of 'relative brightness' of colour.
 * return number [0, 21]. 0 = no contrast (same colour); 21 = perfect contrast (black on white) 
 * Larger number should be in numerator to avoid returning value < 1
*/
const colourContrast = (luminance1, luminance2) => (Math.max(luminance1, luminance2) + 0.05) / (Math.min(luminance1, luminance2) + 0.05);


/**
 * Warn if the luminance-contrast of a pair of colours is below a certain threshold.
 * @param {Object} p
 * @param {String} p.hex1 A colour in HTML hex notation
 * @param {String} p.hex2 A colour in HTML hex notation
 * @param {String|React.Element=} p.message Custom warning message
 * @param {Number=} p.minContrast Defaults to 4.5, or 7 if p.enhanced is set.
 * @param {Boolean} p.enhanced Use the W3C "enhanced" contrast criterion (unless p.minContrast is explicitly set already)
 * @returns {React.Element|null} A warning message if the contrast ratio is below the minimum, or null.
 */
const ColourWarning = ({hex1, hex2, backgroundImage, message, minContrast, enhanced}) => {
	const l1 = luminanceFromHex(hex1);
	const l2 = luminanceFromHex(hex2);

	// Will be in range [1, 21]
	const contrast = colourContrast(l1, l2);

	// Fill in minimum contrast (if not given explicitly) per W3C accessibility standards
	if (!minContrast) minContrast = (enhanced ? 7 : 4.5);

	if (contrast >= minContrast) return null;

	// Show a visual sample of text in the given colour pairing
	const sampleStyle = {
		backgroundColor: hex1,
		color: hex2,
		fontWeight: 'bold',
		fontSize: '125%'
	};

	let imageNote = null;
	// Allow a background image to override the colour - we can't judge its contrast, but the user can use it to judge readability.
	if (backgroundImage) {
		sampleStyle.background = `url(${backgroundImage})`;
		imageNote = 'You may safely ignore this warning if your background image has better contrast against the text colour.';
	}


	return <Alert color="danger" className="flex-row justify-content-between">
		<div>
			{message || `Text may be difficult to read in your chosen colours.`}{' '}
			(Contrast ratio is {printer.prettyNumber(contrast)}:1, recommended minimum {minContrast}:1.)
			{imageNote && <><br/>{imageNote}</>}
		</div>
		<div className="img-thumbnail ml-2" style={sampleStyle}>
			Sample
		</div>
	</Alert>;
};

export {
	ColourWarning,
	rgbFromHex,
	luminanceFromHex,
	colourContrast
};
