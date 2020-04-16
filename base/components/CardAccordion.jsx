
import React from 'react';
import { Card as BSCard, CardHeader, CardTitle, CardBody } from 'reactstrap';
import Misc from './Misc';
import DataStore from '../plumbing/DataStore';
import { join } from './BS';


/**
 * A Bootstrap panel, with collapse behaviour if combined with CardAccordion.
 * This also provides some robustness via try-catch error handling.
 *
 * You can wrap these cards -- if you do, you MUST pass down misc parameters to enable the CardAccordion wiring to work. e.g.
 * <Foo {...stuff}> => <Misc.Card {...stuff}>
 * Note: If you see a card missing collapse controls -- this is probably the issue.
 *
 * @param {String|JSX} title - will be wrapper in h3 If this is null and titleChildren are null -- then there is no card header.
 *
 * TODO What is the use-case for titleChildren, titleClassName?? Deprecated??
 *
 * @param titleChildren jsx elements to put in the header (can be used with/without title)
 * @param {any} error - If set, colour the card red
 * @param warning {any} If set, colour the card yellow
 * @param {?String} className - Added to the BS panel classes
 * @param {?Boolean} collapse - If true, the children are not rendered.
 */

class Card extends React.Component {
	/**
	 * Use a component to limit errors to within a card
	 */
	componentDidCatch(error, info) {
		this.setState({error, info});
		console.error(error, info);
		if (window.onerror) window.onerror("Card caught error", null, null, null, error);
	}

	render() {
		// ??HACK expose this card to its innards via a global
		// Card.current = this;

		let {title, glyph, icon, children, className, onHeaderClick, collapse, titleChildren, titleClassName, warning, error, ...props} = this.props;
		// no body = no card. Use case: so card guts (where the business logic often is) can choose to hide the card.
		// Note: null should be returned from the top-level. If the null is returned from a nested tag, it may not be null yet, leading to the card showing.
		if (!children) { return null; }

		let header = null;
		if (title) {
			let hoverText = null;
			if (error && _.isString(error)) hoverText = error;
			else if (warning && _.isString(warning)) hoverText = warning;
			const caret = <Misc.Icon className='pull-right' fa={`caret-${collapse ? 'down' : 'up'}`} />;
			header = (
				<div className={onHeaderClick? 'btn btn-link' : null} onClick={onHeaderClick} title={hoverText}>
					{(glyph || icon) ? <Misc.Icon glyph={glyph} fa={icon} /> : null}
					{title || <span>&nbsp;</span>} {onHeaderClick ? caret : null}
				</div>
			);
		}

		// TODO use BS.Card -- but how to do collapse??
		const color = error ? 'danger' : warning ? 'warning' : null;
		const titleText = _.isString(header) ? header : null;

		return (
			<BSCard color={color} outline className={join(className, 'mb-3')} title={titleText}>
				<CardHeader className={`bg-${color}`}>{header}</CardHeader>
				{collapse ? null : <CardBody>{children}</CardBody>}
			</BSCard>
		);
	};
}; // ./Card


/**
 *
 * @param {?String} widgetName - Best practice is to give the widget a name.
 * @param {?Boolean} multiple - If true, allow multiple cards to stay open.
 * @param {Misc.Card[]} children
 *    children should be Misc.Card OR pass on ...other params to a Misc.Card. Otherwise the open/close clickers wont show.
 * @param {?Boolean} defaultOpen - Should all cards start open or closed? This is more normally set at the Card level.
 */
const CardAccordion = ({widgetName, children, multiple, start, defaultOpen}) => {
	// NB: accordion with one child is not an array
	if ( ! _.isArray(children)) {
		children = [children];
	}
	if (defaultOpen && ! multiple) console.warn("CardAccordion.jsx - defaultOpen=true without multiple=true is odd.");
	// filter null, undefined
	children = children.filter(x => !! x);
	// NB: React-BS provides Accordion, but it does not work with modular panel code. So sod that.
	// TODO manage state
	const wcpath = ['widget', widgetName || 'CardAccordion'];
	const openPath = wcpath.concat('open');
	let opens = DataStore.getValue(openPath); // type boolean[]
	// Check if there's a predefined initial open state for each child
	if ( ! opens) {
		if (defaultOpen !== undefined) {
			// start with all open (or closed)
			opens = children.concat().fill(defaultOpen);
		} else {
			let explicitOpen = false;
			opens = React.Children.map(children, (Kid, i) => {
				if ( ! Kid.props) {
					return false; // huh? seen Aug 2019 on Calstat
				}
				if (Kid.props.defaultOpen !== undefined) explicitOpen = true;
				return !! Kid.props.defaultOpen;
			});
			if ( ! explicitOpen) opens = [true]; // default to first kid open
		}
	}
	if ( ! children) {
		return (<div className='CardAccordion' />);
	}
	assert(_.isArray(opens), "Misc.jsx - CardAccordion - open not an array", opens);
	const kids = React.Children.map(children, (Kid, i) => {
		let collapse = ! opens[i];
		let onHeaderClick = e => {
			if ( ! multiple) {
				// close any others
				opens = [];
			}
			opens[i] = collapse;
			DataStore.setValue(openPath, opens);
		};
		// clone with click
		return React.cloneElement(Kid, {collapse, onHeaderClick: onHeaderClick});
	});
	return (
		<div className='CardAccordion'>
			{kids}
		</div>
	);
};

export default CardAccordion;
export {Card};
// HACK for older code
Misc.Card = Card;
Misc.CardAccordion = CardAccordion;

