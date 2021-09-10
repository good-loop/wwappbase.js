import React from 'react';

import printer from '../utils/printer.js';
import C from '../CBase';
import Misc from './Misc';
import ImageObject from '../data/ImageObject.js';
import LinkOut from './LinkOut.jsx';

/**
 * @type {ImageObject[]}
 */
const IMAGE_CREDITS = [];

/**
 * @type {ImageObject[]}
 */
const MUSIC_CREDITS = [];

/**
 * @type {ImageObject[]} ??
 */
const DATA_CREDITS = [];

/**
 * @type {string[]}
 */
const FUNDER_CREDITS = [];


/**
 * Add an image to the about-page credits. Repeat adds are harmless.
 * @param {?ImageObject} image e.g. {author, url, name, caption}
 */
export const addImageCredit = image => {
	// use author as the key
	if ( ! image || ! image.author) return;
	if (IMAGE_CREDITS.find(ic => ic.author === image.author)) {
		return null;
	}
	IMAGE_CREDITS.push(image);
};
/**
 * Add an image to the about-page credits. Repeat adds are harmless.
 * @param {?ImageObject} image  
 */
export const addMusicCredit = image => {
	// use author as the key
	if ( ! image) return;
	const json = JSON.stringify(image);
	if (MUSIC_CREDITS.find(ic => JSON.stringify(ic) === json)) {
		return null;
	}
	MUSIC_CREDITS.push(image);
};

export const addDataCredit = image => {
	// use author as the key
	if ( ! image) return;
	const json = JSON.stringify(image);
	if (DATA_CREDITS.find(ic => JSON.stringify(ic) === json)) {
		return null;
	}
	DATA_CREDITS.push(image);
};

export const addFunderCredit = funder => {
	if (FUNDER_CREDITS.includes(funder)) {
		return null;
	}
	FUNDER_CREDITS.push(funder);
};


// TODO sponsors

/** Well-formatted list of funders */
const FunderCredits = ({funders}) => {
	let textList;

	if (!funders.length) textList = 'our funders';
	else if (funders.length === 1) textList = funders[0];
	else if (funders.length === 2) textList = funders.join(' and ');
	else textList = funders.reduce((acc, funder, i) => {
		if (i === 0) return funder;
		if (i === funders.length - 1) return (acc + ', and ' + funder);
		return (acc + ', ' + funder);
	});

	return <p>We are grateful to {textList} for their support.</p>
};


const MusicCredits = ({musicCredits}) => {
	if (!musicCredits.length) return null;

	return <>
		<p>This app uses music from:</p>
		<ul>
			{musicCredits.map(credit => <li><LinkOut href={credit.url}>{credit.name} by {credit.author}</LinkOut></li>)}
		</ul>
	</>;
}


const ccText = 'This app uses Creative Commons images from various sources'

const ImageCredits = ({imageCredits}) => {
	if (!imageCredits.length) return <p>{ccText}.</p>;

	return <>
		<p>{ccText}:</p>
		<ul>
			{imageCredits.map(credit => <li><LinkOut href={credit.url}>{credit.name} by {credit.author}</LinkOut></li>)}
		</ul>
	</>
};


const dataText = 'This app uses data from various sources'

const DataCredits = ({dataCredits}) => {
	if (!dataCredits.length) return <p>{dataText}.</p>;

	return <>
		<p>{dataText}:</p>
		<ul>
			{dataCredits.map(credit => <li><LinkOut href={credit.url}>{credit.name} by {credit.author}</LinkOut></li>)}
		</ul>
	</>;
};


/**
 * 
 * @param {*} param0 
 */
const AboutPage = () => {
	let website = C.app.website; // ?? default to top-level domain
	return (
		<div className="AboutPage">
			<h1>
				{C.app.logo ? <img src={C.app.logo} className="img-thumbnail logo-small pull-left mr-4" /> : null}
				About {C.app.name}
			</h1>
			

			<p>Please see our website for more information on {C.app.name}: <a href={website}>{website}</a></p>

			{C.app.facebookAppId ? (
				<a href={`https://www.facebook.com/games/?app_id=${C.app.facebookAppId}`}>
					<Misc.Logo service="facebook" size="small" /> Our Facebook page
				</a>)
			: null}

			<FunderCredits funders={FUNDER_CREDITS} />
			<ImageCredits imageCredits={IMAGE_CREDITS} />
			<MusicCredits musicCredits={MUSIC_CREDITS} />
			<DataCredits dataCredits={DATA_CREDITS} />

			<p>Software version: <i>{JSON.stringify(C.app.version || 'alpha')}</i></p>
		</div>
	);
};

export default AboutPage;
