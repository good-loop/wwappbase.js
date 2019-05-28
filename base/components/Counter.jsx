/**
 * A counter where the numbers spin up to the actual figure.
 */

import React, {useState, useRef} from 'react';
import ReactDOM from 'react-dom';

import SJTest, {assert, assMatch} from 'sjtest';
import _ from 'lodash';

import {asNum} from 'wwutils';
import DataStore from '../plumbing/DataStore';
import OnVisible from 'react-on-visible';
import printer from '../utils/printer';
import Money from '../data/Money';
import {useDoesIfVisible} from '../components/HigherOrderComponents';

/**
 * Use a bezier for a slow start/end, fast middle easing
 * @param t [0,1]
 * @returns [0,1]
 */
const bezierSlide = (t) => {
	if ( ! t || t<0) return 0;
	if (t > 1) return 1;
	// ref https://en.wikipedia.org/wiki/B%C3%A9zier_curve#Cubic_B%C3%A9zier_curves
	// This probably wants tweaking! And/or I may have got the equation wrong ^Dan
	const p1y = 0.1, p2y=0.9;
	const y = 3*(1-t)*(1-t)*t*p1y + 3*(1-t)*t*t*p2y + t*t*t;
	return y;
};

/**
 * 
 * @param animationLength time in ms taken to reach final number
 * @param fps frames per second 
 * @param value final (numerical) value to display
 */
const Counter = ({animationLength=3000, fps=20, value}) => {
	const [startTime, setStartTime] = useState();
	const [displayValue, setDisplayValue] = useState(0);
	const ref = useRef();

	// Start animation when the component enters the viewport
	useDoesIfVisible(() => {
		console.warn([startTime, !!startTime]);
		// Don't want it to restart if the user scrolls after the animation has finished
		if( !startTime ) {
			setStartTime(new Date().getTime());
		}
	}, ref);

	// Force update if animation time has not elapsed since component became visible
	const timeRemaining = new Date().getTime() - startTime;
	if( startTime && ( timeRemaining > 0) ) {
		// Display fraction of final amount based on "bezier curve"
		// Aim to show roughly 20 frames per second
		window.setTimeout(() => setDisplayValue( bezierSlide(timeRemaining / animationLength) * value ), animationLength / fps);
	}

	return (
		<div ref={ref}>
			{printer.prettyNumber(displayValue)}
		</div>
	);
}

export default Counter;
