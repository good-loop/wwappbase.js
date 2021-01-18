import React from 'react';
import {Card} from 'reactstrap';

/**
 * Convenience for a card/panel within a card (with sensible default style).
 */
const SubCard = ({children}) => {
	return <Card body color='light'>{children}</Card>;
};

export default SubCard;