import React from 'react';
import DataStore from '../plumbing/DataStore';
import Misc from './Misc';
import {assMatch, assert} from 'sjtest';
import {is} from 'wwutils';

// TODO refactor a la Misc.CardAccordion

const WizardProgressWidget = ({stageNum, stages, stagePath}) => {
	if ( ! stageNum) stageNum = 0;
	return (<div className='WizardProgressWidget'>
		{stages.map((stage, i) => <Stage key={i} stage={stage} stageNum={stageNum} i={i} stagePath={stagePath} />)}
	</div>);
};

const Stage = ({i, stage, stageNum, stagePath}) => {
	// Display in progress as complete if left of the current page
	let complete = i < stageNum;
	// if (stage.complete === false) complete = false; TODO stage.error/warning?
	let c = '';
	if (i == stageNum) {
		c = 'active';
	} else if (complete) {
		c = 'complete';
	}

	const maybeSetStage = () => complete && stagePath && DataStore.setValue(stagePath, i);

	return (
		<div className={'Stage '+c} onClick={maybeSetStage}>
			<h5 className='text-center above'>{stage.title}</h5>
			<center>
				<span className='marker'>&#11044;</span>
			</center>
			<hr className='line' />
			<h5 className='text-center below'>{stage.title}</h5>
		</div>
	);
};

/**
 * title
 * next, previous, sufficient, complete
 *
 * NB: these are used by the surrounding widgets - progress & next/prev buttons
 *
 * Also for convenient lazy setting of sufficient/complete, a function is passed to children:
 * setNavStatus({sufficient, complete})
 *
 * @param {?Boolean} sufficient default=true
 * @param {?Boolean} complete default=false
 *
 * To get this, the child must have a boolean setNavStatus flag, which gets replaced.
 * @param onNext function called when user interacts with "next" button
 * @param onPrev function called when user interacts with "prev" button
 */
const WizardStage = ({stageKey, stageNum, stagePath, maxStage, next, previous,
	sufficient=true, complete=false,
	title, onNext, onPrev, children}) =>
{
	assert(stageNum !==null && stageNum !== undefined);
	assMatch(maxStage, Number);
	if (stageKey != stageNum) { // allow "1" == 1
		return null; //<p>k:{stageKey} n:{stageNum}</p>;
	}

	// allow sections to set sufficient, complete, next, previous
	const navStatus = {next, previous, sufficient, complete};
	const setNavStatus = (newStatus) => {
		Object.assign(navStatus, newStatus);
	};
	// pass in setNavStatus
	if (children) {
		// array of elements (or just one)?
		if (children.filter) children = children.filter(x => !! x);
		children = React.Children.map(children, (Kid, i) => {
			// clone with setNavStatus?
			// But not on DOM elements cos it upsets React.
			// So only if they gave the setNavStatus flag.
			let sns = Kid.props && Kid.props.setNavStatus;
			if ( ! sns) return Kid;
			assert(sns===true, "WizardProgressWidget: setNavStatus must be boolean (it is replaced with a function): "+sns);
			return React.cloneElement(Kid, {setNavStatus});
		});
	}
	return (<div className='WizardStage'>
		{children}
		<WizardNavButtons stagePath={stagePath}
			navStatus={navStatus}
			maxStage={maxStage}
			onNext={onNext}
			onPrev={onPrev}
		/>
	</div>);
};


/**
 *
 * @param {
 * 	maxStage: {Number}
 * }
 */
const NextButton = ({complete, stagePath, maxStage, onNext, ...rest}) => {
	const bsClass = complete ? 'primary' : null;
	assMatch(maxStage, Number);
	return (<NextPrevTab stagePath={stagePath} bsClass={bsClass} diff={1}
		text={<span>Next <Misc.Icon fa="chevron-right" /></span>}
		maxStage={maxStage} {...rest} callback={onNext} />);
};
const PrevButton = ({stagePath, onPrev, ...rest}) => {
	return <NextPrevTab stagePath={stagePath} diff={-1} text={<span><Misc.Icon fa="chevron-left" /> Previous</span>} callback={onPrev} {...rest} />;
};

const NextPrevTab = ({stagePath, diff, text, bsClass='default', maxStage, callback, ...rest}) => {

	assMatch(stagePath, 'String[]');
	assMatch(diff, Number);
	assert(text, 'WizardProgressWidget.js - no button text');
	const stage = parseInt(DataStore.getValue(stagePath) || 0);

	if (stage === 0 && diff < 0) return null; // no previous on start
	if (maxStage && stage >= maxStage && diff > 0) return null; // no next on end

	const changeTab = () => {
		let n = stage + diff;
		DataStore.setValue(stagePath, n);
	};
	
	// use Bootstrap pull class to left/right float
	const pull = diff > 0? 'pull-right' : 'pull-left';

	return (
		<button className={`btn btn-${bsClass} btn-lg ${pull}`}
			onClick={() => {
				changeTab();
				if(callback) callback();
			}}
		{...rest} >
		{text}
		</button>
	);
};

const Wizard = ({widgetName, stagePath, children}) => {
	// NB: React-BS provides Accordion, but it does not work with modular panel code. So sod that.
	// TODO manage state
	const wcpath = stagePath || ['widget', widgetName || 'Wizard', 'stage'];
	let stageNum = DataStore.getValue(wcpath);
	if ( ! stageNum) stageNum = 0; // default to first kid open
	if ( ! children) {
		return (<div className='Wizard'></div>);
	}
	// filter null, undefined
	children = children.filter(x => !! x);
	// get stage info for the progress bar
	let stages = children.map( (kid, i) => {
		let props = Object.assign({}, kid.props);
		if ( ! props.title) props.title = 'Step '+i;
		return props;
	});
	// so next can recognise the end
	const maxStage = stages.length - 1;
	// add overview stage info to the stages
	let kids = React.Children.map(children, (Kid, i) => {
		// active?
		if (i != stageNum) {
			return null;
		}
		// clone with stageNum/path/key
		return React.cloneElement(Kid, {stageNum, stagePath, stageKey:i, maxStage});
	});
	// filter null again (we should now only have the active stage)
	kids = kids.filter(x => !! x);
	let activeStage = kids[0];

	return (<div className='Wizard'>
		<WizardProgressWidget stages={stages} stagePath={stagePath} stageNum={stageNum} />
		{kids}
	</div>);
};

const WizardNavButtons = ({stagePath, maxStage, navStatus, onNext, onPrev}) => {
	assert(stagePath, "WizardProgressWidget.jsx - WizardNavButtons: no stagePath");
	let {next, previous, sufficient, complete} = navStatus;
	// read from WizardStage props if set, or setNavStatus
	// navStatus;
	if (complete) sufficient = true;
	let msg = ! sufficient? 'Please fill in more of the form' : null;
	return (<div className='nav-buttons clearfix'>
		{previous===false? null :
			<PrevButton stagePath={stagePath} onPrev={onPrev} />
		}
		{next===false? null :
			<NextButton stagePath={stagePath} maxStage={maxStage} disabled={ ! sufficient} complete={complete} title={msg} onNext={onNext} />
		}
	</div>);
};

export {Wizard, WizardStage};
export default Wizard;
