import React from 'react';

/**
 * Just a convenience for an `<a>` tag to an external (potentially untrustworthy e.g. it might do referrer tracking) web page, which opens in a new tab.
 * @param {!string} href
 */
const LinkOut = ({href, children, ...props}) => <a href={href} target="_blank" rel="noopener" rel="noreferrer" {...props} >{ children }</a>


export default LinkOut;
