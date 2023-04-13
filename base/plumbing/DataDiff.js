import { useEffect } from 'react';
import JSend from '../data/JSend';
import C from '../CBase';
import _ from 'lodash';
import PromiseValue from '../promise-value';

import DataClass, {getId, getType, getStatus} from '../data/DataClass';
import { assert, assMatch } from '../utils/assert';
import {parseHash, toTitleCase, is, space, yessy, getUrlVars, decURI, getObjectValueByPath, setObjectValueByPath, stopEvent} from '../utils/miscutils';
import KStatus from '../data/KStatus';
import { modifyPage } from './glrouter';
import DataStore, {getDataPath} from './DataStore';


class DataDiff {}

/** Track change history on an object. */
DataDiff.DATA_HISTORY_PROPERTY = 'localHistory';
/** Limit how many changes are saved globally. Set to 0 for no limit */
DataDiff.GLOBAL_HISTORY_LIMIT = 100;
/** What needs to record history? Set to falsy to disable history tracking */
DataDiff.DATA_HISTORY_TRACKING = 'trackingHistory';
/** Configuration for data diff tracking (e.g. ctrl+z captures, storing url, etc) */
DataDiff.DATA_TRACKING_OPTIONS = 'trackingOptions';

/**
 * Tell DataStore about a change to an object to record in history
 * @param {C.TYPES} type
 * @param {!String} id
 * @param {C.STATUS} diff property change
 * @param {?boolean} mergeAll ignore fancy checks and merge diffs regardless? e.g. undo
 * @param {?boolean} update Request a react rerender
 * @return "dirty", "clean", etc. -- see C.STATUS
 */
DataDiff.registerDataChange = (type, id, diff, mergeAll, update) => {
    assert(C.TYPES.has(type));
    assert(id, "DataStore.registerLocalChange: No id?! getData "+type);
    assert(diff, "DataStore.registerLocalChange: No diff?! "+type+":"+id);
    if ( ! DataDiff.DATA_HISTORY_PROPERTY) return null;

    // register change in global history
    const dataPath = getDataPath({status:C.KStatus.DRAFT, type, id});
    let globalHistoryPath = ['transient', 'global', DataDiff.DATA_HISTORY_PROPERTY];
    let globalHistory = DataStore.getValue(globalHistoryPath) || [];
    const globalDiff = _.cloneDeep(diff);
    globalDiff.path = "/"+dataPath.join("/")+diff.path;

    // attach URL if asked to
    const storeUrl = DataStore.getValue(['transient', DataDiff.DATA_TRACKING_OPTIONS, 'redirectOnUndo']);
    if (storeUrl) { 
        globalDiff.location = DataStore.getValue(['location']);
    }
    // globalHistory can be used for undo's - so we dont want to forget changes even if they result in no-op
    globalHistory = mergeAll ? DataDiff.addOrMergeGlobalDiff(globalHistory, globalDiff) : DataDiff.addOrMergeGlobalDiffPretty(globalHistory, globalDiff);
    // if we've gone above the global limit, trim back down
    if (DataDiff.GLOBAL_HISTORY_LIMIT && globalHistory.length > DataDiff.GLOBAL_HISTORY_LIMIT) globalHistory.splice(0, 1);
    DataStore.setValue(globalHistoryPath, globalHistory, false); // let's not update twice

    // register change in object history
    let objHistoryPath = DataDiff.getDataHistoryPath(type, id);
    let objHistory = DataStore.getValue(objHistoryPath) || [];
    // We add the extra history data into data item diffs too - needed for merging
    // Is ommitted when asked for however (see getDataDiffs)
    objHistory = DataDiff.addOrMergeDataDiff(objHistory, diff);
    return DataStore.setValue(objHistoryPath, objHistory, update);
}

/**
 * update a history by adding or merging a change, ignorant of order
 * @param {*} history 
 * @param {*} diff 
 */
DataDiff.addOrMergeDataDiff = (history, diff) => {
    let merged = false;
    history = history.map(otherDiff => {
        if (otherDiff.path === diff.path) {
            const mergedDiff = mergeDataDiffs(otherDiff, diff, true);
            merged = true;
            return mergedDiff;
        }
        return otherDiff;
    }).filter(x => x);
    if (!merged) history.push(diff);
    return history;
}

/**
 * update a history of diffs with a new diff
 * @param {*} history 
 * @param {*} diff 
 */
DataDiff.addOrMergeGlobalDiff = (history, diff) => {
    let merged = false;
    if (history.length) {
        const lastDiff = history[history.length - 1];
        // was the last change also to this prop? if so, we can merge it
        if (lastDiff.path === diff.path) {
            const mergedDiff = mergeDataDiffs(lastDiff, diff, true);
            if (!mergedDiff) {
                // diffs cancelled out, delete it
                history.splice(history.length - 1, 1);
            } else {
                history[history.length - 1] = mergedDiff;
            }
            merged = true;
        }
    }
    if (!merged) history.push(diff);
    return history;
}

/**
 * update a history - includes checks for handling string updates (i.e. preserving no-ops but not recording every single character)
 * @param {*} diff 
 */
DataDiff.addOrMergeGlobalDiffPretty = (history, diff) => {
    let mergedDiff = null;
    let merged = false;
    if (history.length) {
        const lastDiff = history[history.length - 1];
        // we wont merge no-ops - but we will check for tiny changes to merge
        if (lastDiff.path === diff.path) {
            if (_.isString(lastDiff.value) && _.isString(diff.value)) {
                const s1 = lastDiff.value;
                const s2 = diff.value;
                const s1Minus1 = s1.substring(0, s1.length - 1);
                const s2Minus1 = s2.substring(0, s2.length - 1);
                if (s1Minus1 === s2) {										// check for one character removed
                    mergedDiff = mergeDataDiffs(lastDiff, diff, true);
                    merged = true;
                } else if (s2Minus1 === s1) {		// check for one character added
                    let diffChar = s2.substring(s2.length - 1);
                    if (/^[a-zA-Z0-9]$/g.test(diffChar)) {					// if character changed is alpha-numeric, we can merge it
                        mergedDiff = mergeDataDiffs(lastDiff, diff, true);
                        merged = true;
                    }
                }
            }
        }
    }
    if (!merged) {
        history.push(diff);
    } else {
        if (!mergedDiff) {
            // diffs cancelled out, delete it
            history.splice(history.length - 1, 1);
        } else {
            history[history.length - 1] = mergedDiff;
        }
    }
    return history;
}

DataDiff.getDataHistoryPath = (type, id) => {
    return ['transient', type, id, DataDiff.DATA_HISTORY_PROPERTY];
}

/**
 * Get the local edit diffs of a data item - json-patch compatible
 * @param {C.TYPE} type 
 * @param {String} id 
 */
DataDiff.getDataDiffs = (type, id) => {
    assert(C.TYPES.has(type), "DataStore.getDataDiffs "+type);
    assert(id, "DataStore.getDataDiffs: No id?! getData "+type);
    // Remove extra data so these diffs are json-patch compatible
    return (DataStore.getValue(DataDiff.getDataHistoryPath(type, id)) || []).map(d => {return {op:d.op, path:d.path, value:d.value}});
}

/**
 * Get the local edit history of a specific prop
 * @param {*} type 
 * @param {*} id 
 * @param {*} path 
 */
DataDiff.getDataDiffsForProp = (type, id, path) => {
    assert(C.TYPES.has(type), "DataStore.getDataDiffsForProp "+type);
    assert(id, "DataStore.getDataDiffsForProp: No id?! getData "+type);
    assert(path, "DataStore.getDataDiffsForProp No path? "+path);
    return DataDiff.getDataDiffs(type, id).filter(diff => diff.path === "/"+path.join("/"));
}

DataDiff.getDataDiffsForProps = (type, id, paths) => {
    assert(C.TYPES.has(type), "DataStore.getDataDiffsForProps "+type);
    assert(id, "DataStore.getDataDiffsForProps: No id?! getData "+type);
    assert(paths, "DataStore.getDataDiffsForProps No paths? "+paths);
    let strPaths = paths.map(path => "/"+path.join("/"));
    return DataDiff.getDataDiffs(type, id).filter(diff => strPaths.includes(diff.path));
}

DataDiff.clearDataDiffs = (type, id, update) => {
    assert(C.TYPES.has(type), "DataStore.clearDataHistory "+type);
    assert(id, "DataStore.clearDataHistory: No id?! getData "+type);
    return DataStore.setValue(['transient', type, id, DataDiff.DATA_HISTORY_PROPERTY], null, update);
}

DataDiff.getGlobalHistory = () => {
    return DataStore.getValue(['transient', 'global', DataDiff.DATA_HISTORY_PROPERTY]) || [];
}

DataDiff.clearGlobalHistory = (update) => {
    return DataStore.setValue(['transient', 'global', DataDiff.DATA_HISTORY_PROPERTY], null, update);
}

DataDiff.setGlobalHistory = (newHistory, update) => {
    return DataStore.setValue(['transient', 'global', DataDiff.DATA_HISTORY_PROPERTY], newHistory, update);
}

/**
 * Get the last local change made to a data item
 * @param {*} type 
 * @param {*} id 
 */
DataDiff.getLastDataDiff = (type, id) => {
    assert(C.TYPES.has(type), "DataStore.getLastDataDiff "+type);
    assert(id, "DataStore.getLastDataDiff: No id?! getData "+type);
    const history = DataDiff.getDataDiffs(type, id);
    if (history.length) return history[history.length - 1];
    return null;
}

DataDiff.getLastGlobalDiff = () => {
    //assert(C.TYPES.has(type), "DataStore.getLastDataDiff "+type);
    //assert(id, "DataStore.getLastDataDiff: No id?! getData "+type);
    const history = DataDiff.getGlobalHistory();
    if (history.length) return history[history.length - 1];
    return null;
}

DataDiff.undoLastGlobalDiff = (update) => {
    const lastDiff = DataDiff.getLastGlobalDiff();
    if (!lastDiff) return;
    DataStore.setValue(lastDiff.path.substr(1, lastDiff.path.length - 1).split("/"), lastDiff.from, update, true);
}

/**
 * undo a bunch of diffs in a oner
 * @param {Number} n 
 */
DataDiff.undoNGlobalDiffs = (n, update) => {
    assert(n>0, "DataDiff.undoNGlobalDiffs nonpositive n??");
    // Do all but one with no update
    for (let i = 0; i < n - 1; i++) {
        DataDiff.undoLastGlobalDiff(false);
    }
    // Last one can update
    DataDiff.undoLastGlobalDiff(update);
}

/**
 * WARNING: preferrably, use useDataHistory instead.
 * Let DataStore know that something needs to track history. Should be called once on component mount
 * Will warn if we have multiple components trying to track the same history
 * @returns {Object} tracker {type, id}
 */
DataDiff.registerHistoryTracker = (type, id) => {
    const path = ['transient', type, id, DataDiff.DATA_HISTORY_TRACKING];
    const tracker = DataStore.getValue(path);
    if (tracker) {
        // we already have some - keep count
        console.warn("DataDiff.registerHistoryTracker 2 trackers targeting the same item! This could indicate multiple components trying to save the same data");
        DataStore.setValue(path.concat("number"), tracker.number + 1);
    } else {
        DataStore.setValue(path, {type, id, number:1});
    }
}

/**
 * WARNING: preferrably, use useDataHistory instead.
 * Any components tracking history should call this when they unmount/are no longer needed
 * @param {Object} tracker
 */
DataDiff.unregisterHistoryTracker = (type, id) => {
    let tracking = DataStore.getValue(['transient', type, id, DataDiff.DATA_HISTORY_TRACKING]);
    if (!tracking) console.error("DataStore.unregisterTracker item not tracked?? Count is out of order!!", type, id);
    else if (tracking.number > 1) {
        DataStore.setValue(['transient', type, id, DataDiff.DATA_HISTORY_TRACKING, 'number'], tracking.number - 1);
        return;
    }
    // Tidy up
    DataDiff.clearDataDiffs(type, id, false);
    // Remove any references to changes made to this now untracked object in the global history
    /*let dataPath = "/"+DataStore.getDataPath({status:C.KStatus.DRAFT, type, id}).join("/");
    let globalHistory = DataDiff.getGlobalHistory();
    globalHistory = globalHistory.filter(diff => !diff.path.startsWith(dataPath));
    DataDiff.setGlobalHistory(globalHistory, false);*/
    DataStore.setValue(['transient', type, id, DataDiff.DATA_HISTORY_TRACKING], false);
}

DataDiff.getHistoryTrackers = () => {
    let trackers = [];
    const transient = DataStore.getValue(['transient']);
    Object.keys(transient).forEach(k => {
        if (!C.TYPES.has(k)) return;
        const type = transient[k];
        Object.values(type).forEach(id => {
            const tracker = id[DataDiff.DATA_HISTORY_TRACKING];
            if (tracker) trackers.push(tracker);
        });
    });
    return trackers;
}

/**
 * Create a DataStore compatible diff object for a change
 * @param {*} path 
 * @param {*} oldVal 
 * @param {*} newVal 
 */
export const makeDataDiff = (path, oldVal, newVal) => {
	return {
		op: "replace",
		path: "/"+path.join("/"),
		value: newVal,
		from: oldVal
	}
}

/**
 * Merge changes to the same prop into one change
 * @param {?*} oldDiff 
 * @param {*} newDiff 
 * @param {?Boolean} deleteNoOp if true, will return null if diffs cancel out
 */
export const mergeDataDiffs = (oldDiff, newDiff, deleteNoOp) => {
	if (!oldDiff) return newDiff;
	assert(oldDiff.path === newDiff.path, "mergeDataDiffs diff paths don't match?? "+oldDiff.path+", "+newDiff.path);
	if (deleteNoOp && _.isEqual(oldDiff.from,newDiff.value)) return null; // result is a no-op, diffs cancel out
	return {
        ...oldDiff, // preserve extra data in old diff
        ...newDiff, // preserve extra data in new diff (and override old)
		op: "replace",
		path: newDiff.path,
		value: newDiff.value,
		from: oldDiff.from
	}
}

const captureUndoEvent = e => {
	if (e.keyCode == 90 && e.ctrlKey) {
	  stopEvent(e);
      let redirect = DataStore.getValue(['transient', DataDiff.DATA_TRACKING_OPTIONS, 'redirectOnUndo']);
      const lastDiff = DataDiff.getLastGlobalDiff();
      if (redirect) {
        if (lastDiff && lastDiff.location) {
            modifyPage(lastDiff.location.path, lastDiff.location.params);
        }
      }
	  DataDiff.undoLastGlobalDiff();
      if (lastDiff) {
        const pid = lastDiff.path.substring(1).replaceAll("/","-");
        const propcontrol = document.getElementById(pid);
        propcontrol?.scrollIntoView({behavior:'smooth'});
      }
  }
}

/**
 * Custom React hook for enabling automatic capture of Ctrl+Z events to trigger undos.
 * Will throw up if attempted to use more than once on a page! (Due to the potential for conflicting listeners and settings)
 * @param {?Boolean} redirectOnUndo 
 */
export const useCtrlZCapture = (redirectOnUndo) => {
    useEffect(() => {
        let capturing = DataStore.getValue(['transient', DataDiff.DATA_TRACKING_OPTIONS, 'capturing']);
        if (capturing) {
            console.error("useCtrlZCapture can't be used twice on a page! ",capturing);
            // if we throw errors in a react hook we'll cause the page to memory leak
            return;
        }
        document.addEventListener("keydown", captureUndoEvent, false);
        DataStore.setValue(['transient', DataDiff.DATA_TRACKING_OPTIONS, 'redirectOnUndo'], redirectOnUndo, false);
        DataStore.setValue(['transient', DataDiff.DATA_TRACKING_OPTIONS, 'capturing'], true);
        return () => {
            document.removeEventListener("keydown", captureUndoEvent, false);
            DataStore.setValue(['transient', DataDiff.DATA_TRACKING_OPTIONS, 'capturing'], false);
        }
    }, []);
};

/**
 * Custom React hook for components that need to track the history of a data item
 * @param {C.TYPE} type
 * @param {String} id
 */
export const useDataHistory = (type, id) => {
	assert(type, "useDataHistory no type??");
	assert(id, "useDataHistory no id??");

	// Register this as a history tracker on mount
	useEffect(() => {
		DataDiff.registerHistoryTracker(type, id);
		// Unregister on unmount
		return () => {
			DataDiff.unregisterHistoryTracker(type, id);
		}
	}, [type, id]);
}

export default DataDiff;
