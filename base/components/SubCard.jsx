import React from 'react';
import {Card} from 'reactstrap';

/**
 * Convenience for a card/panel within a card (with a sensible default style).
 */
const SubCard = ({children,color="light"}) => {
	return <Card body color={color} className='mb-3' >{children}</Card>;
};

export default SubCard;