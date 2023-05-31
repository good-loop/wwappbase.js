import React, { useState } from 'react';
import Roles from '../Roles';

/**
 * Only show the contents to GL developers
 */
function DevOnly({children}) {
    if ( ! Roles.isDev()) return null;
    return <div className='dev-only'>{children}</div>;
}

export default DevOnly;