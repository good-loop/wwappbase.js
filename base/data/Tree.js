/**
 * A simple tree datatype. Matches Tree.java
 */
import {assert} from 'sjtest';
import DataClass, {getId} from './DataClass';
import { Children } from 'react';
import { str } from '../utils/printer';

/** 
 * 
 * e.g. new Tree({x:"root", children:[new Tree({x:"Leaf"})] })
 * 
 * This is single-linked, with parents listing their children. 
 * Child nodes don't hold a link back to the parent (because circular references are not valid json).
 * 
*/
class Tree extends DataClass {
	/** @type {?Tree[]} */
	children;
	/** @type {Object} */
	value;
	/**
	 * e.g. ` new Tree({value:"root", children:[new Tree({value:"Leaf"})] }) `
	 */
	constructor(base) {
		super(base);
		Object.assign(this, base);
		// guard against easy errors
		assert( ! (base && base.x), "Use `value` instead");
		assert(typeof(base) !== "string", "Tree.js - bad input, {x} expected");
		assert(typeof(base) !== "number", "Tree.js - wrong input {x} expected");
	}
}
DataClass.register(Tree, "Tree");

/**
 * 
 * @param {Tree} tree 
 * @param {?number} depth 
 */
Tree.str = (tree, depth=0, maxDepth=5) => {
	if (depth===maxDepth) return "...";
	let sv = str(Tree.value(tree));
	let kids = Tree.children(tree);
	if ( ! kids.length) return sv;
	let skids = kids.map(kid => Tree.str(kid, depth+1));
	// make each line one deeper
	let skids2 = skids.map(skid => skid.split("\n").map(line => "\t"+line).join("\n"));
	return sv+"\n"+skids2.join("\n");
		
}

/**
 * @returns {!Tree[]} Can be empty, never null
 */
Tree.children = node => node.children || [];
/**
 * Flattens with parent nodes above children.
 * @param {Tree} node 
 * @returns {Tree[]} 
 */
Tree.flatten = node => {
	assert(node, "Tree.js flatten() - "+node)
	const all = [];
	flatten2(node, all);
	return all;
};
const flatten2 = (node, all) => {
	all.push(node);
	if ( ! node.children) return;
	node.children.forEach(kid => flatten2(kid, all));
};

/**
 * The main value stored on this node
 */
Tree.value = node => node.value;

/**
 * recursively collect all values
 * @return Object[]
 */
Tree.allValues = tree => {
	const vs = [];
	Tree.mapByValue(tree, v => vs.push(v));
	return vs;
};

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

// /**
//  * TODO what are the most useful semantices for this??
//  * Special constant to break out of `map()` early.
//  */
// Tree.BREAK = "BREAK";

/**
 * Map fn over all tree nodes.
 * 
 * NB: Consider also `Tree.flatten(tree).map()`
 * 
 * @param {!Tree} tree
 * @param {Function} fn (node,parent,depth) -> new-node (which should be childless!) / new-value / null. depth starts at 0 for the root.
 * @returns {?Tree} A copy (if fn returns new-nodes). 
 * 	NB: Callers may also ignore the return value, using this as a forEach.
 * 
 */
Tree.map = (tree, fn, parent=null, depth=0) => {
	let t2 = fn(tree, parent, depth);
	// wrap the return into a tree node?
	if (t2 && ! Tree.isa(t2)) t2 = new Tree({value:t2});
	if (tree.children) {
		// recurse
		let fkids = tree.children.map(kid => Tree.map(kid, fn, tree, depth+1));
		// support an early break?? what should the return behaviour be?
		// for(let i=0; i<tree.children.length; i++) {
		// 	let kid = tree.children[i];
		// 	let fKid = Tree.map(kid, fn, tree, depth+1);
		// 	if (fKid===Tree.BREAK) break;
		// 	fkids.push(fKid);
		// }
		if (t2) {
			t2.children = fkids;
		}
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
		let px = predicate(n.value);
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
 * Depth first search
 * @param {Tree} tree 
 * @param {Function} predicate node-value (never null/undefined) -> falsy
 */
Tree.findByValue = (tree, predicate) => {
	if (tree.value!==undefined && tree.value!==null) {
		if (predicate(tree.value)) {
			return tree; // found!
		}
	}
	let kids = Tree.children(tree);
	// first match
	for (let i = 0; i < kids.length; i++) {
		const kid = kids[i];
		let v = Tree.findByValue(kid, predicate);
		if (v) return v;
	}
	return null;
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
