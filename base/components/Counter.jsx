/**
 * A counter where the numbers spin up to the actual figure.
 */

import React, {useState, useRef} from 'react';
import ReactDOM from 'react-dom';

import SJTest, {assert, assMatch} from 'sjtest';
import _ from 'lodash';

import {asNum} from 'wwutils';
import DataStore from '../plumbing/DataStore';
import printer from '../utils/printer';
import Money from '../data/Money';
import {useDoesIfVisible} from './CustomHooks';

/**
 * Use a bezier for a slow start/end, fast middle easing
 * @param t [0,1] 0 = start of curve, 1 = end of curve
 * @returns [0,1]
 */
const bezierSlide = (x = 0) => {
	if (x <= 0) return 0;
	if (x >= 1) return 1;
	// ref https://en.wikipedia.org/wiki/B%C3%A9zier_curve#Cubic_B%C3%A9zier_curves
	// This probably wants tweaking! And/or I may have got the equation wrong ^Dan
	/*
		RM: I graphed this with the old values (p1y = 0.1, p2y = 0.9) on https://www.desmos.com/calculator
		...and based on playing with that for a few seconds, changed the control points to y = 0 and 1.
		Which simplified the equation a LOT!
		Also, just to be a pain, I changed the parametric t to x - so if you paste it in, it'll graph cleanly and you can see what I'm talking about.
		const p1y = 0.1, p2y = 0.9;
		const y = 3*(1-t)*(1-t)*t*p1y + 3*(1-t)*t*t*p2y + t*t*t;
	*/
	return 3*x*x - 2*x*x*x;
};

/**
 * @param {Number} value Final value to display
 * @param {Number} initial Value to start counting from
 * @param {Number} animationLength Time (msec) to reach final number
 * @param {Number} fps frames per second
 * @param {String} currencySymbol Won't break the system if 
 */
const Counter = ({value, initial = 0, animationLength = 3000, fps = 20, currencySymbol = '', pretty = true}) => {
	const [startTime, setStartTime] = useState();
	const [displayValue, setDisplayValue] = useState(0);
	const ref = useRef();

	// Start animation the FIRST time the component enters the viewport
	useDoesIfVisible(() => {
		if (!startTime) setStartTime(new Date().getTime());
	}, ref);

	// Force update if animation time has not elapsed since component became visible
	const elapsed = new Date().getTime() - startTime;
	if (startTime && (elapsed < animationLength)) {
		// Display fraction of final amount based on "bezier curve"
		// Aim to show roughly 20 frames per second
		window.setTimeout(() => {
			const displayVal = initial + (bezierSlide(elapsed / animationLength) * (value - initial));
			setDisplayValue(displayVal);
		}, animationLength / fps);
	}

	const disp = pretty ? printer.prettyNumber(displayValue) : Math.floor(displayValue);
	return <span ref={ref}>{currencySymbol + printer.prettyNumber(displayValue)}</span>;
}

export default Counter;
