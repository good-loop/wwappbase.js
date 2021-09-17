
import React, { useEffect, useState } from 'react';
import { Card as BSCard, CardHeader, CardBody, Button } from 'reactstrap';
import Misc from './Misc';
import DataStore from '../plumbing/DataStore';
import { space } from '../utils/miscutils';


/**
 * A Bootstrap panel, with collapse behaviour if combined with CardAccordion.
 * This also provides some robustness via try-catch error handling.
 *
 * You can wrap these cards -- if you do, you MUST pass down misc parameters to enable the CardAccordion wiring to work. e.g.
 * <Foo {...stuff}> => <Card {...stuff}>
 * Note: If you see a card missing collapse controls -- this is probably the issue.
 *
 * @param {String|JSX} title - will be wrapped in h3 If this is null and titleChildren are null -- then there is no card header.
 * @param {?String} icon used with Misc.Icon
 * @param {?String} logo Url for a logo
 * @param {any} error - If set, colour the card red
 * @param {?string} warning - If set, colour the card yellow
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

		let { title, glyph, icon, logo, children, className, onHeaderClick, collapse, warning, error } = this.props;
		// no body = no card. Use case: so card guts (where the business logic often is) can choose to hide the card.
		// Note: null should be returned from the top-level. If the null is returned from a nested tag, it may not be null yet, leading to the card showing.
		if (!children) return null;

		const color = error ? 'danger' : warning ? 'warning' : null;
		
		// Is the title something we can use as a tooltip as well?
		const titleText = _.isString(title) ? title : null;

		// Header modifiers
		let headerClasses = [];
		if (onHeaderClick) headerClasses.push('btn btn-link');
		if (color) {
			headerClasses.push(`bg-${color}`);
			headerClasses.push(error ? 'text-white' : warning ? 'text-dark' : null)
		}

		// Error or warning to show user?
		const alert = (error && _.isString(error)) ? (
			<Misc.Icon fa="exclamation-triangle" color={color} title={error} className="mr-2" />
		) : (warning && _.isString(warning)) ? (
			<Misc.Icon fa="exclamation-circle" color={color} title={warning} className="mr-2" />
		) : null;

		// Clickable header takes a caret to signify it's clickable
		const caret = onHeaderClick ? (
			<Misc.Icon className="pull-right" fa={`caret-${collapse ? 'down' : 'up'}`} />
		) : null;

		return (
			<BSCard color={color} outline className={space(className, 'mb-3')}>
				<CardHeader className={space(headerClasses)} onClick={onHeaderClick} title={titleText}>
					{(glyph || icon) && <Misc.Icon glyph={glyph} fa={icon} className="mr-2"/>}
					{title && <span className="mr-2">{title}</span>}
					{logo && <img className="logo-sm rounded" src={logo} />}
					{alert}
					{caret}
				</CardHeader>
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
const CardAccordion = ({ children, multiple, defaultOpen}) => {
	// NB: accordion with one child is not an array
	if (!_.isArray(children)) children = [children];

	// filter null, undefined
	children = children.filter(x => !!x);

	const [opens, setOpens] = useState([true]); // default to first child panel open

	useEffect(() => {
		if (defaultOpen && !multiple) {
			console.warn("CardAccordion.jsx - defaultOpen=true without multiple=true is odd.");
		}
		if (defaultOpen !== undefined) {
			// start with all open/closed
			setOpens(children.concat().fill(defaultOpen));
		} else {
			// Child without props seen Aug 2019 on Calstat
			setOpens(React.Children.map(children, ({props}) => (props && !!props.defaultOpen)));
		}
	}, []);

	if (!children) return <div className="CardAccordion" />;

	assert(_.isArray(opens), "Misc.jsx - CardAccordion - opens not an array", opens);

	return (
		<div className="CardAccordion">
			{React.Children.map(children, (child, i) => {
				let collapse = !opens[i];
				let onHeaderClick = e => {
					// Not in multiple mode ? Close all other cards
					const newOpens = multiple ? opens.slice() : [];
					newOpens[i] = collapse;
					setOpens(newOpens);
				};
				// Clone child, adding collapse and header-click props
				return React.cloneElement(child, {collapse, onHeaderClick});
			})}
		</div>
	);
};

export default CardAccordion;
export {Card};
// HACK for older code
Misc.Card = Card;
Misc.CardAccordion = CardAccordion;

