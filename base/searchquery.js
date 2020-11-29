
import { assert, assMatch } from './utils/assert';
import DataClass from './data/DataClass';

/**
 * Manipulate search query strings like a boss.
 * e.g.
 * `let sq = new SearchQuery("apples OR oranges"); 
 * SearchQuery.setProp(sq, "lang", "en")`
 * 
 * See DataLog for the original of this!
 * 
 * TODO we'll want more search capabilities as we go on
 */
class SearchQuery
// extends DataClass 
{
	/** @type {!String} */
	query;

	/**
	 * e.g. ["OR", "a", ["AND", "b", {"near", "c"}]]
	 */
	tree;

	options;

	/**
	 * 
	 * @param {?String|SearchQuery} query 
	 * @param {?Object} options 
	 */
	constructor(query, options) {
		this.query = query || "";
		// NB: unwrap if the input is a SearchQuery
		if (this.query.query) this.query = this.query.query;
		this.options = Object.assign({}, SearchQuery.GENERAL_OPTIONS, options, this.query.options);
		SearchQuery.parse(this);
	}

} // ./SearchQuery
// DataClass.register(SearchQuery, "SearchQuery");


SearchQuery._init = sq => {
	if (sq.tree) return;
	SearchQuery.parse(sq);
}

SearchQuery.parse = sq => {
	// HACK just space separate and crude key:value for now!
	let bits = sq.query.split(" ");
	let bits2 = bits.map(bit => {
		let kv = bit.match(/^([a-z]+):(.+)/);
		if (kv) return {[kv[1]]: kv[2]};
		return bit;
	});
	/**
	 * Return the expression tree, which is a nested array
	 * E.g. "a OR (b AND near:c)" --> ["OR", "a", ["AND", "b", ["near", "c"]]]
	 */
	sq.tree = [SearchQuery.AND, ...bits2];
}

/**
 * Convenience method.
 * IF propName occurs at the top-level, then return the value
 * @param {*} propName 
 */
SearchQuery.prop = (sq, propName) => {
	SearchQuery._init(sq);
	let prop = sq.tree.filter(bit => Object.keys(bit).includes(propName));
	// What to return if prop:value is present but its complex??
	return prop? prop[propName] : null;
}

/**
 * Set a top-level prop, e.g. vert:foo
 * @param {!SearchQuery} sq
 * @param {String} propName 
 * @param {?string} propValue If unset (null,undefined, or "" -- but not false or 0!), clear the prop
 * @returns a NEW SearchQuery
 */
SearchQuery.setProp = (sq, propName, propValue) => {	
	assMatch(propName, String, "searchquery.js - "+propName+" "+propValue);
	// renove the old
	SearchQuery._init(sq);
	// top level only??
	let newq = sq.query;
	// if (prop) { // HACK out the old value TODO use the parse tree to handle quoting
	newq = newq.replace(new RegExp(propName+":\\S+"), "").trim();
	// }
	// unset? (but do allow prop:false and x:0)
	if (propValue===null || propValue===undefined || propValue==="") {
		// already removed the old
	} else {
		// quote the value?
		let qpropValue = propValue.indexOf(" ") === -1? propValue : '"'+propValue+'"';
		newq += " "+propName+":"+qpropValue;
	}
	return new SearchQuery(newq.trim());
}

/**
 * Merge two queries with OR
 * @param {?String|SearchQuery} sq 
 * @returns a NEW SearchQuery
 */
SearchQuery.or = (sq1, sq2) => {
	return SearchQuery.op(sq1,sq2,SearchQuery.OR);
}

SearchQuery.op = (sq1, sq2, op) => {	
	// convert to class
	if (typeof(sq1)==='string') sq1 = new SearchQuery(sq1);
	if (typeof(sq2)==='string') sq2 = new SearchQuery(sq2);

	if ( ! sq2) return sq1;
	if ( ! sq1) return sq2;
	if ( ! sq1.query) return sq2;
	if ( ! sq2.query) return sq1;
	// HACK remove (works for simple cases)
	if (SearchQuery.REMOVE === op) {
		// (assume AND) pop the 1st tree op, filter out nodes that appear in sq2
		let t2 = sq1.tree.slice(1).filter(
			n1 => ! _.find(sq2.tree, n2 => _.eq(JSON.stringify(n1), JSON.stringify(n2)))
		);
		t2 = [sq1.tree[0]].concat(t2);
		let u = unparse(t2);
		// console.warn(sq1.tree, sq2.tree, t2, u);
		let newsq = new SearchQuery(u);
		return newsq;
	}
	// CRUDE but it should work -- at least for simple cases
	let newq = sq1.query+" "+op+" "+sq2.query;
	return new SearchQuery(newq);
}; 

/**
 * Merge two queries with AND
 * @param {?String|SearchQuery} sq 
 * @returns a NEW SearchQuery
 */
SearchQuery.and = (sq1, sq2) => {
	return SearchQuery.op(sq1,sq2,SearchQuery.AND);
}


/**
 * Remove sq2 from sq1, e.g. remove("foo AND bar", "bar") -> "foo"
 * @param {?String|SearchQuery} sq1
 * @param {?String|SearchQuery} sq2
 * @returns {SearchQuery} a NEW SearchQuery
 */
SearchQuery.remove = (sq1, sq2) => {
	return SearchQuery.op(sq1,sq2,SearchQuery.REMOVE);
}

/**
 * @param {?SearchQuery} sq 
 * @returns {!string}
 */
SearchQuery.str = sq => sq? sq.query : '';

/**
 * Convert a parse tree back into a query string
 * @param {Object[]|string} tree 
 * @returns {string}
 */
const unparse = tree => {
	// a search term?
	if (typeof(tree)==='string') return tree;
	// key:value?
	if ( ! tree.length) {
		let keys = Object.keys(tree);
		assert(keys.length === 1);
		return keys[0]+":"+tree[keys[0]];
	}
	if (tree.length===1) return tree[0]; // just a sole keyword
	let op = tree[0];
	let bits = tree.slice(1);
	// TODO bracketing
	let ubits = bits.map(unparse);
	return ubits.join(" "+op+" ");
};


// The built in boolean operators
SearchQuery.AND = "AND";
SearchQuery.OR = "OR";
SearchQuery.NOT = "NOT";
/**
 * Hack for saying "this search, but removing this term"
 */
SearchQuery.REMOVE = "RM";

SearchQuery.GENERAL_OPTIONS = {
	OR: ["OR", ","],
	AND: ["AND"],
	NOT: ["-"]
};

// debug hack
window.SearchQuery = SearchQuery;

export default SearchQuery;
