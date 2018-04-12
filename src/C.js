"use strict";

import Enum from 'easy-enums';
import Roles from './Roles';

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

// C.TYPES = new Enum("App Share NGO User Donation Project Event FundRaiser Basket Ticket Money Transfer");;
// C.ROLES = new Enum("editor admin company goodlooper");
// C.CAN = new Enum("edit publish admin editEvent test uploadCredit goodloop manageDonations");
// // setup roles
// Roles.defineRole(C.ROLES.editor, [C.CAN.publish, C.CAN.editEvent]);
// Roles.defineRole(C.ROLES.company, [C.CAN.uploadCredit]);
// Roles.defineRole(C.ROLES.admin, C.CAN.values);
// Roles.defineRole(C.ROLES.goodlooper, [C.CAN.edit, C.CAN.publish, C.CAN.goodloop]);


// Below here: apps should leave as-is

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

C.KStatus = new Enum('DRAFT PUBLISHED MODIFIED REQUEST_PUBLISH PENDING ARCHIVED TRASH');

C.STATUS = new Enum('loading clean dirty saving');

export default C;
// also for debug
window.C = C;
