
import {assMatch} from 'sjtest';
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
		if (kv) return [kv[1], kv[2]];
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
	let prop = sq.tree.filter(bit => bit[0] === propName);
	// What to return if prop:value is present but its complex??
	return prop && prop[0]? prop[0][1] : null;
}

/**
 * Set a top-level prop, e.g. vert:foo
 * @param {!SearchQuery} sq
 * @param {String} propName 
 * @param {String} propValue 
 * @returns a NEW SearchQuery
 */
SearchQuery.setProp = (sq, propName, propValue) => {
	assMatch(propValue, String, "searchquery.js - "+propName+" "+propValue);
	let newq = sq.query;
	// renove the old
	if (sq.prop && sq.prop[propName]) {
		newq = newq.replace(new RegExp(propName+":\\S+"), "").trim();
	}
	// quote the value?
	let qpropValue = propValue.indexOf(" ") === -1? propValue : '"'+propValue+'"';
	newq += " "+propName+":"+qpropValue;
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
	// CRUDE but it should work -- at least for simple cases
	let newq = sq1.query+" "+op+" "+sq2.query;
	return new SearchQuery(newq);
}

/**
 * Merge two queries with AND
 * @param {?String|SearchQuery} sq 
 * @returns a NEW SearchQuery
 */
SearchQuery.and = (sq1, sq2) => {
	return SearchQuery.op(sq1,sq2,SearchQuery.AND);
}

SearchQuery.str = sq => sq.query;


// The built in boolean operators
SearchQuery.AND = "AND";
SearchQuery.OR = "OR";
SearchQuery.NOT = "NOT";

SearchQuery.GENERAL_OPTIONS = {
	OR: ["OR", ","],
	AND: ["AND"],
	NOT: ["-"]
};

// debug hack
window.SearchQuery = SearchQuery;

export default SearchQuery;
