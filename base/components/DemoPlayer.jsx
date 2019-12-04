import React, { useState, Component } from "react";
import { Row, Col } from "reactstrap";
import { landscapeSvg, desktopSvg, portraitSvg } from "./DemoSvg";

const deviceSvgs = {
	landscape: landscapeSvg,
	desktop: desktopSvg,
	portrait: portraitSvg
};

/** Description of the Good-Loop formats */
const descriptions = {
	social:	"The Good-Loop social swipe-to-donate player is shown in social media apps: SnapChat, Instagram, Facebook, or Twitter.",
	video:	"Our core product, the Good-Loop video player is shown in a s website article as people scroll through, or apprears as a pre-roll before a video begins."
};

/** Simulated device screen images */
const frameImages = {
	landscape: 'https://media.good-loop.com/uploads/standard/iphone-frame-16-9-padded-notch.svg',
	desktop: 'https://media.good-loop.com/uploads/standard/laptop-transparent-background.png',
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

const DemoPlayer = ({ vertId, production }) => {
	const [state, setState] = useState({
		format: "video",
		device: "desktop"
	});

	const handleFormatPickerClick = e => setState({ ...state, format: e.target.getAttribute('format')});
	const handleDevicePickerClick = e => setState({ ...state, device: e.target.getAttribute('device')});

	const ad = state.format === 'social' ? (
		<div>Social mockup here</div>
	) : (
		<GoodLoopAd 
			vertId="test_wide_multiple" 
			size={sizes[state.format][state.device]} 
			nonce={`${state.format}${state.device}${"test_wide_multiple"}`}
			production={production} />
	)

	const currentButtonHighlighter = button => {
		if (button === state.device || button === state.format) {
			return 'current';
		}
	}

	return (
		<Row className="demo-section flex-column">
			<Row className="format-picker text-center justify-content-center p-5">
				<a
					format="social"
					className={`picker-button ${currentButtonHighlighter('social')}`}
					onClick={handleFormatPickerClick} >
					Social
				</a>
				<a
					format="video"
					className={`picker-button ${currentButtonHighlighter('video')}`}
					onClick={handleFormatPickerClick}>
					Video
				</a>
			</Row>

			<Row className="device-picker justify-content-center pb-4 flex-row">
				<Col xs="auto" md="auto" className="text-center flex-row">
					<a
						device="landscape"
						className={`picker-button ${currentButtonHighlighter('landscape')}`}
						onClick={handleDevicePickerClick}>
						{deviceSvgs["landscape"]}
					</a>
					<a
						device="desktop"
						className={`picker-button ${currentButtonHighlighter('desktop')}`}
						onClick={handleDevicePickerClick}>
						{deviceSvgs["desktop"]}
					</a>
					<a
						device="portrait"
						className={`picker-button ${currentButtonHighlighter('portrait')}`}
						onClick={handleDevicePickerClick}>
						{deviceSvgs["portrait"]}
					</a>
				</Col>
			</Row>

			<Row className="justify-content-center pb-4">
				<Col cs="12" md="6" className="text-center">
					{descriptions[state.format]}
				</Col>
			</Row>

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

class GoodLoopAd extends Component {
	shouldComponentUpdate(nextProps) {
		return nextProps.nonce !== this.props.nonce;
	}

	render() {
		let prefix = '';
		if (window.location.hostname.match(/^local/)) prefix = 'local';
		if (window.location.hostname.match(/^test/)) prefix = 'test';

		const glUnitUrl = `//${prefix}as.good-loop.com/unit.js`;
		const fullUnitUrl = glUnitUrl + (this.props.vertId ? `?gl.vert=${this.props.vertId}` : '' );

		return (
			<div className={`ad-sizer ${this.props.size}`}>
				<div className="aspectifier" />
				<div className="goodloopad" data-format={this.props.size} data-mobile-format={this.props.size} key={this.props.nonce + '-container'} />
				<script src={fullUnitUrl} key={this.props.nonce + '-script'} />
			</div>
		)
	}
}

export default DemoPlayer;
