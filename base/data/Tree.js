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
	x;
	/**
	 * e.g. new Tree({x:"root", children:[new Tree({x:"Leaf"})] })
	 */
	constructor(base) {
		super(base);
		Object.assign(this, base);
		// guard against easy errors
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
Tree.x = node => node.x;

/**
 * @returns {!String} An id based on the node.x value. Can be "".
 */
Tree.id = node => node.x? getId(node.x) || node.x.name || Tree.str(node.x) : "";

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
 * Map fn over all tree node values.
 * @param {!Tree} tree
 * @param {Function} fn node-value -> new-node-value. Note: null/undefined node-values are not passed in.
 * @returns {!Tree} A copy
 */
Tree.map = (tree, fn) => {
	let t2 = new Tree();
	if (tree.x !== undefined && tree.x !== null) {
		let fx = fn(tree.x);
		t2.x = fx;
	}
	if (tree.children) {
		// recurse
		let fkids = tree.children.map(kid => Tree.map(kid, fn));
		t2.children = fkids;
	}
	return t2;
};
/**
 * @param {Function} predicate node-value -> Boolean. Return falsy to prune.
 * @returns {?Tree} A copy. Can be null if the whole tree is pruned.
 */
Tree.filter = (tree, predicate) => {
	let t2 = new Tree();
	let keepValue = false;
	if (tree.x !== undefined && tree.x !== null) {
		let px = predicate(tree.x);
		if ( ! px) return null;
		t2.x = tree.x;
		keepValue = true;
	}
	// recurse
	let fkids = Tree.children(tree).map(kid => Tree.filter(kid, predicate));
	fkids = fkids.filter(k => !! k); // remove nulls
	t2.children = fkids;
	// prune null branches
	if (t2.children.length===0 && ! keepValue) return null;
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
	let leaf = new Tree({x:leafValue});
	branch.children.push(leaf);
	return leaf;
};
/**
 * @param {!Tree} tree
 * @returns {!Tree[]}
 */
Tree.findByValue = (tree, value) => {
	const kids = Tree.children(tree);
	let nodes = _.flatMap(kids, kid => Tree.findByValue(kid, value));
	if (Tree.x(tree) === value) nodes.push(tree);
	return nodes;
};

export default Tree;
