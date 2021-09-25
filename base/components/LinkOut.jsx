import React, { useState } from 'react';
import { space } from '../utils/miscutils';

/**
 * Just a convenience for an `<a>` tag to an external (potentially untrustworthy e.g. it might do referrer tracking) web page, which opens in a new tab.
 * @param {Object} p
 * @param {?string} p.href If unset, return a `span` not an `a`
 */
const LinkOut = ({href, disabled, children, className, ...props}) => 
	(disabled || ! href)? <span className={space(disabled&&"text-muted",className)} {...props}>{children}</span>
	: <a href={href} target="_blank" rel="noopener" rel="noreferrer" className={className} {...props} >{ children }</a>;

let citeCnt = 1;
/**
 * A citation / reference to an outside source (e.g. a link to Wikipedia, or to some reputable data source)
 */
export const Cite = ({href, title, ...props}) => {
	let [num] = useState(citeCnt++);
	return <LinkOut href={href} title={title} {...props}><sup>[{num}]</sup></LinkOut>;
}

export default LinkOut;
