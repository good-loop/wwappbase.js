/**
 * A simple tree datatype. Matches Tree.java
 */
import {assert, assMatch} from 'sjtest';
import {asNum} from 'wwutils';
import DataClass, {getType, getId, nonce} from './DataClass';
import C from '../CBase';
import Settings from '../Settings';
import Enum from 'easy-enums';

/** 
 * 
 * e.g. new Tree({x:"root", children:[new Tree({x:"Leaf"})] })
 * 
*/
class Tree extends DataClass {
	/** @type {?Tree[]} */
	children;
	/** @type {Object} */
	value;
	/**
	 * e.g. new Tree({x:"root", children:[new Tree({x:"Leaf"})] })
	 */
	constructor(base) {
		super(base);
		Object.assign(this, base);
		// guard against easy errors
		assert( ! base.x, "Use `value` instead");
		assert(typeof(base) !== "string", "Tree.js - bad input, {x} expected");
		assert(typeof(base) !== "number", "Tree.js - wrong input {x} expected");
	}
}
DataClass.register(Tree, "Tree");

/**
 * @returns {!Tree[]} Can be empty, never null
 */
Tree.children = node => node.children || [];

/**
 * The main value stored on this node
 */
Tree.value = node => node.value;

/**
 * @returns {!String} An id based on the node.value. Can be "".
 */
Tree.id = node => node.value? getId(node.value) || node.value.name || Tree.str(node.value) : "";

/**
 * @returns {Number} Max depth of the tree. A leaf has depth 1 
 */
Tree.depth = node => {
	if ( ! node) return 0;
	if ( ! node.children) return 1;
	let kdepths = node.children.map(kid => Tree.depth(kid));
	return 1 + Math.max(...kdepths);
};

/**
 * Map fn over all tree nodes.
 * @param {!Tree} tree
 * @param {Function} fn (node,parent) -> new-node/whatever
 * @returns {!Tree} A copy (if fn returns new-nodes). 
 * 	NB: Callers may also ignore the return value, using this as a forEach.
 */
Tree.map = (tree, fn, parent=null) => {
	let t2 = fn(tree, parent);
	if (tree.children) {
		// recurse
		let fkids = tree.children.map(kid => Tree.map(kid, fn, tree));
		t2.children = fkids;
	}
	return t2;
};

/**
 * Map fn over all tree node values.
 * @param {!Tree} tree
 * @param {Function} fn node-value -> new-node-value. Note: null/undefined node-values are not passed in.
 * @returns {!Tree} A copy
 */
Tree.mapByValue = (tree, fn) => {
	let t2 = new Tree();
	if (tree.value !== undefined && tree.value !== null) {
		let fx = fn(tree.value);
		t2.value = fx;
	}
	if (tree.children) {
		// recurse
		let fkids = tree.children.map(kid => Tree.mapByValue(kid, fn));
		t2.children = fkids;
	}
	return t2;
};
/**
 * @param {Function} predicate node-value -> ?Boolean. Return true to keep, false to prune, 
 * 	null/undefined to decide based on children. Beware of falsy!
 * @returns {?Tree} A copy. Can be null if the whole tree is pruned.
 */
Tree.filterByValue = (tree, predicate) => {
	return Tree.filter(tree, n => {
		if (n.value === undefined || n.value === null) {
			return null; // keep iff a child survives
		}
		let px = predicate(tree.value);
		return px;
	});
};

/**
 * @param {Function} predicate (node,parent) -> ?Boolean. Return true to keep, false to prune, 
 * 	null/undefined to decide based on children. Beware of falsy!
 * @returns {?Tree} A copy. Can be null if the whole tree is pruned.
 */
Tree.filter = (tree, predicate, parent=null) => {
	let t2 = new Tree();
	let px = predicate(tree, parent);
	if (px===false) {
		return null;
	}
	assert(px || px===null || px===undefined, "predictae must return truthy, false, or null/undefined -- NOT falsy");
	t2.value = tree.value;
	// recurse
	let fkids = Tree.children(tree).map(kid => Tree.filter(kid, predicate, tree));
	fkids = fkids.filter(k => !! k); // remove nulls
	t2.children = fkids;
	// prune null branches?
	if (t2.children.length===0 && ! px) {
		return null;
	}
	return t2;
};

/**
 * @param {Tree} branch
 * @param {Object} leafValue This will be wrapped in a Tree object
 * @returns {Tree} the new leaf node
 */
Tree.add = (branch, leafValue) => {
	if ( ! branch.children) branch.children = [];
	assert( ! Tree.isa(leafValue), "double wrapping Tree",leafValue);
	let leaf = new Tree({value:leafValue});
	branch.children.push(leaf);
	return leaf;
};

export default Tree;
