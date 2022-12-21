import React, { useState } from 'react';
import { space } from '../utils/miscutils';

const Wrap = ({children, style, className}) => {
    if ( ! children) return null;
    if ( ! style && ! className) return children;
    return <div className={className} style={style}>{children}</div>;
};

export default Wrap;
