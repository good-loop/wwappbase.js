'use strict';
import Enum from 'easy-enums';
import Roles from './Roles';
import DataStore from './plumbing/DataStore';

const C = {};


/// Apps Should Set These Things :)
/**
 * app config
 */
C.app = {
	name: "My App",
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
 */
C.SERVER_TYPE = ''; // production
if (window.location.host.indexOf("test")===0) C.SERVER_TYPE = 'test';
else if (window.location.host.indexOf("local")===0) C.SERVER_TYPE = 'local';
// local servers dont have https
C.HTTPS = C.SERVER_TYPE==='local'? 'http' : 'https';
C.isProduction = () => C.SERVER_TYPE!=='local' && C.SERVER_TYPE!=='test';

/**
 * NB: PUBLISHED -> MODIFIED on edit is set by the server (see AppUtils.java doSaveEdit(), or trace usage of KStatus.MODIFIED)
 */
C.KStatus = new Enum('DRAFT PUBLISHED MODIFIED REQUEST_PUBLISH PENDING ARCHIVED TRASH ALL_BAR_TRASH');

C.STATUS = new Enum('loading clean dirty saving');

C.CRUDACTION = new Enum('new save copy publish unpublish discardEdits delete');

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

C.TRACKPATH = ['data', 'MixPanelTrack'];

export default C;
// also for debug
window.C = C;
