
import React from 'react';
import { space } from '../utils/miscutils';

/**
 * 
 * @param {function} onClick
 */
const CloseButton = ({onClick, size, color}) => {
	return (<button type="button" className={space("close",color && "bg-"+color)} aria-label="Close" onClick={onClick}>
	<span aria-hidden="true">&times;</span>
	</button>);
};

export default CloseButton;
