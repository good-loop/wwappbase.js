import React, { useRef, useEffect, useState } from 'react';
import { Button, Row, Col, Popover, PopoverBody, PopoverHeader } from 'reactstrap';
import { Tab, Tabs } from './Tabs';
//import { Card, CardHeader, CardBody } from 'reactstrap';
import { Card as CardCollapse } from './CardAccordion';
import { space, ellipsize, getObjectValueByPath } from '../utils/miscutils';
import { assert } from '../utils/assert';
import DataStore from '../plumbing/DataStore';
import DataDiff, { useCtrlZCapture } from '../plumbing/DataDiff';
import { jsonDiff, getDataItem, getDataItemClean } from '../plumbing/Crud';
import KStatus from '../data/KStatus';
import Icon from './Icon';
import { diffStringify } from './PropControl';
import { CopyToClipboardButton } from './Misc';
import SavePublishDeleteEtc from './SavePublishDeleteEtc';

const HistoryDisplay = ({className, ...props}) => {

    let trackers = DataDiff.getHistoryTrackers();

    useCtrlZCapture(true);

    let globalHistory = DataDiff.getGlobalHistory();
    // collapse similar entries
    let displayHistory = [];
    let displayDraft = [];
    
    globalHistory.forEach((diff, i) => {
        if (displayHistory.length && displayHistory[displayHistory.length - 1].path === diff.path) {
            displayHistory[displayHistory.length - 1].diffs.push(diff);
        } else displayHistory.push({path:diff.path, diffs:[diff], startIdx:i});
    });

    trackers.forEach(tracker => {
        const diffs = DataDiff.getDraftDataDiffs(tracker.type, tracker.id);
        if (!diffs.resolved) displayDraft.push({...tracker, loading:true});
        else if (!diffs.value) displayDraft.push({...tracker, unpublished:true});
        else {
            displayDraft.push({...tracker, diffs:diffs.value});
        }
    });

    // scrolling logic
    let endRef = useRef(null);
    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [globalHistory.length]);

    const onUndo = (startIdx) => {
        if (confirm("Are you sure you want to undo to this point?")) DataDiff.undoNGlobalDiffs(globalHistory.length - startIdx);
    }

    const title = <div className='d-inline-flex flex-row justify-content-between align-items-end w-75'>
        <h5 className='mb-1'>Changes</h5>
    </div>;

    const widgetPath = ['widget', 'HistoryDisplay'];
    const tabPath = widgetPath.concat("tab");

    if (!trackers.length) return null;

    return <CardCollapse title={title} uncontrolled className={space("history-display", className)} {...props}>
        <Tabs activeTabId={DataStore.getValue(tabPath) || 'history'} setActiveTabId={t => DataStore.setValue(tabPath, t)} >
            <Tab title="History" tabId="history" className="entries">
                {displayHistory.length ? displayHistory.map((diff, i) => {
                    return <HistoryEntry key={i} displayDiff={diff} onUndo={onUndo}/>;
                }) : <p className='color-gl-dark-grey'><i>... No Edits! :)</i></p>}
                <div id="history-end" ref={endRef}/>
            </Tab>
            <Tab title={"Unpublished"} tabId="unpublished" className="entries">
                {!trackers.length ? <p className='color-gl-dark-grey'><i>Nothing selected</i></p>
                : (<>
                    {displayDraft.length ? displayDraft.map((diff, i) => {
                        // HACK: force open single items
                        const forceOpen = displayDraft.length === 1;
                        return <DraftDiffEntry key={i} displayDiff={diff} forceOpen={forceOpen}/>;
                    }) : <p className='color-gl-dark-grey'><i>... No Changes! :)</i></p>}
                </>)}
                <div id="history-end" ref={endRef}/>
            </Tab>
        </Tabs>
    </CardCollapse>;

};

const HistoryEntry = ({displayDiff, onUndo}) => {
    assert(displayDiff);
    assert(displayDiff.diffs);

    const path = displayDiff.path.substring(1).split("/");
    const status = path[0];
    const type = path[1];
    const id = path[2];
    const prop = path[path.length - 1];
    const number = displayDiff.diffs.length;
    const diffs = displayDiff.diffs;
    const from = ellipsize(JSON.stringify(diffs[0].from), 20);
    const to = ellipsize(JSON.stringify(diffs[diffs.length-1].value), 20);
    const startIdx = displayDiff.startIdx;

    const [open, setOpen] = useState(false);

    return <>
        <div className='d-flex flex-row entry-container align-items-center'>
            <div className='d-flex flex-row justify-content-between entry py-1' onClick={() => setOpen(!open)}>
                <p className='mb-0'><small>{type}:{id}</small></p>
                <p className='mb-0'><small><b>{prop}</b> {number>1 && "("+number+")"}</small></p>
            </div>
            <code className="undo px-1 ml-2" onClick={() => onUndo(startIdx)}>X</code>
        </div>
        {open && <div className='entry-expand py-1'>
            <code className='diff-entry'>{from} >{number>1?" ... >":""} {to}</code>
        </div>}
    </>;
}

const DraftDiffEntry = ({displayDiff, forceOpen}) => {
    assert(displayDiff);
    
    const type = displayDiff.type;
    const id = displayDiff.id;
    const number = (displayDiff.loading || displayDiff.unpublished) ? 0 : displayDiff.diffs.length;

    const [stateopen, setOpen] = useState(forceOpen);

    const open = forceOpen || stateopen;

    return <div className='entry-container'>
        <div className='d-flex flex-row justify-content-between entry py-1' onClick={() => !forceOpen && setOpen(!open)}>
            <p className='mb-0'><small>{type}:{id}</small></p>
            <p className='mb-0'><small>{displayDiff.unpublished ? "N/A" : number+" changes"}</small></p>
            {!forceOpen && <small><Icon title={open?"collapse":"expand"} className="pull-right" name={`caret${open ? 'up' : 'down'}`} /></small>}
        </div>
        {open && <div className='entry-expand py-1'>
            <Row className='prop-entry'>
                {displayDiff.unpublished ? <Col><i>Not yet published!</i></Col> : (
                    displayDiff.loading ? <Col><i>Loading...</i></Col>
                    : displayDiff.diffs.map(diff => <DiffPropDisplay key={diff.path} diff={diff} type={type} id={id} trackpaths={displayDiff.trackpaths}/>)
                )}
            </Row>
        </div>}
    </div>
};

const DiffPropDisplay = ({diff, type, id, trackpaths}) => {
    const path = diff.path.substring(1).split("/");
    const prop = path[path.length - 1];
    const pubValStr = diffStringify(diff.from);
    const draftValStr = diffStringify(diff.value);
    const pubValShort = ellipsize(pubValStr, 20);
    const draftValShort = ellipsize(draftValStr, 20);
    const propid = type+"-"+id+diff.path.replaceAll("/","-");
    const popoverId = propid+"-popover";
    const tracked = trackpaths.includes(diff.path);

    let checkClipboardWarning = (pubValShort === draftValShort) ? (
        ' (Differences outside this excerpt - use clipboard button to inspect)'
    ) : '';

    const [open, setOpen] = useState(false);
    
    const toggle = () => {
		// TODO Pull this out and have a SelfClosingPopover element
		if (!open) {
			const maybeHidePopover = (e) => {
				const popoverEl = document.getElementById(popoverId);
				if (!popoverEl) return; // never got created due to error?
				if (popoverEl.contains(e.target)) return;
				setOpen(false);
				document.body.removeEventListener('click', maybeHidePopover);
			};
			document.body.addEventListener('click', maybeHidePopover);
		}
		setOpen(!open);
	};

    return <>
        <Col xs={4} key={diff.path} id={propid} className="diff-prop" onClick={toggle}>
            <small className={tracked && "tracked"}>{ellipsize(prop, 10)}</small>
        </Col>
        <Popover target={propid} id={popoverId} trigger="legacy" placement="auto" isOpen={open} toggle={toggle}>
            <PopoverHeader>Unpublished edit{!tracked && " (not watched!)"}</PopoverHeader>
            <PopoverBody>
                <div className="diff-line mb-1">
                    <strong>Pub</strong>
                    <code className="diff-val mx-1" title={pubValShort + checkClipboardWarning}>{pubValShort}</code>
                    <CopyToClipboardButton size="sm" text={pubValStr} />
                </div>
                <div className="diff-line">
                    <strong>Edit</strong>
                    <code className="diff-val mx-1" title={draftValShort + checkClipboardWarning}>{draftValShort}</code>
                    <CopyToClipboardButton size="sm" text={draftValStr} />
                </div>
            </PopoverBody>
        </Popover>
    </>;
}

export default HistoryDisplay;