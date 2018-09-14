/**
	List of server results -- for use with Crud ActionMan.list and ListLoad

	format:

	{
		hits: [{id, type, status}]
		total: Number
		??index ??start ??first: Number ??cursor
	}

*/
import {assert, assMatch} from 'sjtest';
import {isa, defineType, getType} from './DataClass';
import C from '../CBase';

/** impact utils */
const List = defineType('List');
const This = List;
export default List;

// more lenient duck typing
List.isa = listy => {
	if ( ! listy) return false;
	return isa(listy, 'List') || (listy.hits && listy.hits.length !== undefined);
};

List.hits = list => List.assIsa(list) && list.hits;
List.total = list => list.total;

/**
 * Add in place, item to list
 * @param {*} item 
 * @param {List} list 
 */
List.add = (item, list) => {
	list.hits.push(item);
	return list;
};

// TODO page cursor logic
