/**
 * A counter where the numbers spin up to the actual figure.
 */

 // TODO support for more precise than 3 sig figs

/* Possible TODO MAYBE! use react-spring for smoother, less expensive animations?? Should be default tool?? */

import React, {useState, useEffect, useRef} from 'react';
import printer from '../utils/printer';
import {useDoesIfVisible} from './CustomHooks';
import Money from '../data/Money';

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
 * NB The useState version of setState() doesn't merge partial state objects onto the old state
 * ...so we grab the state object AND the members we need, and call setState({ ...state, { new partial state } })
 * @param {Number} value Final value to display
 * @param {Number} initial Value to start counting from
 * @param {Number} animationLength Time (msec) to reach final number
 * @param {Number} fps frames per second
 * @param {String} currencySymbol
 * @param {Money} amount - Convenient way to set value + currencySymbol
 * @param {Number} sigFigs Round value
 * @param {Boolean} preservePennies Preserves 2 digits on the pennies count if pennies are included in rounding
 */
const Counter = ({value, amount, initial = 0, animationLength = 3000, fps = 20, currencySymbol = '', pretty = true, sigFigs = 3, preservePennies = true, preserveSize = true }) => {
	if (amount) {
		value = Money.value(amount);
		currencySymbol = Money.currencySymbol(amount);
	}
	const [state, setState] = useState({displayValue: initial, done: false});
	const {startTime, displayValue, done} = state;
	const ref = useRef();

	// Start animation the FIRST time the component enters the viewport
	useDoesIfVisible(() => {
		if (!startTime) setState({...state, startTime: new Date().getTime()});
	}, ref);

	// Is the component visible & not yet done animating?
	if (startTime && !done) {
		const elapsed = new Date().getTime() - startTime;
		// Display fraction of final amount based on "bezier curve"
		// Aim to show roughly 20 frames per second
		window.setTimeout(() => {
			const displayVal = initial + (bezierSlide(elapsed / animationLength) * (value - initial));
			setState({...state, displayValue: displayVal});
		}, animationLength / fps);
		// Have we passed the end of the animation duration? Don't update again after this.
		if (elapsed >= animationLength) setState({...state, done: true});
	}

	let disp = pretty ? printer.prettyNumber(displayValue, sigFigs) : displayValue;
	disp = disp.toString();
	if (preservePennies)
		disp = fillInPennies(disp);

	if (!preserveSize)
		return <span ref={ref}>{currencySymbol + disp}</span>;
	else {
		// Get the total value in pretty penny form too, for preserving the size
		let totalVal = pretty ? printer.prettyNumber(value, sigFigs) : value;
		totalVal = totalVal.toString();
		if (preservePennies)
			totalVal = fillInPennies(totalVal);
		// Cut the display value down to a number of characters that will fit in the end size
		while (disp.length > totalVal.length) {
			disp = disp.substr(0, disp.length - 1);
		}
		return (
			<div className="position-relative d-inline-block">
				<span className="invisible">{currencySymbol + totalVal}</span>
				<span className="position-absolute" style={{left: 0}} ref={ref}>{currencySymbol + disp}</span>
			</div>
		);
	}
}

const fillInPennies = (disp) => {
	let parts = disp.split('.');
	if (parts.length > 1) {
		while (parts[1].length != 2) {
			if (parts[1].length < 2)
				parts[1] += "0";
			else if (parts[1].length > 2) {
				parts[1] = parts[1].substr(0, parts.length - 1);
			}
		}
		disp = parts[0] + "." + parts[1];
	}
	return disp;
}

export default Counter;
