import React, { useRef, useEffect, useState } from 'react';
//import { Card, CardHeader, CardBody } from 'reactstrap';
import { Card as CardCollapse } from './CardAccordion';
import { space, ellipsize } from '../utils/miscutils';
import { assert } from '../utils/assert';
import DataStore from '../plumbing/DataStore';
import DataDiff, { useCtrlZCapture } from '../plumbing/DataDiff';

const HistoryDisplay = ({className, ...props}) => {

    let trackers = DataDiff.getHistoryTrackers();

    useCtrlZCapture(true);

    let trackingText;
    if (trackers.length === 1) trackingText = trackers[0].type;
    else {
        let trackingTypes = {};
        trackers.forEach(tracker => {
            if (trackingTypes[tracker.type] === undefined) {
                trackingTypes[tracker.type] = 1;
            } else trackingTypes[tracker.type]++;
        });
        trackingText = Object.keys(trackingTypes).map(t => t+(trackingTypes[t]>1?" ("+trackingTypes[t]+")":"")).join(", ");
    }

    let globalHistory = DataDiff.getGlobalHistory();
    // collapse similar entries
    let displayHistory = [];
    globalHistory.forEach((diff, i) => {
        if (displayHistory.length && displayHistory[displayHistory.length - 1].path === diff.path) {
            displayHistory[displayHistory.length - 1].diffs.push(diff);
        } else displayHistory.push({path:diff.path, diffs:[diff], startIdx:i});
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
        <h5 className='mb-1'>History</h5>
        <small>{trackingText}</small>
    </div>;

    return <CardCollapse title={title} uncontrolled className={space("history-display", className)} {...props}>
        {displayHistory.length ? displayHistory.map((diff, i) => {
            return <HistoryEntry key={i} displayDiff={diff} onUndo={onUndo}/>
        }) : <p className='color-gl-dark-grey'><i>... No Edits! :)</i></p>}
        <div id="history-end" ref={endRef}/>
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
    
    /*const DiffEntry = ({diff}) => {
        const from = JSON.stringify(diff.from);
        const to = JSON.stringify(diff.value);
        return <p className='diff-entry'>{from} > {to}</p>;
    }*/

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

export default HistoryDisplay;