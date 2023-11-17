import { useState, useEffect } from 'react';
import DataStore from './DataStore';
import { getDataItem } from './Crud';


/**
 * Generic factory for DataStore binding hooks.
 * @param {Object} p
 * @param {Function} [p.pathFn] Maps the hook arguments to a DataStore path.
 * @param {boolean} [p.subtree] True if this hook should also update when writes are made to subtrees of the path.
 * @param {Function} [p.initFn] Called on first run for each invoking component + path - e.g. fetch a data-item from server.
 * @param {Function} [p.transformFn] Transforms the store data before comparing & setting state.
 * @param {Function} [p.shouldUpdate] Compares old and new values and decides whether to set state.
 * @returns {Function} A hook function which can bind to a DataStore path.
 */
function makeDataStoreHook({
	pathFn = a => a,
	subtree = false,
	initFn = () => {},
	transformFn = a => a,
	shouldUpdate = (a, b) => a !== b
}) {
	return function(...args) {
		const path = pathFn(...args);
		const [val, setVal] = useState();
		const [listenSpec, setListenSpec] = useState();

		useEffect(() => {
			function receiveValue(newVal) {
				newVal = transformFn(newVal);
				if (shouldUpdate(val, newVal)) setVal(newVal);
			}
			// Set up DataStore listener
			const newListenSpec = [receiveValue, path, subtree];
			DataStore.addPathListener(...newListenSpec);
			// Remove previous listener, if the path has changed
			if (listenSpec) DataStore.removePathListener(...listenSpec);
			setListenSpec(newListenSpec);
			// Get initial state of data into DataStore, if applicable
			initFn(...args);
			// Remove listener when unmounted
			return () => DataStore.removePathListener(...newListenSpec);
		}, path);

		return val;
	}
};


/**
 * Hook which yields an up-to-date copy of a data-item from the store.
 * @param {Object} itemSpec
 * @param {KStatus} itemSpec.status
 * @param {String} itemSpec.id
 * @param {Type} itemSpec.type
 */
export const useDataItem = makeDataStoreHook({
	pathFn: (...args) => DataStore.getDataPath(...args),
	initFn: getDataItem
});


/** TODO e.g. for PropControl */
export function useDataItemProp(itemSpec, path) {}


/** TODO Listen for a URL parameter */
export function useParam(key) {}


/** TODO Huge copy-paste job from ListLoad */
export function useDataList(...args) {}

