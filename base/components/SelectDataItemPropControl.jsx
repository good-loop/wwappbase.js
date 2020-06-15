
import React from 'react';

import _ from 'lodash';
import PropControl, {registerControl} from './PropControl';
/**
 * TODO a picker with auto-complete for e.g. Advertiser, Agency
 */

 /**
  * 
  * @param {?Boolean} embed If true, set a copy of the data-item. By default, what gets set is the ID
  */
const SelectDataItemPropControl = ({path, prop, type, q, embed}) => {
	return <PropControl type="text" prop={prop} path={path} />;
};
registerControl({type:'DataItem', $Widget:SelectDataItemPropControl});

export default SelectDataItemPropControl;
