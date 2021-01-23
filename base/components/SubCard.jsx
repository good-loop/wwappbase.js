import React from 'react';
import {Card, CardTitle} from 'reactstrap';

/**
 * Convenience for a card/panel within a card (with a sensible default style).
 */
const SubCard = ({title,children,color="light"}) => {
	return <Card body color={color} className='mb-3' >{title && <h5 className="card-title">{title}</h5>}{children}</Card>;
};

export default SubCard;