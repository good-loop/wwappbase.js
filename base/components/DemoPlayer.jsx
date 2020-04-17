// TODO move this into the demoproject
import React, { useState, useRef, useCallback, useEffect, createRef, memo } from "react";
import { Row, Col, Button, UncontrolledAlert } from "reactstrap";
import { landscapeSvg, desktopSvg, portraitSvg } from "./DemoSvg";

const deviceSvgs = {
	landscape: landscapeSvg,
	desktop: desktopSvg,
	portrait: portraitSvg
};

/** Description of the Good-Loop formats */
const descriptions = {
	social: "The Good-Loop social swipe-to-donate player is shown in social media apps: SnapChat, Instagram, Facebook, or Twitter.",
	video: "Our core product, the Good-Loop video player is shown in a s website article as people scroll through, or apprears as a pre-roll before a video begins."
};

/** Simulated device screen images */
const frameImages = {
	landscape: 'https://media.good-loop.com/uploads/standard/iphone-frame-16-9-padded-notch.svg',
	desktop: 'https://media.good-loop.com/uploads/standard/laptop-websiteholder-text.png',
	portrait: 'https://media.good-loop.com/uploads/standard/iphone-frame-16-9-padded-notch-portrait.svg',
};

const sizes = {
	social: {
		portrait: 'social',
	},
	video: {
		landscape: 'landscape',
		desktop: 'landscape',
		portrait: 'portrait',
	}
};

const DemoPlayer = ({ vertId, production, noSocial, adBlockerDetected }) => {
	const [state, setState] = useState({
		format: "video",
		device: "desktop"
	});

	const handleFormatPickerClick = e => {
		// If social format is picked, default to portrait device.
		if (e.target.getAttribute('format') === 'social') {
			setState({ ...state, device: 'portrait', format: 'social' });
		}
		else setState({ ...state, format: e.target.getAttribute('format')});
	}
	const handleDevicePickerClick = e => setState({ ...state, device: e.target.getAttribute('device')});

	const ad = state.format === 'social' ? (
		<SocialAd
			vertId={vertId}
			nonce={`${state.format}${state.device}${vertId}`}
		/>
	) : (
		<GoodLoopAd
			vertId={vertId}
			size={sizes[state.format][state.device]}
			nonce={`${state.format}${state.device}${vertId}`}
			production={production}
		/>
	)

	const currentButtonHighlighter = button => {
		if (button !== 'social' && button !== 'video') {
			if (state.format === 'social' && button !== 'portrait') {
				return 'disabled';
			}
		}
		if (button === state.device || button === state.format) {
			return 'current';
		} else return '';
	}

	return (
		<Row className="demo-section flex-column">
			{ noSocial ? '' :
			<Row className="format-picker text-center justify-content-center pt-5">
				<button outline color="secondary"
					format="social"
					className={`picker-button ${currentButtonHighlighter('social')}`}
					onClick={handleFormatPickerClick}
				>
					Social
				</button>
				<button outline color="secondary"
					format="video"
					className={`picker-button ${currentButtonHighlighter('video')}`}
					onClick={handleFormatPickerClick}
				>
					Video
				</button>
			</Row>
			}

			<Row className="device-picker justify-content-center pb-4 flex-row">
				<Col xs="auto" md="auto" className="text-center flex-row">
					<button outline color="secondary"
						device="landscape"
						className={`picker-button ${currentButtonHighlighter('landscape')}`}
						onClick={handleDevicePickerClick}
					>
						{deviceSvgs["landscape"]}
					</button>
					<button outline color="secondary"
						device="desktop"
						className={`picker-button ${currentButtonHighlighter('desktop')}`}
						onClick={handleDevicePickerClick}
					>
						{deviceSvgs["desktop"]}
					</button>
					<button outline color="secondary"
						device="portrait"
						className={`picker-button ${currentButtonHighlighter('portrait')}`}
						onClick={handleDevicePickerClick}
					>
						{deviceSvgs["portrait"]}
					</button>
				</Col>
			</Row>

			<Row className="justify-content-center pb-4">
				<Col cs="12" md="6" className="text-center">
					{descriptions[state.format]}
				</Col>
			</Row>

			{ adBlockerDetected ?
				<UncontrolledAlert color="warning" role="alert">
					Adblocker detected. Some of our adverts might not play properly!
				</UncontrolledAlert>
				: ''
			}

			<Row className="half-bg">
				<Col xs="12" className="text-center">
					<div className={`device-container ${state.device}`}>
						<div className="device-screen-bg"></div>
						<div className="ad-container">{ad}</div>
						<img className="frame-img" src={frameImages[state.device]} alt="device frame" />
					</div>
				</Col>
			</Row>
		</Row>
	);
};

// FIXME how does this relate to GoodLoopAd.jsx??
const GoodLoopAd = memo(({ vertId, size, nonce, production, social }) => {
	let prefix = '';
	if (window.location.hostname.match(/^local/)) prefix = 'local';
	if (window.location.hostname.match(/^test/)) prefix = 'test';
	if (production) prefix = '';

	const glUnitUrl = `//${prefix}as.good-loop.com/unit.js`;
	const fullUnitUrl = glUnitUrl + (vertId ? `?gl.vert=${vertId}&gl.debug=true` : '' );

	let adContainer = createRef();
	let script;

	const createScript = () => {
		let script = document.createElement('script');
		script.setAttribute('src', fullUnitUrl);
		script.setAttribute('key', `${nonce}-script`);
		return script;
	}

	useEffect(() => {
		adContainer.current.append(createScript());
	}, [nonce]);

	return (
		<div className={`ad-sizer ${size} ${social ? 'slide-in' : ''}`} ref={adContainer} >
			<div className="aspectifier" />
			<div className="goodloopad" data-format={size} data-mobile-format={size} key={nonce + '-container'} />
		</div>
	)
});

const SocialAd = ({vertId, nonce}) => {
	const [showAd, setShowAd] = useState(0);
	const size = 'portrait';
	// Hardcoded TOMS Josh EN Male advert. We will show this only on the DemoPage.
	vertId = '0PVrD1kX';

	return (
		<div className="ad-sizer portrait" >
			<div className="aspectifier" />
			<div className="fake-feed" >
				<video
					onMouseDown={() => setShowAd(true) }
					width="100%"
					autoPlay
					muted
					loop
					src="https://media.good-loop.com/uploads/standard/toms_snapchat_ad.mp4"
				/>
				<div className="show-ad" onClick={() => setShowAd(true)}>trigger ad</div>
			</div>
			<div className={`social-ad ${showAd ? 'show' : ''}`}>
				{ showAd ? <GoodLoopAd vertId={vertId} size={size} nonce={nonce} production social /> : '' }
				{/* showAd ?  : '' */}
			</div>
		</div>
	);
};

export default DemoPlayer;
