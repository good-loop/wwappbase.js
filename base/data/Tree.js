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
