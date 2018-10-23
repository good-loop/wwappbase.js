
import {assert, assMatch} from 'sjtest';
import {asNum} from 'wwutils';
import DataClass from './DataClass';
import C from '../CBase';

/** impact utils */
const Claim = new DataClass('Claim');
const This = Claim;
export default Claim;

/** Puts data into the "Claim" format that Profiler can understand */
Claim.make = ({key, value, from, p}) => {
	// convert a single XId to an array?
	if (_.isString(from)) from = [from];	
	assMatch(from, 'String[]');
	assMatch(key, String); 
	

	// Converting from internally held true/false to something
	// That the back-end can understand
	if( typeof p === 'boolean' ) p = p ? ['public'] : ['private']
	assMatch(p, 'String[]');

	return {
		p,
		t: new Date().toISOString(),
		v: value,
		f: from,
		k: key
	};
	// NB: kv, o are backend fields made by the backend for internal (ES) use
};


