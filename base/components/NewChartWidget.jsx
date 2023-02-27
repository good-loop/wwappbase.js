import React from 'react';

import { Line, Pie, Bar, Scatter } from 'react-chartjs-2';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import Annotation from 'chartjs-plugin-annotation';

import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, ArcElement, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { is, space } from '../utils/miscutils';

/** TODO We should be able to do this dynamically/selectively when components are rendered */
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, BarElement, Title, Tooltip, Legend, Annotation);

/**
 * ?? How do we set the size of the chart??
 *
 * @param {Object} p
 * @param {?number} p.width Set to null to inherit See https://github.com/reactchartjs/react-chartjs-2/issues/362
 * @param {?number} p.height Set to null to inherit
 * @param {Object} p.data { labels:string[], datasets:[{label, data:number[]}] } The labels and data arrays get paired up.
 * @param {Object} p.datalabels See https://www.npmjs.com/package/chartjs-plugin-datalabels
 * @param {?number} p.maxy max y scale (usually this is auto-fitted from the data)
 * @param {Object} p.options {scales: {x, y}, plugins}
 * @returns
 */
function NewChartWidget({ type = 'line', data, datalabels, className, style, width, height, miny, maxy, legend, ...props }) {
	props.options = props.options || {};
	props.options.maintainAspectRatio = props.options.maintainAspectRatio || false; // why??
	if (datalabels) {
		addPluginToProps(props, ChartDataLabels);
	}
	// set y scale?
	if (is(miny) || is(maxy)) {
		if (!props.options.scales) props.options.scales = {};
		if (!props.options.scales.y) props.options.scales.y = {};
		if (is(maxy)) props.options.scales.y.max = maxy;
		if (is(miny)) props.options.scales.y.min = miny;
	}
	// legend?
	addPluginToProps(props, Legend, { display: !!legend });
	let Chart = { line: Line, pie: Pie, bar: Bar, scatter: Scatter }[type];

	return (
		<div className={space('NewChartWidget position-relative', className)} style={style}>
			<Chart data={data} width={width} height={height} {...props} />
		</div>
	);
}

/**
 *
 * @param {!Object} props The top level `props`
 * @param plugin ChartJS Plugin e.g. Legend
 * @param {?Object} options
 */
function addPluginToProps(props, plugin, options) {
	if (props.plugins) {
		if (!props.plugins.includes(plugin)) {
			props.plugins.push(plugin);
		}
	} else {
		props.plugins = [plugin];
	}
	if (options) {
		if (!props.options.plugins) props.options.plugins = {};
		let po = props.options.plugins[plugin.id] || {};
		props.options.plugins[plugin.id] = Object.assign(po, options);
	}
}

export default NewChartWidget;
