/**
 * A css node for custom css
 */
import React, {useState, useRef} from 'react';
import HtmlSanitizer from '@jitbit/htmlsanitizer';

const HTML = ({children}) => {	
    if ( ! children) return null;
    safeHtml = HtmlSanitizer.SanitizeHtml(children);
    return <div dangerouslySetInnerHTML={{__html: safeHtml}} />
};

export default HTML;