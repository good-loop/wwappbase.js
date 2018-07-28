
import {assert, assMatch} from 'sjtest';
import {isa, defineType, getType} from './DataClass';

const Person = defineType('Person');
const This = Person;
export default Person;

/**
 * Who is this person linked to?
 * @return {String[]} never null (empty list if unset)
 */
Person.linkedIds = peep => peep.links? peep.links.map(link => link.to) : [];
