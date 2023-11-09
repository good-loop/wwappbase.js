import React, { useEffect, useState } from 'react';
import DataStore from '../base/plumbing/DataStore';


const popupUrl = (params = {}) => {
	let url = '/#editpopup';

	const paramsString = Object.entries(params).map(([k,v]) => {
		const encV = encodeURIComponent(v);
		return encV ? `${k}=${encV}` : null;
	}).filter(a => !!a).join('&');

	if (paramsString.length) url += `?${paramsString}`;

	return url;
};


const popupFeatures = 'popup,width=1000,height=700';


export default function PropControl_PopUp({InputComponent, getValue, setValue, ...props}) {
	const { path, prop, type, lang, label } = props;
	const dsPath = path.concat(prop);
	const [popup, setPopup] = useState();
	const [source] = useState(() => `gl-popup-control:${dsPath}`);

	const openPopup = () => {
		if (popup && !popup.closed) {
			popup.focus();
		} else {
			// TODO What other generic props to pass? Code editor wants "lang", what else? Everything?
			const newPopup = window.open(popupUrl({type, label, source, lang}), '', popupFeatures);
			setPopup(newPopup);
		}
	};

	useEffect(() => {
		if (!popup) return;

		const listener = msg => {
			// match origin for safety
			if (msg.origin !== window.location.origin) return;
			if (msg.data.source !== source) return;

			const data = msg.data;
			if (data.value) setValue(data.value);
			if (data.ready) popup.postMessage({source, value: getValue()});
			if (data.close) setPopup(null);
		};

		window.addEventListener('message', listener);
		return () => window.removeEventListener('message', listener);
	}, [popup]);

	// 2-way sync - the popup should receive edits made here as well
	const sendVal = popup ? ({value}) => popup.postMessage({source, value}) : null;

	const openButton = (
		<Button color="secondary" size="xs" onClick={openPopup} title="Open this editor in its own window">
			<Icon name="popout" />
		</Button>
	);

	return (
		<PropControl {...props} saveFn={sendVal} customIcon={openButton} />
	);
};
