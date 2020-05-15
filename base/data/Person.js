
import {assert, assMatch} from 'sjtest';
import DataClass, {getType} from './DataClass';
import DataStore from '../plumbing/DataStore';
import { getClaimsForXId } from '../Profiler';
import Link from '../data/Link';
import Claim from '../data/Claim';
import XId from '.XId';

class Person extends DataClass {
	/** @type {Link[]} */
	links;
	/** @type {Claim[]} */
	claims;

	constructor(base) {
		super(base);
		Object.assign(this, base);		
	}
}
DataClass.register(Person, "Person");
const This = Person;
export default Person;

/**
 * Who is this person linked to?
 * @return {String[]} never null (empty list if unset)
 */
// (30/01/19) use filter instead of map to patch bug where Link.to returned undefined
// filter only adds value to return array if it is not falsy
Person.linkedIds = peep => peep.links? peep.links.reduce(Link.to, []) : [];

/**
 * 
 * @param {Person} peep 
 * @param {String} service
 * @returns {?Link} The (TODO most likely) email link
 */
Person.getLink = (peep, service) => {
	const links = Person.getLinks(peep, service);
	if ( ! links) return null;
	// FIXME sort them by w
	return links[0];
}


/**
 * 
 * @param {Person} peep 
 * @param {String} service
 * @returns {?Link[]} all matching links, or null if none
 */
Person.getLinks = (peep, service) => {
	Person.assIsa(peep);
	assMatch(service, String);
	// is the XId a match?
	const xid = Person.id(peep);
	if (XId.service(xid) === service) {
		return new Link({key:"link", value:xid, from:[xid], consent:['public'], w:1});
	}
	// links
	if ( ! peep.links) return null;	
	// NB: Test claims too? No - lets enforce clean data for ourselves
	let matchedLinks = peep.links.filter(link => XId.service(link.v) === service);	
	return matchedLinks.length !== 0? matchedLinks : null;
};
