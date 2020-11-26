'use strict';
import Enum from 'easy-enums';
import Roles from './Roles';
import DataStore from './plumbing/DataStore';

const C = {};

/// Apps Should Set These Things :)
/**
 * app config
 * Best practice: Set this in your app.jsx file, from values in a GLAppManifest file.
 */
C.app = {
	name: "MyApp",
	service: "myapp",
	logo: "/img/logo.png"
};

// Below here: apps should leave as-is

/**
 * This is usually overwritten.
 * Use C.TYPES = new Enum("My Stuff "+C.TYPES.values.join(" ")) to combine
 */
C.TYPES = new Enum("Money User");

/**
 * Special ID for things which dont yet have an ID
 */
C.newId = 'new';

/**
 * hack: local, test, or ''
 * Can be put at the start of our urls
 */
C.SERVER_TYPE = ''; // production
if (window.location.host.startsWith('test')) C.SERVER_TYPE = 'test';
else if (window.location.host.startsWith('local')) C.SERVER_TYPE = 'local';
/** HACK: http(s) local servers dont have https */
C.HTTPS = (C.SERVER_TYPE === 'local') ? 'http' : 'https';
const prod = C.SERVER_TYPE !== 'local' && C.SERVER_TYPE !== 'test';
C.isProduction = () => prod;

/**
 * NB: PUBLISHED -> MODIFIED on edit is set by the server (see AppUtils.java doSaveEdit(), or trace usage of KStatus.MODIFIED)
 */
C.KStatus = new Enum('DRAFT PUBLISHED MODIFIED REQUEST_PUBLISH PENDING ARCHIVED TRASH ALL_BAR_TRASH PUB_OR_ARC PUB_OR_DRAFT');

C.STATUS = new Enum('loading clean dirty saving saveerror'); // 

C.CRUDACTION = new Enum('new getornew save copy publish unpublish discardEdits delete archive');

/**
 * Make "standard" DataStore nodes from C.TYPES
 */
C.setupDataStore = () => {
	let basics = {
		data: {},
		draft: {},
		widget: {},
		list: {},
		misc: {},
		/** about the local environment */
		env: {},
		/** status of server requests, for displaying 'loading' spinners 
		* Normally: transient.$item_id.status
		*/
		transient: {}
	};
	C.TYPES.values.forEach(t => {
		basics.data[t] = {};
		basics.draft[t] = {};
	});
	DataStore.update(basics);
};

export default C;
// also for debug
window.C = C;
