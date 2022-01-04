import React, { useState } from 'react';
import DataStore from '../plumbing/DataStore';
import { space } from '../utils/miscutils';

/**
 * Just a convenience for an `<a>` tag to an external (potentially untrustworthy e.g. it might do referrer tracking) web page, which opens in a new tab.
 * @param {Object} p
 * @param {?string} p.href If unset, return a `span` not an `a`. 
 * Convenience HACK: If this is a domain name, e.g. "bbc.co.uk", patch it by adding "https://"
 */
const LinkOut = ({href, disabled, children, className, fetchTitle, ...props}) => {
	if (disabled || ! href) {
		return <span className={space(disabled&&"text-muted",className)} {...props}>{children}</span>;
	}
	// fetch the link title
	if (fetchTitle) {
		// via our LinkInfoServlet ??should we do this client side instead? CORS issues seem to get in the way
		const pvLinkInfo = DataStore.fetch(['misc','url',href], () => {
			return ServerIO.load("https://calstat.good-loop.com/linkInfo", {data:{url:href}, swallow:true});
		});
		children = href;
		if (pvLinkInfo.value && pvLinkInfo.value.title) {
			children = pvLinkInfo.value.title;
			if ( ! props.title) props.title = href;
		}
	}
	return <a href={href.includes("://")? href : "https://"+href} target="_blank" rel="noopener" rel="noreferrer" className={className} {...props} >{ children }</a>;
};
let citeCnt = 1;
/**
 * A citation / reference to an outside source (e.g. a link to Wikipedia, or to some reputable data source)
 */
export const Cite = ({href, title, ...props}) => {
	let [num] = useState(citeCnt++);
	return <LinkOut href={href} title={title} {...props}><sup>[{num}]</sup></LinkOut>;
}

export default LinkOut;
