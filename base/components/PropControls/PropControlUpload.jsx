

import React from 'react';
import { useDropzone } from 'react-dropzone';

import { FormControl, registerControl } from '../PropControl';
import Misc from '../Misc';
import { urlValidator } from './PropControlUrl';

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
 */
const PropControlUpload = ({ path, prop, onUpload, type, bg, storeValue, value, onChange, version="raw", ...otherStuff }) => {
	delete otherStuff.https;

	// Automatically decide appropriate thumbnail component
	const Thumbnail = {
		imgUpload: Misc.ImgThumbnail,
		videoUpload: Misc.VideoThumbnail,
		bothUpload: storeValue.match(/(png|jpe?g|svg)$/) ? Misc.ImgThumbnail : Misc.VideoThumbnail
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

	return (
		<div>
			<FormControl type="url" name={prop} value={storeValue} onChange={onChange} {...otherStuff} />
			<div className="pull-left">
				<div className="DropZone" {...getRootProps()}>
					<input {...getInputProps()} />
					Drop a {acceptDescs[type]} here
				</div>
			</div>
			<div className="pull-right">
				<Thumbnail className={className} background={bg} url={storeValue} />
			</div>
			<div className="clearfix" />
		</div>
	);
}; // ./imgUpload


const baseSpec = {
	$Widget: PropControlUpload,
	validator: urlValidator
};

// Externally these are identical - they just sniff their own type internally & change behaviour on that basis.
// registerControl({ type: 'imgUpload', ...baseSpec });
// registerControl({ type: 'videoUpload', ...baseSpec });
// registerControl({ type: 'bothUpload', ...baseSpec });

// TODO Is this the Right Way?
// We can't call registerControl here because - due to a dependency loop - it may not exist yet.
// So we let PropControl.jsx receive a specification for each new control type & register them itseld.
export const specs = [
	{ type: 'imgUpload', ...baseSpec },
	{ type: 'videoUpload', ...baseSpec },
	{ type: 'bothUpload', ...baseSpec },
];
