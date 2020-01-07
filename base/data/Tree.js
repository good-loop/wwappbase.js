/**
 * A simple tree datatype
 */
import {assert, assMatch} from 'sjtest';
import {asNum} from 'wwutils';
import DataClass, {getType} from './DataClass';
import C from '../CBase';
import Settings from '../Settings';
import Enum from 'easy-enums';

/** 
 * 
 * e.g. new Tree({name:"root", children:[new Tree({name:"Leaf"})] })
 * 
*/
class Tree extends DataClass {
	/** @type {?Tree[]} */
	children;
	/** @type {Object} */
	name;

	constructor(base) {
		super(base);
		Object.assign(this, base);
	}
}
DataClass.register(Tree, "Tree");

/**
 * @returns {!Tree[]} Can be empty
 */
Tree.children = node => node.children || [];

/**
 * The main value stored on this node
 */
Tree.name = node => node.name;

export default Tree;
