/**
 * A simple tree datatype. Matches Tree.java
 */
import {assert, assMatch} from 'sjtest';
import {asNum} from 'wwutils';
import DataClass, {getType} from './DataClass';
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

export default Tree;
