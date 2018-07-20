
import Misc from './Misc';

/**
 * A Bootstrap panel, with collapse behaviour if combined with CardAccordion.
 * 
 * You can wrap these cards -- if you do, pass down misc parameters to enable the CardAccordion wiring to work. e.g.
 * <Foo {...stuff}> => <Misc.Card {...stuff}>
 * 
 * @param title {String|JSX} will be wrapper in h3
 * @param error {any} If set, colour the card red
 * @param warning {any} If set, colour the card yellow
 */
const Card = ({title, glyph, icon, children, onHeaderClick, collapse, titleChildren, warning, error, ...props}) => {
	// no body = no card. Use case: so card guts (where the business logic often is) can choose to hide the card.
	if ( ! children) return null; 
	let header = '';
	if (title || onHeaderClick || titleChildren) {
		let hcssClasses = ['panel-heading', onHeaderClick? 'btn-link' : null].filter(x => !!x);
		header = (
			<div className={hcssClasses.join(" ")} onClick={onHeaderClick} >
				<h3 className="panel-title">
					{icon? <Misc.Icon glyph={glyph} fa={icon} /> : null} 
					{title || <span>&nbsp;</span>} {onHeaderClick? <Misc.Icon className='pull-right' glyph={'triangle-'+(collapse?'bottom':'top')} /> : null}
				</h3>
				{ titleChildren }
			</div>
		);
	}
	
	return (
		<div className={"Card panel " + (error? "panel-danger" : (warning? "panel-warning" : "panel-default")) }>
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
	// NB: accordion with one child is not an array
	if ( ! _.isArray(children)) {
		children = [children];
	}
	// TODO keyword filter
	// filter null, undefined
	children = children.filter(x => !! x);
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

