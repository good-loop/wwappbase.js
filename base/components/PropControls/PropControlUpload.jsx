

import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';

import { FormControl, registerControl } from '../PropControl';
import Misc from '../Misc';
import { urlValidator } from './PropControlUrl';
import { Button, FormGroup, Label } from 'reactstrap';
import Icon from '../Icon';
import LinkOut from '../LinkOut';
import { luminanceFromHex } from '../Colour';

/** MIME type sets */
const imgTypes = 'image/jpeg, image/png, image/svg+xml';
const videoTypes = 'video/mp4, video/ogg, video/x-msvideo, video/x-ms-wmv, video/quicktime, video/ms-asf';

/** Accepted MIME types for input types*/
const acceptTypes = {
	imgUpload: imgTypes,
	videoUpload: videoTypes,
	bothUpload: `${imgTypes}, ${videoTypes}`,
};

/** Human-readable descriptions of accepted types */
const acceptDescs = {
	imgUpload: 'JPG, PNG, or SVG image',
	videoUpload: 'video',
	bothUpload: 'video or image',
};


// Base for a dummy event with dummy functions so we don't get exceptions when trying to kill it
const fakeEvent = {
	preventDefault: () => null,
	stopPropagation: () => null,
};


/**
 * image or video upload. Uses Dropzone
 * @param {Function} onUpload {path, prop, url, response: the full server response} Called after the server has accepted the upload.
 * @param {?string} version mobile|raw|standard -- defaults to raw
 * @param {?Boolean} cacheControls Show extra controls for adding hash-warts to control caching/resizing
 */
const PropControlUpload = ({ path, prop, onUpload, type, bg, storeValue, value, onChange, collapse, size, version="raw", cacheControls, ...otherStuff }) => {
	delete otherStuff.https;

	const [collapsed, setCollapsed] = useState(true);
	const isOpen = ! collapse || ! collapsed;

	// Automatically decide appropriate thumbnail component
	const Thumbnail = {
		imgUpload: Misc.ImgThumbnail,
		videoUpload: Misc.VideoThumbnail,
		bothUpload: storeValue.match(/(png|jpe?g|svg)$/) ? Misc.ImgThumbnail : Misc.VideoThumbnail,
		upload: ({url}) => <LinkOut href={url} />
	}[type];

	// When file picked/dropped, upload to the media cluster
	const onDrop = (accepted, rejected) => {
		const progress = (event) => console.log('UPLOAD PROGRESS', event.loaded);
		const load = (event) => console.log('UPLOAD SUCCESS', event);
		accepted.forEach(file => {
			ServerIO.upload(file, progress, load)
				.done(response => {
					// TODO refactor to clean this up -- we should have one way of doing things.
					// Different forms for UploadServlet vs MediaUploadServlet
					let url = response.cargo.url; // raw
					if (response.cargo[version] && response.cargo[version].url) {
						url = response.cargo[version].url; // e.g. prefer mobile
					}
					if (onUpload) {
						onUpload({ path, prop, response, url });
					}
					// Hack: Execute the onChange function explicitly to update value & trigger side effects
					// (React really doesn't want to let us trigger it on the actual input element)
					onChange && onChange({...fakeEvent, target: { value: url }});
				})
				.fail(res => res.status == 413 && notifyUser(new Error(res.statusText)));
		});
		rejected.forEach(file => {
			// TODO Inform the user that their file had a Problem
			console.error("rejected :( " + file);
		});
	};

	// New hooks-based DropZone - give it your upload specs & an upload-accepting function, receive props-generating functions
	const { getRootProps, getInputProps } = useDropzone({accept: acceptTypes[type], onDrop});

	// Catch special background-colour name for img and apply a special background to show img transparency
	let className;
	if (bg === 'transparent') {
		bg = '';
		className = 'stripe-bg';
	}

	// For images which will be retrieved via Good-Loop media cache: allow user to mark as "always fetch original size"
	let extraControls = [];
	if (type === 'imgUpload' && cacheControls) {
		const toggleWart = (wart, state) => {
			const imgUrl = new URL(storeValue);
			const hash = imgUrl.hash;
			const already = hash.match(/\bnoscale\b/);
			if (state && !already) {
				const newPrefix = hash ? '#noscale_' : 'noscale';
				imgUrl.hash = hash.replace(/^#?/, newPrefix);
			} else if (!state && already) {
				imgUrl.hash = hash.replace(/[_]?noscale_?/g, '');
			}
			let newVal = imgUrl.toString().replace(/\#$/, ''); // Render URL and strip empty hash
			onChange && onChange({...fakeEvent, target: { value: newVal }});
		}
		const checked = storeValue && storeValue.match(/\#.*\bnoscale\b/);
		extraControls.push(
			<FormGroup inline check>
				<FormControl name="noscale" type="checkbox" onChange={event => toggleWart('noscale', event.target.checked)} checked={checked} />
				<Label for="noscale" check>No auto-scale</Label>
			</FormGroup>
		);
	}

	return (
		<div>
			{collapse && <Button className="pull-left" title="upload media" onClick={e => setCollapsed( ! collapsed)} color="secondary" size={size}><Icon color="white" name="outtray" /></Button>}
			{isOpen && <>
				<FormControl type="url" name={prop} value={storeValue} onChange={onChange} {...otherStuff} />
				<div className="pull-left">
					<div className="DropZone" {...getRootProps()}>
						<input {...getInputProps()} />
						Drop a {acceptDescs[type]} here
					</div>
				</div></>
			}
			<div className="pull-right">
				<Thumbnail className={className} background={bg} url={storeValue} />
			</div>
			{extraControls}
			<div className="clearfix" />
		</div>
	);
}; // ./imgUpload


const baseSpec = {
	$Widget: PropControlUpload,
	validator: urlValidator
};

// Externally these are identical - they just sniff their own type internally & change behaviour on that basis.
registerControl({type: 'imgUpload', ...baseSpec });
registerControl({ type: 'videoUpload', ...baseSpec });
registerControl({ type: 'bothUpload', ...baseSpec });
// Upload anything!?
registerControl({ type: 'upload', ...baseSpec });

export default {};
