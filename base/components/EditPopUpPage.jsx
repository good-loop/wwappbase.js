import React, { useEffect, useState } from 'react';
import { Alert } from 'reactstrap';

import PropControl from '../base/components/PropControl';
import DataStore from '../base/plumbing/DataStore';
import { setWindowTitle } from '../base/plumbing/Crud';

/** Props for the PropControl which don't depend on the invoking component */
const staticProps = {
	path: ['widget', 'EditPopup'],
	prop: 'value',
	style: { width: '100%', height: '100vh' },
};
const dsPath = staticProps.path.concat(staticProps.prop);


/** Shorthand for postMessage back to the invoking window */
const send = window.opener?.postMessage;


/**
 * Minimal page for a pop-up window containing a PropControl linked back to the main window - see PropControl_PopUp
 */
function EditPopUpPage() {
	const [ready, setReady] = useState(false); // Don't enable the control until it's been initialised by the creating window
	const [extraProps] = useState(() => getExtraProps()); // type, lang, etc
	const [lang] = useState(() => DataStore.getUrlValue('lang'));
	const [source] = useState(() => DataStore.getUrlValue('source'));

	if (!window.opener) return <Alert color="danger">Something went wrong. Try re-opening this window.</Alert>;

	useEffect(() => {
		const listener = msg => {
			if (msg.origin !== window.location.origin) return; // Only accept messages from the same site as the component
			if (msg.data.source !== source) return; // Only accept messages from the matching editor
			DataStore.setValue(dsPath, msg.data.value);
			if (!ready) setReady(true);
		};

		setWindowTitle(`${DataStore.getUrlValue('label')}: Popout Editor`);
		window.addEventListener('message', listener);
		setTimeout(() => send({source, ready: true}), 500); // give some loading time leeway TODO is this necessary?
		window.addEventListener('beforeunload', () => send({ source, close: true }));

		return () => window.removeEventListener('message', listener);
	}, []);

	const sendVal = ({value}) => send({source, value});

	return <PropControl {...staticProps} saveFn={sendVal} disabled={!ready} {...extraProps} />;
}

export default EditPopUpPage;
