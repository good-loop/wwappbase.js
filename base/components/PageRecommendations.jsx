import React, { useState, useEffect } from 'react';
import { Button, Card, CardBody, CardHeader, Modal, ModalBody, ModalHeader, Table } from 'reactstrap';

import { proxy, typeBreakdown } from '../utils/pageAnalysisUtils';
import StyleBlock from './StyleBlock';
import { nonce } from '../data/DataClass';
import C from '../CBase';
import { Bytes, space } from '../utils/miscutils';


function UnusedWarning({spec}) {
	return spec.unused ? <div>
		This resource is loaded, but does not appear to be used by the creative.
	</div> : null;
};


function ComparisonRow({spec, optimised}) {
	let { filename, url, optUrl, bytes, optBytes, isSubstitute } = spec;
	let desc = 'Original';

	if (optimised) {
		url = optUrl;
		bytes = optBytes;
		desc = isSubstitute ? 'Replacement' : 'Optimised';
	}

	return <div className={space('comparison-row', optimised ? 'optimised' : 'original')}>
		<C.A target="_blank" className="desc" href={url} download={filename}>{desc}</C.A>
		<div className="size"><Bytes b={bytes} /></div>
	</div>
}


function SizeComparison({spec}) {
	const { bytes, optBytes } = spec;
	// How much smaller? (Our "worth telling user" threshold is 1%)
	const improvement = (1 - (optBytes / bytes)) * 100;

	return <div className="size-comparison">
		<ComparisonRow spec={spec} />
		{improvement > 1 ? <>
			<ComparisonRow spec={spec} optimised />
			<div className="improvement"><span className="percent">{improvement.toFixed(1)}%</span> smaller</div>
		</> : (
			<div className="text-center">Optimally sized.</div>
		)}
	</div>;
}


const baseCharacterSet =
'abcdefghijklmnopqrstuvwxyz\n' +
'ABCDEFGHIJKLMNOPQRSTUVWXYZ\n' +
'1234567890!"#$%&\'()*+,-./:\n' +
';<=>?@[\]^_`{|}~';

function ShowCharacters({characters}) {
	const [charEls, setCharEls] = useState(null);
	useState(() => {
		setCharEls(baseCharacterSet.split('').map(char => {
			if (char === '\n') return <br />;
			const unused = (characters.indexOf(char) < 0) && 'unused'
			return <span className={space('char', unused)}>
				{char}
			</span>;
		}));
	}, [characters]);

	return <div className="character-set">
		{charEls}
	</div>;
};


function FontPreview({spec}) {
	const [fontFamily] = useState(nonce());

	const { url, filename, name, font } = spec;
	const fontWeight = font ? font.weights.find(w => !!w) : 500; // default 500/normal for unused

	return <>
		<StyleBlock>{`@font-face { font-family: "${fontFamily}"; src: url("${proxy(url)}"); }`}</StyleBlock>
		<div className="preview font-preview" style={{ fontFamily, fontWeight }} title={name || filename}>
			{name || filename}
		</div>
	</>
}


function FontRecDetails({ spec }) {
	const [open, setOpen] = useState(false);
	const toggle = () => setOpen(a => !a);

	const { filename, font } = spec;

	let desc = [];
	if (!filename.match(/\.woff2/)) {
		const origFormat = filename.match(/\.[^.]+$/)[0];
		desc.push(<li key="conversion">
			This font has been converted from <b>{origFormat}</b> to <b>.woff2</b>, which offers the most efficient compression currently available.
		</li>);
	}
	if (font?.characters) {
		desc.push(<li key="subset">
			This font has been optimised by removing characters which are never used in the creative:
			<ShowCharacters characters={font.characters} />
		</li>);
	}

	return <>
		<Button onClick={toggle}>Details</Button>
		<Modal isOpen={open} className="recommendation-details-modal font-details" toggle={toggle}>
			<ModalHeader toggle={toggle}>Font Optimisation</ModalHeader>
			<ModalBody>
				<div className="text-center my-4">
					<FontPreview spec={spec} />
				</div>
				<ul>
					{desc}
				</ul>
			</ModalBody>
		</Modal>
	</>
}


export function FontRecommendation({spec}) {
	return <Card className="opt-rec font-rec">
		<CardHeader>Font</CardHeader>
		<CardBody className="p-2">
			<div className="my-1">
				<FontPreview spec={spec} />
			</div>
			<SizeComparison spec={spec} />
			<UnusedWarning spec={spec} />
			<FontRecDetails spec={spec} />
		</CardBody>
	</Card>;
}

/**
 * Convenience for a button which toggles when pressed and released.
 * Uses pointer capture so release fires when the mouse is released, even if the pointer has moved off.
 */
function HoldButton({onPress, onRelease, Tag = 'button', children, ...props}) {
	const allProps = {
		onPointerDown: e => {
			e.target.setPointerCapture(e.pointerId);
			onPress(e);
		},
		onPointerUp: e => {
			onRelease(e);
			e.target.releasePointerCapture(e.pointerId);
		},
		...props
	};
	return <Tag {...allProps}>{children}</Tag>;
}


const fileType = filename => {
	const extMatch = filename.match(/\.[^.]+$/);
	if (extMatch) return extMatch[0];
	return '(none)';
}


function ImgRecDetails({spec}) {
	const [open, setOpen] = useState(false);
	const [showOriginal, setShowOriginal] = useState(false);
	const toggle = () => setOpen(a => !a);

	// No details to show for images that analysis suggests are unused.
	if (spec.unused) return null;

	// TODO controls for retina, no-scale, etc

	const { url, optUrl, imgEl } = spec;
	let { width, height } = spec.elements[0];
	const imgStyle = { maxWidth: width, maxHeight: height };

	const desc = [];
	const origType = fileType(url);
	const optType = fileType(optUrl);
	if (origType !== optType) {
		desc.push(<li key="conversion">
			This image has been converted from <b>{origType}</b> to <b>{optType}</b> to improve compression efficiency.
		</li>);
	}

	if (width !== imgEl.naturalWidth || height !== imgEl.naturalHeight) {
		desc.push(<li key="scaled">
			This image has been scaled from its original size of <b>{imgEl.naturalWidth}x{imgEl.naturalHeight}</b> to the size it appears on-screen, <b>{Math.floor(width)}x{Math.floor(height)}</b>.
		</li>);
	}

	return <>
		<Button onClick={toggle}>Details</Button>
		<Modal isOpen={open} className="recommendation-details-modal image-details" toggle={toggle}>
			<ModalHeader toggle={toggle}>Image Optimisation</ModalHeader>
			<ModalBody>
				<div className="img-comparison-container">
					<div className="img-comparison">
						<img className="original" style={imgStyle} src={url} />
						<img className="optimised" style={{...imgStyle, opacity: showOriginal ? 0 : 1}} src={optUrl} />
					</div>
					<div className="version-indicator">{showOriginal ? 'Original' : 'Optimised'}</div>
					<div className="preview-toggle">
						<HoldButton
							Tag={Button}
							onPress={() => setShowOriginal(true)}
							onRelease={() => setShowOriginal(false)}
						>
							Show Original
						</HoldButton>
					</div>
				</div>
				<ul>{desc}</ul>
			</ModalBody>
		</Modal>
	</>
};


export function ImgRecommendation({spec}) {
	const { url } = spec;

	return <Card className="opt-rec img-rec">
		<CardHeader>Image</CardHeader>
		<div className="img-preview-container p-1">
			<img className="preview img-preview" src={url} />
		</div>
		<CardBody className="p-2">
			<SizeComparison spec={spec} />
			<UnusedWarning spec={spec} />
			<ImgRecDetails spec={spec} />
		</CardBody>
	</Card>;
}


export function GifRecommendation({spec}) {
	const { url } = spec;

	return <Card className="opt-rec gif-rec">
		<CardHeader>GIF</CardHeader>
		<img className="preview gif-preview p-1" src={url} />
		<CardBody className="p-2">
			<SizeComparison spec={spec} />
			<UnusedWarning spec={spec} />
		</CardBody>
	</Card>;
}


export function SvgRecommendation({spec}) {
	const { url } = spec;

	return <Card className="opt-rec svg-rec">
	<CardHeader>SVG Image</CardHeader>
	<div className="img-preview-container p-1">
		<img className="preview img-preview" src={url} />
	</div>
	<CardBody className="p-2">
		<SizeComparison spec={spec} />
		<UnusedWarning spec={spec} />
	</CardBody>
	</Card>;
}


export function ScriptRecommendation({spec}) {
	const { filename } = spec;

	return <Card className="opt-rec script-rec">
	<CardHeader>JavaScript</CardHeader>
	<CardBody className="p-2">
		<p className="preview script-preview my-1">{filename}</p>
		<SizeComparison spec={spec} />
		<UnusedWarning spec={spec} />
		{spec?.message}
	</CardBody>
	</Card>;
}


const recComponents = {
	image: ImgRecommendation,
	font: FontRecommendation,
	gif: GifRecommendation,
	svg: SvgRecommendation,
	script: ScriptRecommendation
};


export function Recommendation({spec, ...props}) {
	const RecComponent = recComponents[spec.type];
	if (!RecComponent) debugger;
	if (!RecComponent) return null;
	return <RecComponent spec={spec} {...props} />;
};


/**
 * Breakdown of data types on a page
 * @param {object} p
 * @param {object} p.manifest PageManifest
 * @param {boolean} [p.separateSubframes] True to roll all transfers inside sub-frames into one "sub-frame content" line
 */
export function TypeBreakdown({manifest, separateSubframes}) {
	if (!manifest) return null;
	const [breakdown, setBreakdown] = useState();
	useEffect(() => setBreakdown(typeBreakdown(manifest, separateSubframes)), [manifest]);
	if (!breakdown) return null;

	return (
		<div className="type-breakdown">
			<div className="breakdown-bar">
				{breakdown.map(({title, fraction, color}) => (
					<div className="bar-segment"
						title={title}
						style={{flexBasis: `${fraction * 100}%`, backgroundColor: color}}
					/>
				))}
			</div>
			<Table className="breakdown-table" size="sm">
				<thead>
					<tr><th /><th>Type</th><th>Bytes</th><th>% Total</th></tr>
				</thead>
				<tbody>
					{breakdown.map(({color, title, bytes, fraction = 0}) => <tr>
						<td><div className="breakdown-key" style={{backgroundColor: color}} /></td>
						<td>{title}</td>
						<td>{bytes}</td>
						<td>{(fraction * 100).toFixed(1)}%</td>
					</tr>)}
				</tbody>
			</Table>
		</div>
	);
}
