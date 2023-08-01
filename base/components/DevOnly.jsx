import React, { useState } from 'react';
import Roles from '../Roles';

/**
 * Only show the contents to GL developers.
 * 
 * See also TODO. Use TODO for work-in-progress, and DevOnly for long-term dev-only content.
 */
function DevOnly({children}) {
	if (!Roles.isDev()) return null;
	return <div className="dev-only">{children}</div>;
}

export default DevOnly;
