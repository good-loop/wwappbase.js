
import Enum from 'easy-enums';

import {C, Roles} from './wwappbase-test-output.js';
export default C;

/**
 * app config
 */
C.app = {
	name: "Calstat",
	service: "calstat",
	logo: "/img/logo.png"
};

C.ROLES = new Enum("user admin");
C.CAN = new Enum("admin");
// setup roles
Roles.defineRole(C.ROLES.user, []);
Roles.defineRole(C.ROLES.admin, C.CAN.values);
