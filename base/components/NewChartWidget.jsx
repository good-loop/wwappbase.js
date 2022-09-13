import React from 'react';

import { Line, Pie, Bar, Scatter } from 'react-chartjs-2';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import Annotation from 'chartjs-plugin-annotation';

import {
	Chart as ChartJS,
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
	ArcElement,
	BarElement,
	Title,
	Tooltip,
	Legend,
} from 'chart.js';
import { is, space } from '../utils/miscutils';

/** TODO We should be able to do this dynamically/selectively when components are rendered */
ChartJS.register(
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
	ArcElement,
	BarElement,
	Title,
	Tooltip,
	Legend,
	Annotation
);

/**
 * ?? How do we set the size of the chart??
 * 
 * @param {Object} p
 * @param {?number} p.width Set to null to inherit See https://github.com/reactchartjs/react-chartjs-2/issues/362
 * @param {?number} p.height Set to null to inherit
 * @param {Object} p.data { labels:string[], datasets:[] }
 * @param {Object} p.datalabels See https://www.npmjs.com/package/chartjs-plugin-datalabels
 * @param {?number} p.maxy max y scale (usually this is auto-fitted from the data)
 * @returns 
 */
const NewChartWidget = ({type = 'line', datalabels, className, style, width, height, miny, maxy, ...props}) => {
	props.options = props.options || {};
	props.options.maintainAspectRatio = props.options.maintainAspectRatio || false; // why??
	if (datalabels) {
		if (props.plugins) {
			if ( ! props.plugins.includes(ChartDataLabels)) {
				props.plugins.push(ChartDataLabels);
			}
		} else {
			props.plugins = [ChartDataLabels];
		}
	}
	// set y scale?
	if (is(miny) || is(maxy)) {
		if ( ! props.options.scales) props.options.scales = {};
		if ( ! props.options.scales.y) props.options.scales.y = {};
		if (is(maxy)) props.options.scales.y.max = maxy;
		if (is(miny)) props.options.scales.y.min = miny;
    }
	let Chart = {line:Line, pie:Pie, bar:Bar, scatter:Scatter}[type];
	
	return <div className={space("NewChartWidget position-relative", className)} style={style}>
		<Chart width={width} height={height} {...props} />
	</div>;
};

export default NewChartWidget;