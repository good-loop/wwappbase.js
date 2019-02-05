
import React from 'react';
import Misc from './Misc';
import DataStore from '../plumbing/DataStore';
import { join } from 'wwutils';

/**
 * A Bootstrap panel, with collapse behaviour if combined with CardAccordion.
 * 
 * You can wrap these cards -- if you do, pass down misc parameters to enable the CardAccordion wiring to work. e.g.
 * <Foo {...stuff}> => <Misc.Card {...stuff}>
 * 
 * @param {String|JSX} title - will be wrapper in h3 If this is null and titleChildren are null -- then there is no card header.
 * @param titleChildren jsx elements to put in the header (can be used with/without title)
 * @param {any} error - If set, colour the card red
 * @param warning {any} If set, colour the card yellow
 * @param {?String} className - Added to the BS panel classes
 */
const Card = ({title, glyph, icon, children, className, onHeaderClick, collapse, titleChildren, warning, error, ...props}) => {
	// no body = no card. Use case: so card guts (where the business logic often is) can choose to hide the card.	
	// Note: null should be returned from the top-level. If the null is returned from a nested tag, it may not be null yet, leading to the card showing.
	if ( ! children) {
		return null; 
	}
	let header = null;
	if (title || titleChildren) {
		// if ( ! onHeaderClick) {
		// 	console.log("No onHeaderClick for "+className+" "+title);
		// }
		let hoverText = null;
		if (error && _.isString(error)) hoverText = error;
		else if (warning && _.isString(warning)) hoverText = warning;
		header = (
			<div className={join('panel-heading', onHeaderClick? 'btn-link' : null)} onClick={onHeaderClick} 
				title={hoverText} >
				<h3 className="panel-title">
					{icon? <Misc.Icon glyph={glyph} fa={icon} /> : null} 
					{title || <span>&nbsp;</span>} {onHeaderClick? <Misc.Icon className='pull-right' glyph={'triangle-'+(collapse?'bottom':'top')} /> : null}
				</h3>
				{ titleChildren }
			</div>
		);
	}

	let panelType = "panel-default"
	if (error) panelType = "panel-danger";
	else if (warning) panelType = "panel-warning";

	return (
		<div className={join("Card panel", panelType, className)}>
			{header}
			<div className={'panel-body' + (collapse? ' collapse' : '') }>
					{collapse? null : children}
				</div>
		</div>
	);
};

/**
 * 
 * @param {?String} widgetName - Best practice is to give the widget a name.
 * @param {Misc.Card[]} children
 *    children should be Misc.Card OR pass on ...other params to a Misc.Card. Otherwise the open/close clickers wont show.
 */
const CardAccordion = ({widgetName, children, multiple, start, showFilter}) => {
	// NB: accordion with one child is not an array
	if ( ! _.isArray(children)) {
		children = [children];
	}
	// filter null, undefined
	children = children.filter(x => !! x);
	showFilter = false; // TODO a keyword filter for big settings pages
	// NB: React-BS provides Accordion, but it does not work with modular panel code. So sod that.
	// TODO manage state
	const wcpath = ['widget', widgetName || 'CardAccordion'];
	const openPath = wcpath.concat('open');
	let open = DataStore.getValue(openPath);
	// Check if there's a predefined initial open state for each child
	if ( ! open) {
		let explicitOpen = false;
		open = React.Children.map(children, (Kid, i) => {
			if (Kid.props.defaultOpen !== undefined) explicitOpen = true;
			return !!Kid.props.defaultOpen;
		});
		if (!explicitOpen) open = [true]; // default to first kid open
	}
	if ( ! children) {
		return (<div className='CardAccordion' />);
	}
	assert(_.isArray(open), "Misc.jsx - CardAccordion - open not an array", open);
	// TODO keyword filter
	const kids = React.Children.map(children, (Kid, i) => {
		let collapse = ! open[i];
		let onHeaderClick = e => {
			if ( ! multiple) {
				// close any others
				open = [];
			}
			open[i] = collapse;
			DataStore.setValue(openPath, open);
		};
		// clone with click
		return React.cloneElement(Kid, {collapse, onHeaderClick: onHeaderClick});
	});
	return (
		<div className='CardAccordion'>
			{ showFilter ? (
				<div className='form-inline'><Misc.PropControl path={wcpath} prop='filter' label='Filter' inline /></div>
				) : null }
			{kids}
		</div>
	);
};

export default CardAccordion;
export {Card};
// HACK for older code
Misc.Card = Card;
Misc.CardAccordion = CardAccordion;

