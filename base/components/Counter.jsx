/**
 * A counter where the numbers spin up to the actual figure.
 */

import React from 'react';
import ReactDOM from 'react-dom';

import SJTest, {assert, assMatch} from 'sjtest';
import _ from 'lodash';

import {asNum} from 'wwutils';
import DataStore from '../plumbing/DataStore';
import OnVisible from 'react-on-visible';
import printer from '../utils/printer';
import Money from '../data/Money';

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
 * @param id {!String} counter id
 * @param n {Number|Money} We add handling for the common case of "its money"
 * @param msecs {?Number}
 * @param onStart {?Function} called with {id}
 * @param onEnd {?Function} called with {id}
 */
// Arguably these should be React components.
// I wonder if there is a nice off-the-shelf widget in npm we could use instead??
const Counter = ({id, n, onStart, onEnd, msecs=3000}) => {
	// special-case £s
	let money;
	if (Money.isa(n)) {
		money = n;
		n = Money.value(amount);
	} 

	const go = () => {
		console.warn("Vis!");
		DataStore.setValue(['widget','Counter',id,'start'], new Date().getTime());
		if (onStart) onStart({id});
	};
	const stop = () => {}; //no-op for now TODO maybe support pause - restart
	
	// bezier slide
	const start = DataStore.getValue(['widget','Counter',id,'start']);
	let m, t, y;
	if ( ! start) {
		m = 0;
	} else {
		const dt = new Date().getTime() - start;
		t = dt/msecs;
		y = bezierSlide(t);
		m = y* n;
		if (t < 1) {
			setTimeout(() => {DataStore.update();}, 50); // 20fps if we can
			// TODO if we have a few counters on screen, this could go a bit nuts
		} else {
			if (onEnd) onEnd({id});
		}
	}

	return (<><span className='print-only'>{n}</span>
		<OnVisible className='noprint' onChange={e => e? go() : stop()}>
			{money? <span className='currency-symbol'>{Money.CURRENCY[money.currency]}</span> : null}
			{printer.prettyNumber(m)}
		</OnVisible>
	</>);
};

export default Counter;
