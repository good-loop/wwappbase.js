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
import { jsonDiff, getDataItemClean } from './Crud';


class DataDiff {}

/** Track change history on an object locally. */
DataDiff.DATA_LOCAL_DIFF_PROPERTY = 'localDiffs';
/** Track diffs on objects from draft to published */
DataDiff.DATA_DRAFT_DIFF_PROPERTY = 'draftDiffs';
/** Limit how many changes are saved globally. Set to 0 for no limit */
DataDiff.GLOBAL_HISTORY_LIMIT = 100;
/** What needs to record history? Set to falsy to disable history tracking */
DataDiff.DATA_HISTORY_TRACKERS = 'trackers';
/** Configuration for data diff tracking (e.g. ctrl+z captures, storing url, etc) */
DataDiff.DATA_TRACKING_OPTIONS = 'trackingOptions';

/**
 * Tell DataStore about a change to a draft object to record in history
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
    if ( ! DataDiff.DATA_LOCAL_DIFF_PROPERTY) return null;

    // register change in global history
    const dataPath = getDataPath({status:C.KStatus.DRAFT, type, id});
    let globalHistoryPath = ['transient', 'global', DataDiff.DATA_LOCAL_DIFF_PROPERTY];
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
    let objHistoryPath = DataDiff.getLocalDataDiffPath(type, id);
    let objHistory = DataStore.getValue(objHistoryPath) || [];
    // We add the extra history data into data item diffs too - needed for merging
    // Is ommitted when asked for however (see getDataDiffs)
    objHistory = DataDiff.addOrMergeDataDiff(objHistory, diff);
    DataStore.setValue(objHistoryPath, objHistory, false);

    // register the change as a new diff from draft and published
    let draftHistoryPath = DataDiff.getDraftDataDiffPath(type, id);
    let draftHistory = DataStore.getValue(draftHistoryPath) || [];
    draftHistory = DataDiff.addOrMergeDataDiff(draftHistory, diff);
    DataStore.setValue(draftHistoryPath, draftHistory, update);
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

DataDiff.getLocalDataDiffPath = (type, id) => {
    return ['transient', type, id, DataDiff.DATA_LOCAL_DIFF_PROPERTY];
}

DataDiff.getDraftDataDiffPath = (type, id) => {
    return ['transient', type, id, DataDiff.DATA_DRAFT_DIFF_PROPERTY];
}

/**
 * Get the local edit diffs of a data item - json-patch compatible.
 * Unlike getDraftDataDiffs, this is an immediate operation
 * @param {C.TYPE} type 
 * @param {String} id 
 * @returns {Array}
 */
DataDiff.getLocalDataDiffs = (type, id) => {
    assert(C.TYPES.has(type), "DataStore.getDataDiffs "+type);
    assert(id, "DataStore.getDataDiffs: No id?! getData "+type);
    // Remove extra data so these diffs are json-patch compatible
    return (DataStore.getValue(DataDiff.getLocalDataDiffPath(type, id)) || []).map(d => {return {op:d.op, path:d.path, value:d.value}});
}

/**
 * Diffs including history data - not json-patch compatible
 */
DataDiff.getLocalDataHistory = (type, id) => {
    assert(C.TYPES.has(type), "DataStore.getDataHistory "+type);
    assert(id, "DataStore.getDataHistory: No id?! getData "+type);
    return DataStore.getValue(DataDiff.getLocalDataDiffPath(type, id)) || [];
}

/**
 * Get the local edit history of a specific prop
 * @param {*} type 
 * @param {*} id 
 * @param {*} path 
 */
DataDiff.getLocalDataDiffsForProp = (type, id, path) => {
    assert(C.TYPES.has(type), "DataStore.getDataDiffsForProp "+type);
    assert(id, "DataStore.getDataDiffsForProp: No id?! getData "+type);
    assert(path, "DataStore.getDataDiffsForProp No path? "+path);
    return DataDiff.getLocalDataDiffs(type, id).filter(diff => diff.path === "/"+path.join("/"));
}

DataDiff.getLocalDataDiffsForProps = (type, id, paths) => {
    assert(C.TYPES.has(type), "DataStore.getDataDiffsForProps "+type);
    assert(id, "DataStore.getDataDiffsForProps: No id?! getData "+type);
    assert(paths, "DataStore.getDataDiffsForProps No paths? "+paths);
    let strPaths = paths.map(path => "/"+path.join("/"));
    return DataDiff.getLocalDataDiffs(type, id).filter(diff => strPaths.includes(diff.path));
}

DataDiff.clearLocalDataDiffs = (type, id, update) => {
    assert(C.TYPES.has(type), "DataStore.clearDataHistory "+type);
    assert(id, "DataStore.clearDataHistory: No id?! getData "+type);
    return DataStore.setValue(['transient', type, id, DataDiff.DATA_LOCAL_DIFF_PROPERTY], null, update);
}

/**
 * Get diffs between a draft and published item - json-patch compatible.
 * As this can incur server fetching, it is not guaranteed to be immediate.
 * If no published item exists, the promise-value will yield null.
 * @returns {PromiseValue}
 */
DataDiff.getDraftDataDiffs = (type, id) => {
    assert(C.TYPES.has(type), "DataStore.getDataDiffsForProp "+type);
    assert(id, "DataStore.getDataDiffsForProp: No id?! getData "+type);
    return DataStore.fetch(DataDiff.getDraftDataDiffPath(type, id), async () => {
        const pubItem = await getDataItemClean({type, id, status:KStatus.PUBLISHED}).promise;
        if (!pubItem) return null;
        const draftItem = await getDataItemClean({type, id, status:KStatus.DRAFT}).promise;
        const diffs = generateDataItemDiffs(pubItem, draftItem);
        return diffs;
    });
}

DataDiff.getDraftDataHistory = (type, id) => {
    assert(C.TYPES.has(type), "DataStore.getDataDiffsForProp "+type);
    assert(id, "DataStore.getDataDiffsForProp: No id?! getData "+type);
    return DataStore.fetch(DataDiff.getDraftDataDiffPath(type, id), async () => {
        const pubItem = await getDataItemClean({type, id, status:KStatus.PUBLISHED}).promise;
        if (!pubItem) return null;
        const draftItem = await getDataItemClean({type, id, status:KStatus.DRAFT}).promise;
        const diffs = generateDataItemDiffs(pubItem, draftItem);
        return diffs;
    });
}

DataDiff.getDraftDataDiffsForProp = (type, id, path) => {
    assert(C.TYPES.has(type), "DataStore.getDataDiffsForProp "+type);
    assert(id, "DataStore.getDataDiffsForProp: No id?! getData "+type);
    assert(path, "DataStore.getDataDiffsForProp No path? "+path);
    return (DataDiff.getDraftDataDiffs(type, id).value || []).filter(diff => diff.path === "/"+path.join("/"));
}

DataDiff.getDraftDataDiffsForProps = (type, id, paths) => {
    assert(C.TYPES.has(type), "DataStore.getDataDiffsForProps "+type);
    assert(id, "DataStore.getDataDiffsForProps: No id?! getData "+type);
    assert(paths, "DataStore.getDataDiffsForProps No paths? "+paths);
    let strPaths = paths.map(path => "/"+path.join("/"));
    return (DataDiff.getDraftDataDiffs(type, id).value || []).filter(diff => strPaths.includes(diff.path));
}

DataDiff.clearDraftDataDiffs = (type, id, update) => {
    assert(C.TYPES.has(type), "DataStore.clearDataHistory "+type);
    assert(id, "DataStore.clearDataHistory: No id?! getData "+type);
    return DataStore.setValue(['transient', type, id, DataDiff.DATA_DRAFT_DIFF_PROPERTY], null, update);
}

DataDiff.getGlobalHistory = () => {
    return DataStore.getValue(['transient', 'global', DataDiff.DATA_LOCAL_DIFF_PROPERTY]) || [];
}

DataDiff.clearGlobalHistory = (update) => {
    return DataStore.setValue(['transient', 'global', DataDiff.DATA_LOCAL_DIFF_PROPERTY], null, update);
}

DataDiff.setGlobalHistory = (newHistory, update) => {
    return DataStore.setValue(['transient', 'global', DataDiff.DATA_LOCAL_DIFF_PROPERTY], newHistory, update);
}

/**
 * Get the last local change made to a data item
 * @param {*} type 
 * @param {*} id 
 */
DataDiff.getLastLocalDataDiff = (type, id) => {
    assert(C.TYPES.has(type), "DataStore.getLastDataDiff "+type);
    assert(id, "DataStore.getLastDataDiff: No id?! getData "+type);
    const history = DataDiff.getLocalDataDiffs(type, id);
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
DataDiff.registerHistoryTracker = (type, id, proppath) => {
    let trackpath = proppath;
    if (_.isArray(proppath)) trackpath = "/"+proppath.join("/"); // convert to easily comparible and json-patch compatible string
    const path = ['transient', type, id, DataDiff.DATA_HISTORY_TRACKERS];
    const tracker = DataStore.getValue(path);
    if (tracker) {
        // Add onto tracker list
        if (tracker[trackpath]) {
            console.warn("DataDiff.registerHistoryTracker multiple trackers on same prop! Might indicate a conflict.", type+":"+id, trackpath);
            tracker[trackpath] += 1;
        } else tracker[trackpath] = 1;
        DataStore.setValue(path, tracker);
    } else {
        // Newly tracked item
        const newTracker = {};
        newTracker[trackpath] = 1;
        DataStore.setValue(path, newTracker);
    }
}

/**
 * WARNING: preferrably, use useDataHistory instead.
 * Any components tracking history should call this when they unmount/are no longer needed
 * @param {Object} tracker
 */
DataDiff.unregisterHistoryTracker = (type, id, proppath) => {
    let trackpath = proppath;
    if (_.isArray(proppath)) trackpath = "/"+proppath.join("/"); // convert to easily comparible and json-patch compatible string
    let tracker = DataStore.getValue(['transient', type, id, DataDiff.DATA_HISTORY_TRACKERS]);
    if (!tracker) console.error("DataStore.unregisterTracker item not tracked?? Hooks probably being called out of order", type, id);
    else if (tracker[trackpath]) {
        if (tracker[trackpath] > 1) {
            DataStore.setValue(['transient', type, id, DataDiff.DATA_HISTORY_TRACKERS, trackpath], tracker[trackpath] - 1);
        } else {
            delete tracker[trackpath];
            DataStore.setValue(['transient', type, id, DataDiff.DATA_HISTORY_TRACKERS], tracker);
        }
    }

    // Get updated list to see if anything is tracking anymore
    tracker = DataStore.getValue(['transient', type, id, DataDiff.DATA_HISTORY_TRACKERS]);
    if (Object.keys(tracker).length === 0) {
        // Tidy up
        DataStore.setValue(['transient', type, id, DataDiff.DATA_HISTORY_TRACKERS], null);
        DataDiff.clearLocalDataDiffs(type, id, false);
    }
    // Remove any references to changes made to this now untracked object in the global history
    /*let dataPath = "/"+DataStore.getDataPath({status:C.KStatus.DRAFT, type, id}).join("/");
    let globalHistory = DataDiff.getGlobalHistory();
    globalHistory = globalHistory.filter(diff => !diff.path.startsWith(dataPath));
    DataDiff.setGlobalHistory(globalHistory, false);*/
    //DataStore.setValue(['transient', type, id, DataDiff.DATA_HISTORY_TRACKERS], false);
}

DataDiff.getHistoryTrackers = () => {
    let trackers = [];
    const transient = DataStore.getValue(['transient']);
    Object.keys(transient).forEach(type => {
        if (!C.TYPES.has(type)) return;
        const obj = transient[type];
        Object.keys(obj).forEach(id => {
            let trackpaths = obj[id][DataDiff.DATA_HISTORY_TRACKERS];
            if (!trackpaths) return;
            trackpaths = Object.keys(trackpaths);
            if (trackpaths) trackers.push({type, id, trackpaths});
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

/**
 * Generate a comparison of diffs between 2 data items
 * @param {DataItem} item1 
 * @param {DataItem} item2 
 */
export const generateDataItemDiffs = (item1, item2) => {
    let diffs = jsonDiff(item1, item2);
    diffs = diffs.map(diff => {
        if (diff.path === "/status"
            || diff.path === "/lastModified") return null; // ignore internal properties
        const diffPath = diff.path.substring(1).split("/");
        diff.from = getObjectValueByPath(item1, diffPath);
        return diff;
    }).filter(x=>x);
    return diffs;
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
 * @param {String[]} proppath
 */
export const useDataHistory = (type, id, proppath) => {
	assert(type, "useDataHistory no type??");
	assert(id, "useDataHistory no id??");

	// Register this as a history tracker on mount
	useEffect(() => {
		DataDiff.registerHistoryTracker(type, id, proppath);
		// Unregister on unmount
		return () => {
			DataDiff.unregisterHistoryTracker(type, id, proppath);
		}
	}, [type, id]);
}

export default DataDiff;
