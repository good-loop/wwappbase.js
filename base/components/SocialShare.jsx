
// TODO move social share buttons from DonationForm here

import React from 'react';
import {assert, assMatch} from 'sjtest';
import {encURI} from 'wwutils';

import DataStore from '../plumbing/DataStore';
import C from '../CBase';

import Misc from './Misc.jsx';
import NGO from '../data/NGO';

/** 
 * There are default display icons for each service, but you can provide children to use instead
 * @param service. Options: 'twitter', 'facebook', 'linkedin'
 * @param Data to be encoded in to href. Of form {message: ''}. Each social media uses different keys
 * TODO: Replace pngs with svgs (preferably inline)
 */
const IntentLink = ({children, service, style, text, url}) => {
	service = service.toLowerCase();

	let href;
	let icon;
	if ( service === 'twitter' ) {
		href = `https://twitter.com/intent/tweet?text=${text}&tw_p=tweetbutton&url=${url}`;
		icon = (
			<div className='intent-link' style={{backgroundColor: '#1b95e0', ...style}}>
				<img alt='Twitter Logo' src='/img/twitter.png' crop="50%" title='Twitter Logo' />
			</div>
		);
	} else if ( service === 'facebook' ) {
		href = `http://www.facebook.com/sharer.php?u=${url}&quote=${text}`;
		icon = (
			<div className='intent-link' style={{backgroundColor: '#4267b2', ...style}}>
				<img alt='Facebook Logo' src='/img/facebook.png' crop="50%" title='Facebook Logo' />
			</div>
		);
	} else if ( service === 'linkedin' ) {
		href = `https://www.linkedin.com/shareArticle?mini=true&title=Our%20ads%20are%20raising%20money%20for%20charity&url=${url}&summary=${text}`;
		icon = (
			<div className='intent-link' style={{backgroundColor: '#0077B5', ...style}}>
				<img alt='LinkedIn Logo' src='/img/linkedin-white.png' crop="50%" title='LinkedIn Logo' />
			</div>
		);
	} else {
		console.error('Invalid service param provided to IntentLink component. Valid values are twitter, facebook or linkedin');
		return;
	}

	return (
		<a href={encodeURI(href)} target="_blank" rel="noreferrer" style={{color: '#fff', display: 'inline-block'}} >
			{ children || icon }
		</a>
	);
};

export {
	IntentLink
};
