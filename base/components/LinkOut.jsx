import React from 'react';

/**
 * A link to an external web page, which opens in a new tab
 * @param {!string} href
 */
const LinkOut = ({href, children, ...props}) => <a href={href} target="_blank" rel="noreferrer" {...props} >{ children }</a>

export default LinkOut;
