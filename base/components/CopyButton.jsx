import React, { useState } from 'react';
import { copyTextToClipboard } from '../utils/miscutils';
import { Button } from 'reactstrap';
import Icon from './Icon';

const CopyButton = ({ text, className, children, ...props }) => {
	const [hasCopied, setHasCopied] = useState(false);
	const doCopy = () => {
		copyTextToClipboard(text);
		setHasCopied(true);
	};

	return <Button {...props} className={className} color={hasCopied ? 'primary' : 'secondary'} onClick={doCopy}>
		{children}{children && ' '}<Icon name="clipboard"/>
	</Button>;
};

export default CopyButton;
