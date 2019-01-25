
import {assert, assMatch} from 'sjtest';
import {isa, defineType, getType} from './DataClass';
import DataStore from '../plumbing/DataStore';

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
	Person.assIsa(peep);
	// is the XId an email XId?
	const xid = Person.getId(peep);
	if (XId.service(xid) === 'email')

	// Test claims too? No - lets enforce clean data for ourselves
	return null;
};
