
// Link just uses Claim

import {assert, assMatch} from 'sjtest';
import {asNum} from 'wwutils';
import DataClass from './DataClass';
import C from '../CBase';
import Claim from './Claim';

const Link = Claim; //new DataClass('Link', Claim);
Link.to = (linkArray, link) => link.v ? linkArray.concat(link.v) : linkArray;
const This = Link;
export default Link;
