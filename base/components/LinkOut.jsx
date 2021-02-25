import React, { useState } from 'react';

/**
 * Just a convenience for an `<a>` tag to an external (potentially untrustworthy e.g. it might do referrer tracking) web page, which opens in a new tab.
 * @param {?string} href
 */
const LinkOut = ({href, children, ...props}) => <a href={href} target="_blank" rel="noopener" rel="noreferrer" {...props} >{ children }</a>;
		// : <span title="The link url is not set" {...props}>{children}</span>;

let citeCnt = 1;
/**
 * A citation / reference to an outside source (e.g. a link to Wikipedia, or to some reputable data source)
 */
export const Cite = ({href, title, ...props}) => {
	let [num] = useState(citeCnt++);
	return <LinkOut href={href} title={title} {...props}><sup>[{num}]</sup></LinkOut>;
}

export default LinkOut;
