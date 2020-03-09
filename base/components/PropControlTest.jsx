import React, { useState, useEffect } from 'react';
import PropControl, { FormControl } from './PropControl';
import Misc from './Misc';
// import C from '../C';
import DataStore from '../plumbing/DataStore';
// import { WINDOW_RESIZED } from '../../adunit/src/constants/actionTypes';

/** All of your favourite PropControl components in one place.
 *  The purpose of this page is to allow testers to gauge the current state of PropControl without having to look at every page in the portal.
 *  PropControl 'types' covered:
 *  checkbox
 * 	money
 * 	videoUpload
 *  url
 *  select
 *  textarea
 *  date
 */

const testPath = ['widget', 'propcontroltest'];

/**
 * tag -> {
 * 	initialValue: {?Object} provide an initial value if you want to test handling of preset state,
 * 	type, label, prop
 * 	...misc params which will be passed into the PropControl
 * }
 */
const propControlObj4tag = {
	text: {
		type: 'text',
		label: <span>Text field: <code>text</code></span>,
		prop: 'text',
		required: true,
		tooltip: 'Could this be a test, ye',
		help: 'This is the help text. Please type whatever',
	},
	textarea: {
		type: 'textarea',
		label: <span>Text area: <code>textarea</code></span>,
		prop: 'textarea',
	},
	search: {
		type: 'search',
	},
	checkbox: {
		type: 'checkbox',
		label: 'checkbox',
		prop: 'checkbox',
	},
	yesno: {
		type: 'yesNo',
		label: <span>Yes/No radial: <code>yesNo</code></span>,
		prop: 'yesNo',
	},
	date: {
		type: 'date',
		label: <span>Takes a string in yyyy-mm-dd format, outputs a formatted version (eg. 11 Nov 1994)<code>date</code></span>,
		prop: 'date',
	},
	img: {
		type: 'img',
		label: <span>Image. Takes a url string and displays preview: <code>img</code></span>,
		prop: 'img',
	},
	select: {
		type: 'select',
		label: <span>Select: <code>select</code></span>,
		prop: 'select',
		options: ['apple', 'pear'],
	},
	'select-multiple': {
		type: 'select',
		label: <span>Select, multiple options. Returns array: <code>select</code></span>,
		prop: 'select-multiple',
		options: ['apple', 'pear', 'orange', 'kiwi', 'banana'],
		multiple: true,
	},
	'radio-map': {
		type: 'radio',
		label: <span>Radio component that takes an <b>array</b> for its labels: <code>radio</code></span>,
		prop: 'radio-map',
		options: ['a', 'b', 'c'],
		labels: ['Label 1', 'Label 2', 'Label 3'],
	},
	'radio-function': {
		type: 'radio',
		label: <span>Radio component that takes a <b>function</b> for its labels: <code>radio</code></span>,
		prop: 'radio-function',
		options: [1, 2, 3],
		labels: optionValue => { const optionName = 'Function generated label ' + optionValue; return optionName; },
	},
	url: {
		type: 'url',
		label: <span>Url. Takes url string, offers link to new tab. Https required: <code>url</code></span>,
		prop: 'url',
		https: true,
	},
	color: {
		type: 'color',
		label: <span>Colour picker by hand or hex value: <code>color</code></span>,
		prop: 'color',
	},
	// location: {
	// 	type: 'location',
	// 	label: <span>Location: <code>location</code></span>,
	// 	prop: 'location',
	// },
	money: {
		type: 'Money',
	},
	moneydollars: {
		type: 'Money',
		currency: 'USD',
		changeCurrency: false,
	},
	moneyNamed: {
		type: 'Money',
		name: 'Rainy Day',
		initialValue: { name: 'Rainy Day', value: 1.5 },
	},
	number: {
		type: 'number',
		label: <span>Number: <code>number</code></span>,
		prop: 'prop',
	},
	year: {
		type: 'year',
		label: <span>Year (parses value, returns int or null): <code>year</code></span>,
		prop: 'year',
	},
	arraytext: {
		type: 'arraytext',
		label: <span>Display a value as 'a b c' but store as ['a', 'b', 'c'] <br /> Used to edit variant.style <code>arraytext</code></span>,
		prop: 'arraytext',
	},
	keyset: {
		type: 'keyset',
		label: <span>Keyset: <code>keyset</code></span>,
		prop: 'keyset',
	},
	entryset: {
		type: 'entryset',
		label: <span>Entryset: <code>entryset</code></span>,
		prop: 'entrysety',
	},
	address: {
		type: 'address',
		label: <span>Address: <code>address</code></span>,
		prop: 'address',
	},
	postcode: {
		type: 'postcode',
		label: <span>Postcode: <code>postcode</code></span>,
		prop: 'postcode',
	},
	json: {
		type: 'json',
		label: <span>JSON: <code>json</code></span>,
		prop: 'json',
	},

};

const availableTags = Object.keys(propControlObj4tag);

// Seed initialValue
availableTags.forEach(tag => {
	const { initialValue, prop } = propControlObj4tag[tag];
	if (!initialValue) return;
	DataStore.setValue(testPath.concat(prop || tag), initialValue);
});


const PropControlTest = () => {
	const widgetState = DataStore.getValue(testPath) || {};

	const [filterString, setFilterString] = useState('');

	let types = [];

	const query = new URLSearchParams(window.location.search);
	if (query.get('tags') && query.get('tags').length) {
		const queryArr = query.get('tags').split(',');
		types = queryArr;
	}

	const updateUrlQuery = tagArr => {
		window.history.pushState({ tags: tagArr }, '', `/?tags=${tagArr.join(',')}#propControlTest`);
	};

	const generateFilteredArray = () => {
		const arrayFromFilterString = filterString.split(' ');
		const tagArr = arrayFromFilterString.filter(tag => availableTags.includes(tag));
		availableTags.forEach(avTag => {
			arrayFromFilterString.forEach(inputTag => {
				if (avTag.includes(inputTag)) { tagArr.push(avTag); }
			});
		});
		return Array.from(new Set(tagArr));
	};

	const handleFilterChange = e => {
		setFilterString(e.target.value);
		const uniqueArr = generateFilteredArray();
		if (uniqueArr.length !== types.length) {
			types = uniqueArr;
			updateUrlQuery(uniqueArr);
		}
	};

	const handleResetClick = () => { DataStore.setValue(testPath, {}); };

	// Render the prop cards depending on the tags selected.
	const renderTestCards = () => {
		const tagList = (types && types.length) ? types : availableTags;
		if (!tagList.length) return null;
		return tagList.map(tag => {
			const obj = propControlObj4tag[tag];
			// rest = {options, labels, https} -- whatever you want to pass in
			let { type, label, prop = tag, initialValue, options, https, labels, required, help, ...rest } = obj;
			return (
				<div key={tag} className="well card-item">
					<PropControl path={testPath}
						type={type}
						label={label || tag}
						prop={prop}
						options={options || ''}
						https={https || ''}
						labels={labels || ''}
						required={required}
						help={help || ''}
					/>
					<div className="output-box">
						{JSON.stringify(widgetState[prop])}
					</div>
				</div>
			);
		});
	};

	// use widgetstate.filter to only show prefix-matching controls
	return (
		<div className="page prop-control-test">
			<div className="option-box">
				<div className="form">
					<PropControl path={testPath}
						label="Filter control types"
						prop="filter"
						onChange={handleFilterChange}
						value={filterString}
					/>
					<button onClick={handleResetClick}
						type="button"
						className="btn btn-danger"
					>
						Clear Data
					</button>
				</div>
				<div className="tag-list">
					<h4>Available types:</h4>
					{availableTags.sort().join(' * ')}
				</div>
			</div>

			<div className="card-container">
				{renderTestCards()}
			</div>
			{/* { JSON.stringify(widgetState) }
			{ filterTags } */}
		</div>
	);
};

export default PropControlTest;
