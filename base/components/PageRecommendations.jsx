import React, { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader } from 'reactstrap';

import ServerIO from '../plumbing/ServerIOBase';
import { makeRecommendations, proxy, RECOMPRESS_ENDPOINT } from '../utils/pageAnalysisUtils';
import printer from '../utils/printer';
import StyleBlock from './StyleBlock';
import PropControl from './PropControl';
import Misc from './Misc';
import { nonce } from '../data/DataClass';


const RECS_PATH = ['widget', 'page-recommendations'];


function Improvement({origSpec, optSpec}) {
	const { shortName, bytes: origBytes } = origSpec;
	const { url: optUrl, bytes: optBytes } = optSpec;

	// How much smaller?
	const improvement = (1 - (optBytes / origBytes));

	// Don't bother telling user about less than 1% improvement.
	if (improvement < 0.01) return <div>
		This resource is already optimally sized.
	</div>;

	return <div>
		<a href={optUrl} download={shortName}>Optimised version</a> is {printer.prettyInt(optBytes)} bytes ({(improvement * 100).toFixed(1)}% smaller)
	</div>;
}


export function FontRecommendation({spec}) {
	const { shortName, bytes, url, characters } = spec;
	const [optSpec, setOptSpec] = useState();
	const [previewNonce] = useState(nonce());

	useEffect(() => {
		setOptSpec(null);
		ServerIO.load(RECOMPRESS_ENDPOINT, { data: { url, type: 'font', characters } }).then(res => {
			setOptSpec({ ...res.data });
		});
	}, [url]);

	return <Card className="opt-rec font-rec">
		<CardHeader>Optimise Font</CardHeader>
		<div className="preview font-preview p-1">
			<StyleBlock>{`@font-face { font-family: "${previewNonce}"; src: url("${proxy(url)}"); }`}</StyleBlock>
			<div className="font-preview p-2" style={{fontFamily: previewNonce}}>
				{shortName}
			</div>
		</div>
		<CardBody className="p-2">
			<div>Original font is {printer.prettyInt(bytes)} bytes.</div>
			{characters ? <div>Restricted character usage found.</div> : null}
			{optSpec ? <Improvement origSpec={spec} optSpec={optSpec} /> : <Misc.Loading text="Optimising font file..." />}
		</CardBody>
	</Card>;
}


export function ImgRecommendation({spec}) {
	const { bytes, url } = spec;
	const [optSpec, setOptSpec] = useState();
	const noWebp = DataStore.getValue([...RECS_PATH, 'noWebp']) || false;

	useEffect(() => {
		ServerIO.load(RECOMPRESS_ENDPOINT, { data: { url, type: 'image', noWebp } }).then(res => {
			setOptSpec({ ...res.data });
		});
	}, [url, noWebp]);


	return <Card className="opt-rec img-rec">
		<CardHeader>Optimise Image</CardHeader>
		<img className="preview img-preview p-1" src={url} />
		<CardBody className="p-2">
			<div>Original image is {printer.prettyInt(bytes)} bytes.</div>
			<PropControl type="checkbox" path={RECS_PATH} prop="noWebp" label={`Can't use .webp`} />
			{optSpec ? <Improvement origSpec={spec} optSpec={optSpec} /> : <Misc.Loading text="Optimising image file..." />}
		</CardBody>
	</Card>;
}


export function GifRecommendation({spec}) {
	const { bytes, url } = spec;
	const [optSpec, setOptSpec] = useState();

	useEffect(() => {
		ServerIO.load(RECOMPRESS_ENDPOINT, { data: { url, type: 'gif' } }).then(res => {
			setOptSpec({ ...res.data });
		});
	}, [url]);

	return <Card className="opt-rec gif-rec">
		<CardHeader>Optimise GIF</CardHeader>
		<img className="preview gif-preview p-1" src={url} />
		<CardBody className="p-2">
			<div>Original GIF is {printer.prettyInt(bytes)} bytes.</div>
			{optSpec ? <Improvement origSpec={spec} optSpec={optSpec} /> : <Misc.Loading text="Converting GIF animation..." />}
		</CardBody>
	</Card>;
}


export function SvgRecommendation({spec}) {
	const { bytes, url } = spec;
	const [optSpec, setOptSpec] = useState();

	useEffect(() => {
		ServerIO.load(RECOMPRESS_ENDPOINT, { data: { url, type: 'svg' } }).then(res => {
			setOptSpec({ ...res.data });
		});
	}, [url]);

	return <Card className="opt-rec svg-rec">
	<CardHeader>Optimise SVG Image</CardHeader>
	<img className="preview img-preview p-1" src={url} />
	<CardBody className="p-2">
		<div>Original SVG image is {printer.prettyInt(bytes)} bytes.</div>
		{optSpec ? <Improvement origSpec={spec} optSpec={optSpec} /> : <Misc.Loading text="Optimising SVG image..." />}
	</CardBody>
	</Card>;
}

export function ScriptRecommendation({spec}) {
	const { shortName, bytes, url } = spec;
	const [optSpec, setOptSpec] = useState();

	useEffect(() => {
		ServerIO.load(RECOMPRESS_ENDPOINT, { data: { url, type: 'script' } }).then(res => {
			setOptSpec({ ...res.data });
		});
	}, [url]);

	return <Card className="opt-rec script-rec">
	<CardHeader>Optimise JavaScript</CardHeader>
	<p className="preview script-preview p-1">
		<a href={url}>{shortName}</a>
	</p>
	<CardBody className="p-2">
		<div>Original JavaScript file is {printer.prettyInt(bytes)} bytes.</div>
		{optSpec ? <Improvement origSpec={spec} optSpec={optSpec} /> : <Misc.Loading text="Minifying JavaScript..." />}
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


/**
 * @param {object} p Props
 * @param {object} p.manifest A page manifest from MeasureServlet
 * 
 * @return {JSX.Element[]} An array of elements containing recommendations for improving bandwidth usage on the analysed page
 */
function PageRecommendations({manifest, ...props}) {
	if (!manifest) return null;
	const [recommendations, setRecommendations] = useState([]);
	useEffect(() => setRecommendations(makeRecommendations(manifest)), [manifest]);

	return recommendations.map(spec => {
		const RecComponent = recComponents[spec.type];
		if (!RecComponent) return null;
		return <RecComponent spec={spec} {...props} />
	});
}


export default PageRecommendations;
