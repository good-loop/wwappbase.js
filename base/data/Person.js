
import {assert, assMatch} from 'sjtest';
import {isa, defineType, getType} from './DataClass';
import DataStore from '../plumbing/DataStore';
import { getClaimsForXId } from '../Profiler';
import Link from '../data/Link';
import Claim from '../data/Claim';
import {XId} from 'wwutils';

const Person = defineType('Person');
const This = Person;
export default Person;

/**
 * Who is this person linked to?
 * @return {String[]} never null (empty list if unset)
 */
Person.linkedIds = peep => peep.links? peep.links.map(link => link.to) : [];

Person.getTwitterXId = () => getSocialXId('twitter')
Person.getFacebookXId = () => getSocialXId('facebook');

/** @deprecated Dubious - could return another persons data from DataStore
 * 
 * Trawls through xids in Datastore and returns one that matches given service */
const getSocialXId = (service) => {
    const xids = Object.keys(DataStore.getValue(['data', 'Person']));

    return xids.find( xid =>  xid.match(/@(.*)/)[1] === service );
};


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
		return Link.make({key:"link", value:xid, from:[xid], consent:['public'], w:1});
	}
	// links
	if ( ! peep.links) return null;	
	// NB: Test claims too? No - lets enforce clean data for ourselves
	let matchedLinks = peep.links.filter(link => XId.service(link.v) === service);	
	return matchedLinks.length !== 0? matchedLinks : null;
};
