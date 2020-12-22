/**
 * A css node for custom css
 */
import React, {useState, useRef} from 'react';

/**

 */
const StyleBlock = ({children}) => {	
	return children && children.length? <style>{children}</style> : null;
};

export default StyleBlock;