
import React, { useState } from 'react';
import { Checkbox, InputGroup, DropdownButton, MenuItem} from 'react-bootstrap';

import {assert, assMatch} from 'sjtest';
import _ from 'lodash';
import Enum from 'easy-enums';
import JSend from '../data/JSend';
import {join, mapkv, stopEvent, toTitleCase} from 'wwutils';
import PromiseValue from 'promise-value';
import Dropzone from 'react-dropzone';
import md5 from 'md5';
import Autocomplete from 'react-autocomplete';

import Misc from './Misc';
import DataStore, {getPath} from '../plumbing/DataStore';
import ServerIO from '../plumbing/ServerIOBase';
// import ActionMan from '../plumbing/ActionManBase';
import printer from '../utils/printer';
import C from '../CBase';
import BS from './BS';
import Money from '../data/Money';
// // import I18n from 'easyi18n';
import {getType, getId, nonce} from '../data/DataClass';
import {notifyUser} from '../plumbing/Messaging';
import MDText from './MDText';
import PropControl, {registerControl} from './PropControl';
/**
 * TODO a picker with auto-complete for e.g. Advertiser, Agency
 */

 /**
  * 
  * @param {?Boolean} embed If true, set a copy of the data-item. By default, what gets set is the ID
  */
const SelectDataItemPropControl = ({path, prop, type, q, embed}) => {
	return <PropControl type='text' prop={prop} path={path} />;
};
registerControl({type:'DataItem', $Widget:SelectDataItemPropControl});

export default SelectDataItemPropControl;
