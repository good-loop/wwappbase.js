
// Link just uses Claim

import DataClass from './DataClass';
import C from '../CBase';
import Claim from './Claim';

const Link = Claim; //new DataClass('Link', Claim);
Link.to = (linkArray: string | any[], link: { v: any; }) => link.v ? linkArray.concat(link.v) : linkArray;

export default Link;
