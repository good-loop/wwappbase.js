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

/**
 * @param t [0,1]
 * @returns [0,1]
 */
const bezierSlide = (t) => {
	if ( ! t || t<0) return 0;
	if (t > 1) return 1;
	// ref https://en.wikipedia.org/wiki/B%C3%A9zier_curve#Cubic_B%C3%A9zier_curves
	const p1y = 0.1, p2y=0.9;
	const y = 3*(1-t)*(1-t)*t*p1y + 3*(1-t)*t*t*p2y + t*t*t;
	return y;
};

/**
 * @param id {!String} counter id
 * @param n {Number}
 * @param msecs {?Number}
 * @param onStart {?Function} called with {id}
 * @param onEnd {?Function} called with {id}
 */
const Counter = ({id, n, onStart, onEnd, msecs=4000}) => {
	const go = () => {
		console.warn("Vis!");
		DataStore.setValue(['widget','Counter',id,'start'], new Date().getTime());
		if (onStart) onStart({id});
	};
	const stop = () => {}; //no-op for now TODO maybe support pause - restart
	window.uprint = printer;
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
		} else {
			if (onEnd) onEnd({id});
		}
	}
	return (<div><span className='print-only'>{n}</span>
		<OnVisible className='noprint' onChange={e => e? go() : stop()}>{printer.prettyNumber(m)}</OnVisible>
	</div>);
};

export default Counter;
