
// Link just uses Claim

import Claim from './Claim';

const Link = Claim; //new DataClass('Link', Claim);
Link.to = (linkArray, link) => link.v ? linkArray.concat(link.v) : linkArray;
export default Link;
