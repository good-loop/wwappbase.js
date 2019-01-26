/**
	MoneyItem - a named Money thing
*/
import {assert, assMatch} from 'sjtest';
import {asNum} from 'wwutils';
import DataClass from './DataClass';
import C from '../CBase';
import Money from './Money';

/** impact utils */
class MoneyItem extends DataClass {

};
const This = MoneyItem;
export default MoneyItem;

MoneyItem.str = mi => {
	if (mi.text && mi.money) return Money.str(mi.money)+" "+mi.text;
	if (mi.text) return mi.text;
	if (mi.money) return Money.str(mi.money);
	return ""+mi;
};