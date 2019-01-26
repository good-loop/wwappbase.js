/**
 * You-Again Share object
 * ??move this into you-again.js??
 */

import {assert, assMatch} from 'sjtest';
import DataClass, {getType} from './DataClass';

class Share extends DataClass {
}
const This = Share;
export default This;

/**
 * Support Share or DBShare (c.f. the java server-side code)
 */
This.isa = (obj) => super.isa(obj) || getType(obj) === 'DBShare';

/**
 * Convenience for a common filter + strip op.
 * @param {!Share[]} shareList
 * @param {!String} prefix Note: this should usually end with a ":", e.g. "Publisher:"
 * @returns {String[]} sharelist filtered by prefix, with item extracted and the prefix removed.
 */
Share.stripPrefix = (shareList, prefix) => {
    let slist2 = shareList.filter(s => This.assIsa(s) && s.item.startsWith(prefix));
    return slist2.map(s => s.item.substr(prefix.length));
};
