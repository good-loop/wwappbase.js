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
				AaBb12!?
			</div>
		</div>
		<CardBody className="p-2">
			<div>Font {shortName} is {printer.prettyInt(bytes)} bytes.</div>
			{/* TODO Proxy font to fix CORS issues with preview */}
			{characters ? <>
				<div>Characters used in page: <code>{characters}</code></div>
				{optSpec ? <div>
					<a href={optSpec.url} download={shortName}>Optimised version</a> is {printer.prettyInt(optSpec.size)} bytes ({((1 - (optSpec.size / bytes)) * 100).toFixed(1)}% smaller)
				</div> : <Misc.Loading text="Generating optimised font..." />}
			</>: null}
		</CardBody>
	</Card>;
}


export function ImgRecommendation({spec}) {
	const { shortName, bytes, url } = spec;
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
			<div>Image {shortName} is {printer.prettyInt(bytes)} bytes.</div>
			<PropControl type="checkbox" path={RECS_PATH} prop="noWebp" label={`Can't use .webp`} />
			{optSpec ? <div>
				<a href={optSpec.url} download={shortName}>Optimised version</a> is {printer.prettyInt(optSpec.size)} bytes ({((1 - (optSpec.size / bytes)) * 100).toFixed(1)}% smaller)
			</div> : <Misc.Loading />}
		</CardBody>
	</Card>;
}


export function GifRecommendation({spec}) {
	const { shortName, bytes, url } = spec;

	return <Card className="opt-rec gif-rec">
		<CardHeader>Optimise FIG</CardHeader>
		<img className="preview gif-preview p-1" src={url} />
		<CardBody className="p-2">
			<div>GIF {shortName} is {printer.prettyInt(bytes)} bytes.</div>
			<div>TODO recompress</div>
		</CardBody>
	</Card>;
}


export function SvgRecommendation({spec}) {
	const { shortName, bytes, url } = spec;

	return <Card className="opt-rec svg-rec">
		<CardHeader>Optimise Inline SVG</CardHeader>
		<img className="preview font-preview p-1" src={url} />
		<CardBody className="p-2">
			<div>SVG {shortName} is {printer.prettyInt(bytes)} bytes.</div>
			<div>TODO recompress</div>
		</CardBody>
	</Card>;
}


const recComponents = {
	image: ImgRecommendation,
	font: FontRecommendation,
	gif: GifRecommendation,
	svg: SvgRecommendation,
	// script: ScriptRecommendation
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
