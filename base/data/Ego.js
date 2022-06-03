
import DataClass from './DataClass';

export class Pronoun {
    /** @type{String} they */
    subject;
    /** @type{String} them */
    object;
    /** @type{String} their */
    possessive;

    constructor (subject, object, possessive) {
        this.subject = subject;
        this.object = object;
        this.possessive = possessive;
    }

    toString () {
        return this.subject + "/" + this.object + "/" + this.possessive;
    }
}

Pronoun.fromObj = obj => {
    return new Pronoun(obj.subject, obj.object, obj.possessive);
}

export class Identity {    
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
