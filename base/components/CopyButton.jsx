import React, {useState} from 'react';
import {copyTextToClipboard, space} from '../utils/miscutils';
import {Button} from 'reactstrap';

const CopyButton = ({text, className, children, small}) => {

    const [copiedID, setCopiedID] = useState(false);
	const copyID = () => {
		copyTextToClipboard(text);
		setCopiedID(true);
	}

    return <Button className={space(className, small && "btn-small")} color={copiedID ? "primary" : "secondary"} onClick={copyID}>{children}{children && " "}<span class="emoji logo-sm">📋</span></Button>;
};

export default CopyButton;