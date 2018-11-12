
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

// Function generator
// Trawls through xids in Datastore and returns one that matches given service

const getSocialXId = (service) => {
    const xids = Object.keys(DataStore.getValue(['data', 'Person']));

    return xids.find( xid =>  xid.match(/@(.*)/)[1] === service );
};
