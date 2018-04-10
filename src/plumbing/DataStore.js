'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _C = require('../../../../src-js/C.js');

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _DataClass = require('../data/DataClass');

var _sjtest = require('sjtest');

var _wwutils = require('wwutils');

var _promiseValue = require('promise-value');

var _promiseValue2 = _interopRequireDefault(_promiseValue);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Hold data in a simple json tree, and provide some utility methods to update it - and to attach a listener.
 * E.g. in a top-of-the-app React container, you might do `DataStore.addListener((mystate) => this.setState(mystate));`
 */
var Store = function () {
	function Store() {
		var _this = this;

		_classCallCheck(this, Store);

		this.callbacks = [];
		// init the "canonical" categories		
		this.appstate = {
			data: {},
			/** 
    * What are you looking at? 
    * This is for transient focus. It is NOT for navigation parameters
    *  -- location and getUrlValue() are better for navigational focus.
   */
			focus: {},
			/** e.g. form settings */
			widget: {},
			/**
    * nav state, stored in the url (this gives nice shareable deep-linking urls)
    */
			location: {},
			misc: {}
		};
		// init url vars
		this.parseUrlVars(window.location);
		// and listen to changes
		window.addEventListener('hashchange', function (e) {
			// console.warn("hash change - update DataStore", window.location);
			_this.parseUrlVars(window.location);
			return true;
		});
	}

	/**
  * Keep navigation state in the url, after the hash, so we have shareable urls.
  * To set a nav variable, use setUrlValue(key, value);
  * 
  * Stored as location: { path: String[], params: {key: value} }
  */


	_createClass(Store, [{
		key: 'parseUrlVars',
		value: function parseUrlVars(url) {
			var _parseHash = (0, _wwutils.parseHash)(),
			    path = _parseHash.path,
			    params = _parseHash.params;
			// peel off eg publisher/myblog		


			var location = {};
			location.path = path;
			var page = path ? path[0] : null;
			if (page) {
				// page/slug? DEPRECATED If so, store in DataStore focus
				var ptype = (0, _wwutils.toTitleCase)(page); // hack publisher -> Publisher			
				this.setValue(['focus', ptype], path[1]);
			}
			location.page = page;
			if (path.length > 2) location.slug = path[1];
			if (path.length > 3) location.subslug = path[2];
			location.params = params;
			this.setValue(['location'], location);
		}

		/**
   * Set a key=value in the url for navigation. This modifies the window.location and DataStore.appstore.location.params, and does an update.
   * @param {String} key 
   * @param {String} value 
   */

	}, {
		key: 'setUrlValue',
		value: function setUrlValue(key, value) {
			(0, _sjtest.assMatch)(key, String);
			if (value) (0, _sjtest.assMatch)(value, "String|Boolean|Number");
			// the modifyHash hack is in setValue() so that Misc.PropControl can use it too
			this.setValue(['location', 'params', key], value);
		}

		/**
   * Get a parameter setting from the url. Convenience for appstate.location.params.key. This is to match setUrlValue.
   * See also getValue('location','path') for the path.
   * @param {String} key 
   */

	}, {
		key: 'getUrlValue',
		value: function getUrlValue(key) {
			(0, _sjtest.assMatch)(key, String);
			return this.getValue(['location', 'params', key]);
		}

		/**
   * It is a good idea to wrap your callback in _.debounce()
   */

	}, {
		key: 'addListener',
		value: function addListener(callback) {
			this.callbacks.push(callback);
		}

		/**
   * Update and trigger the on-update callbacks.
   * @param newState {?Object} This will do an overwrite merge with the existing state.
   * Note: This means you cannot delete/clear an object using this - use direct modification instead.
   * Can be null, which still triggers the on-update callbacks.
   */

	}, {
		key: 'update',
		value: function update(newState) {
			var _this2 = this;

			console.log('update', newState);
			if (newState) {
				_lodash2.default.merge(this.appstate, newState);
			}
			this.callbacks.forEach(function (fn) {
				return fn(_this2.appstate);
			});
		}

		/**
   * Convenience for getting from the data sub-node (as opposed to e.g. focus or misc) of the state tree.
   * type, id
   * Warning: This does NOT load data from the server.
   * @returns a "data-item", such as a person or document, or undefined.
   */

	}, {
		key: 'getData',
		value: function getData(type, id) {
			(0, _sjtest.assert)(_C.C.TYPES.has(type), "DataStore.getData bad type: " + type);
			(0, _sjtest.assert)(id, "DataStore.getData - No id?! getData " + type);
			var item = this.appstate.data[type][id];
			return item;
		}

		/**
   * 
   */

	}, {
		key: 'setData',
		value: function setData(item) {
			var update = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;

			(0, _sjtest.assert)(item && (0, _DataClass.getType)(item) && (0, _DataClass.getId)(item), item, "DataStore.js setData()");
			(0, _sjtest.assert)(_C.C.TYPES.has((0, _DataClass.getType)(item)), item);
			this.setValue(['data', (0, _DataClass.getType)(item), (0, _DataClass.getId)(item)], item, update);
		}

		/**
   * the DataStore path for this item, or null
   */

	}, {
		key: 'getPath',
		value: function getPath(item) {
			if (!item) return null;
			if (!_C.C.TYPES.has((0, _DataClass.getType)(item))) return null;
			if (!(0, _DataClass.getId)(item)) return null;
			return ['data', (0, _DataClass.getType)(item), (0, _DataClass.getId)(item)];
		}
	}, {
		key: 'getValue',
		value: function getValue() {
			for (var _len = arguments.length, path = Array(_len), _key = 0; _key < _len; _key++) {
				path[_key] = arguments[_key];
			}

			(0, _sjtest.assert)(_lodash2.default.isArray(path), "DataStore.getValue - " + path);
			// If a path array was passed in, use it correctly.
			if (path.length === 1 && _lodash2.default.isArray(path[0])) {
				path = path[0];
			}
			(0, _sjtest.assert)(this.appstate[path[0]], "DataStore.getValue: " + path[0] + " is not a json element in appstate - As a safety check against errors, the root element must already exist to use getValue()");
			var tip = this.appstate;
			for (var pi = 0; pi < path.length; pi++) {
				var pkey = path[pi];
				(0, _sjtest.assert)(pkey || pkey === 0, "DataStore.getValue: " + path); // no falsy in a path - except that 0 is a valid key
				var newTip = tip[pkey];
				// Test for hard null -- falsy are valid values
				if (newTip === null || newTip === undefined) return null;
				tip = newTip;
			}
			return tip;
		}

		/**
   * Update a single path=value.
   * 
   * Unlike update(), this can set {} or null values.
   * 
   * It also has a hack, where edits to [data, type, id, ...] (i.e. edits to data items) will
   * also set the modified flag, [transient, type, id, localStatus] = dirty.
   * This is a total hack, but handy.
   * 
   * @param {String[]} path This path will be created if it doesn't exist (except if value===null)
   * @param {*} value The new value. Can be null to null-out a value.
   * @param {boolean} update Set to false to switch off sending out an update. Set to true to force an update even if it looks like a no-op.
   * undefined is true-without-force
   */
		// TODO handle setValue(pathbit, pathbit, pathbit, value) too

	}, {
		key: 'setValue',
		value: function setValue(path, value, update) {
			(0, _sjtest.assert)(_lodash2.default.isArray(path), "DataStore.setValue: " + path + " is not an array.");
			(0, _sjtest.assert)(this.appstate[path[0]], "DataStore.setValue: " + path[0] + " is not a node in appstate - As a safety check against errors, the root node must already exist to use setValue()");
			// console.log('DataStore.setValue', path, value);
			var oldVal = this.getValue(path);
			if (oldVal === value && update !== true && !_lodash2.default.isObject(value)) {
				// The no-op test only considers String and Number 'cos in place edits of objects are common and would cause problems here.
				// console.log("setValue no-op", path, value, "NB: beware of in-place edits - use update=true to force an update");
				return;
			}

			// HACK: modify the url?
			if (path[0] === 'location' && path[1] === 'params') {
				var newParams = {};
				(0, _sjtest.assert)(path.length === 3, "DataStore.js - path should be location.params.key " + path[3]);
				newParams[path[2]] = value;
				(0, _wwutils.modifyHash)(null, newParams);
			}

			var tip = this.appstate;
			for (var pi = 0; pi < path.length; pi++) {
				var pkey = path[pi];
				if (pi === path.length - 1) {
					// Set it!
					tip[pkey] = value;
					break;
				}
				(0, _sjtest.assert)(pkey || pkey === 0, "falsy in path " + path.join(" -> ")); // no falsy in a path - except that 0 is a valid key
				var newTip = tip[pkey];
				if (!newTip) {
					if (value === null) {
						// don't make path for null values
						return;
					}
					newTip = tip[pkey] = {};
				}
				tip = newTip;
			}
			// HACK: update a data value => mark it as modified
			if (oldVal && path[0] === 'data' && path.length > 2 && DataStore.DATA_MODIFIED_PROPERTY) {
				// chop path down to [data, type, id]
				var itemPath = path.slice(0, 3);
				var item = this.getValue(itemPath);
				if ((0, _DataClass.getType)(item) && (0, _DataClass.getId)(item)) {
					this.setLocalEditsStatus((0, _DataClass.getType)(item), (0, _DataClass.getId)(item), _C.C.STATUS.dirty, false);
				}
			}
			if (update !== false) {
				console.log("setValue -> update", path, value);
				this.update();
			}
		}

		/**
   * Has a data item been modified since loading?
   * @param {*} type 
   * @param {*} id 
   * @return "dirty", "clean", etc. -- see C.STATUS
   */

	}, {
		key: 'getLocalEditsStatus',
		value: function getLocalEditsStatus(type, id) {
			(0, _sjtest.assert)(_C.C.TYPES.has(type), "DataStore.getLocalEditsStatus " + type);
			(0, _sjtest.assert)(id, "DataStore.getLocalEditsStatus: No id?! getData " + type);
			return this.getValue('transient', type, id, DataStore.DATA_MODIFIED_PROPERTY);
		}
		/**
   * Has a data item been modified since loading?
   * @param {C.TYPES} type 
   * @param {!String} id 
   * @param {C.STATUS} status
   * @return "dirty", "clean", etc. -- see C.STATUS
   */

	}, {
		key: 'setLocalEditsStatus',
		value: function setLocalEditsStatus(type, id, status, update) {
			(0, _sjtest.assert)(_C.C.TYPES.has(type));
			(0, _sjtest.assert)(_C.C.STATUS.has(status));
			(0, _sjtest.assert)(id, "DataStore.setLocalEditsStatus: No id?! getData " + type);
			if (!DataStore.DATA_MODIFIED_PROPERTY) return null;
			return this.setValue(['transient', type, id, DataStore.DATA_MODIFIED_PROPERTY], status, update);
		}

		/**
  * Set widget.thing.show
   * @param {String} thing The name of the widget.
   * @param {Boolean} showing 
   */

	}, {
		key: 'setShow',
		value: function setShow(thing, showing) {
			(0, _sjtest.assMatch)(thing, String);
			this.setValue(['widget', thing, 'show'], showing);
		}

		/**
   * Convenience for widget.thing.show
   * @param {String} widgetName 
   * @returns {boolean} true if widget is set to show
   */

	}, {
		key: 'getShow',
		value: function getShow(widgetName) {
			(0, _sjtest.assMatch)(widgetName, String);
			return this.getValue('widget', widgetName, 'show');
		}

		/**
  * Set focus.type Largely @deprecated by url-values (which give deep-linking)
   * @param {?String} id
   */

	}, {
		key: 'setFocus',
		value: function setFocus(type, id) {
			(0, _sjtest.assert)(_C.C.TYPES.has(type), "DataStore.setFocus");
			(0, _sjtest.assert)(!id || _lodash2.default.isString(id), "DataStore.setFocus: " + id);
			this.setValue(['focus', type], id);
		}

		/**
   * Largely @deprecated by url-values (which give deep-linking)
   */

	}, {
		key: 'getFocus',
		value: function getFocus(type) {
			(0, _sjtest.assert)(_C.C.TYPES.has(type), "DataStore.getFocus");
			return this.getValue('focus', type);
		}

		/**
   * Get hits from the cargo, and store them under data.type.id
   * @param {*} res 
   */

	}, {
		key: 'updateFromServer',
		value: function updateFromServer(res) {
			console.log("updateFromServer", res);
			if (!res.cargo) {
				return res; // return for chaining .then()
			}
			// must be bound to the store
			(0, _sjtest.assert)(this && this.appstate, "DataStore.updateFromServer: Use with .bind(DataStore)");
			var hits = res.cargo && res.cargo.hits;
			if (!hits && res.cargo) {
				hits = [res.cargo]; // just the one?
			}
			var itemstate = { data: {} };
			hits.forEach(function (item) {
				try {
					var type = (0, _DataClass.getType)(item);
					if (!type) {
						// 
						console.log("skip server object w/o type", item);
						return;
					}
					(0, _sjtest.assert)(_C.C.TYPES.has(type), "DataStore.updateFromServer: type:" + type, item);
					var typemap = itemstate.data[type];
					if (!typemap) {
						typemap = {};
						itemstate.data[type] = typemap;
					}
					if (item.id) {
						typemap[item.id] = item;
					} else if (item["@id"]) {
						// bleurgh, thing.org style ids -- which are asking for trouble :(
						typemap[item["@id"]] = item;
					} else {
						console.warn("No id?!", item, "from", res);
					}
				} catch (err) {
					// swallow and carry on
					console.error(err);
				}
			});
			this.update(itemstate);
			return res;
		} //./updateFromServer()


		/**
   * get local, or fetch by calling fetchFn (but only once). 
   * Does not call update here and now, so it can be used inside a React render().
   * 
   * Warning: This will not modify appstate except for the path given, and transient.
   * So if you fetch a list of data items, they will not be stored into appstate.data.
   * The calling method should do this. 
   * NB: an advantage of this is that the server can return partial data (e.g. search results)
   * without over-writing the fuller data.
   * 
   * @param path {String[]}
   * @param fetchFn {Function} () -> Promise/value, which will be wrapped using promise-value PV()
   * fetchFn MUST return the value for path, or a promise for it. It should NOT set DataStore itself.
   * As a convenience hack, this method will extract `cargo` from fetchFn's return, so it can be used
   * that bit more easily with Winterwell's "standard" json api back-end.
   * @returns {?value, promise} (see promise-value.js)
   */

	}, {
		key: 'fetch',
		value: function fetch(path, fetchFn) {
			var _this3 = this;

			// TODO allow retry after 10 seconds
			var item = this.getValue(path);
			if (item !== null && item !== undefined) {
				// Note: falsy or an empty list/object is counted as valid. It will not trigger a fresh load
				return (0, _promiseValue2.default)(item);
			}
			// only ask once
			var fpath = ['transient', 'PromiseValue'].concat(path);
			var prevpv = this.getValue(fpath);
			if (prevpv) return prevpv;
			var promiseOrValue = fetchFn();
			(0, _sjtest.assert)(promiseOrValue !== undefined, "fetchFn passed to DataStore.fetch() should return a promise or a value. Got: undefined. Missing return statement?");
			// Use PV to standardise the output from fetchFn()
			var pvPromiseOrValue = (0, _promiseValue2.default)(promiseOrValue);
			// process the result async
			var promiseWithCargoUnwrap = pvPromiseOrValue.promise.then(function (res) {
				// HACK unwrap cargo
				// TODO let's make unwrap a configurable setting
				if (res && res.cargo) {
					console.log("unwrapping cargo to store at " + path, res);
					res = res.cargo;
				}
				return res;
			}).fail(function (err) {
				// what if anything to do here??
				console.warn("DataStore fetch fail", path, err);
				return err;
			});
			// wrap this promise as a PV
			var pv = (0, _promiseValue2.default)(promiseWithCargoUnwrap);
			pv.promise.then(function (res) {
				// set the DataStore
				// This is done after the cargo-unwrap PV has resolved. So any calls to fetch() during render will get a resolved PV
				// even if res is null.
				_this3.setValue(path, res); // this should trigger an update (typically a React render update)
				return res;
			});
			this.setValue(fpath, pv, false);
			return pv;
		} // ./fetch()

		/**
   * Remove any list(s) stored under ['list', type].
   * 
   * These lists are often cached results from the server - this method is called to invalidate the cache
   * (and probably force a reload via other application-level code).
   * 
   * If more fine-grained control is provided, just call `setValue(['list', blah], null);` directly.
   */

	}, {
		key: 'invalidateList',
		value: function invalidateList(type) {
			(0, _sjtest.assMatch)(type, String);
			var listWas = this.getValue(['list', type]);
			if (listWas) {
				DataStore.setValue(['list', type], null);
				console.log('publish -> invalidate list', type, listWas);
			} else {
				console.log('publish -> no lists to invalidate');
			}
		}
	}]);

	return Store;
}(); // ./Store


var DataStore = new Store();
// switch on data item edits => modified flag
DataStore.DATA_MODIFIED_PROPERTY = 'localStatus';
exports.default = DataStore;
// accessible to debug

if (typeof window !== 'undefined') window.DataStore = DataStore;

/**
 * Store all the state in one big object??
 */
DataStore.update({
	data: {
		NGO: {},
		User: {},
		Donation: {}
	},
	draft: {
		NGO: {},
		User: {}
	},
	// Use list to store search results
	list: {},
	focus: {
		NGO: null,
		User: null
	},
	widget: {},
	misc: {},
	/** status of server requests, for displaying 'loading' spinners 
  * Normally: transient.$item_id.status
 */
	transient: {}
});