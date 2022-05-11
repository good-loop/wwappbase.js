
import DataClass from './DataClass';

class Pronoun {
    /** @type{String} they */
    subject;
    /** @type{String} them */
    object;
    /** @type{String} their */
    possessive;
}

class Identity {    
    /** @type{String} mostly null, for plural identities*/
    name;
    /** @type{Array(String[])} each gender is a list of labels*/
    genders;
    /** @type{Pronoun[]} */
    pronouns;
}

/**
 * A revamped model to store data on a person's identity.
 * See comments in Ego.java for more info
 */
class Ego extends DataClass {

    /** @type{Identity[]} */
    identities;

    /** @type{String} no model can encapsulate everything - let people type their own stuff */
    descriptor;

	/**
	 * @param {Ego} base 
	 */
	constructor(base) {
		super();
		DataClass._init(this, base);
	}
}
DataClass.register(Ego, "Ego"); 

export default Ego;
