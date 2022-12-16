import React, {useState} from 'react';
import {copyTextToClipboard, space} from '../utils/miscutils';
import {Button} from 'reactstrap';
import Icon from './Icon';

const CopyButton = ({text, className, children, small}) => {
	const [copiedID, setCopiedID] = useState(false);
	const copyID = () => {
		copyTextToClipboard(text);
		setCopiedID(true);
	};

	return <Button className={space(className, small && 'btn-small')} color={copiedID ? 'primary' : 'secondary'} onClick={copyID}>{children}{children && ' '}<Icon name="clipboard"/></Button>;
};

export default CopyButton;
