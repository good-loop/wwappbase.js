
import React from 'react';

import PropControl, {registerControl, DSsetValue} from './PropControl';
import DataStore from '../plumbing/DataStore';
import { Badge, Form, FormGroup, Input, Label, Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import CloseButton from './CloseButton';
import { useState } from 'react';
import { asArray, is, labeller, str } from '../utils/miscutils';
import { assert } from '../utils/assert';
import Icon from './Icon';

/**
 * A list-of-objects editor
 * @param {Object} p
 * @param {?String} p.itemType Used for labels
 * @param {JSX|boolean} p.Viewer {path, item, i} Set false to use the Editor.
 * @param {JSX} p.Editor {path, item} item is null for Add. Can be the same as Viewer
 */
const PropControlList = ({rawValue, storeValue, Viewer=BasicViewer, Editor=BasicEditor, itemType, rowStyle, setRawValue, modelValueFromInput, 
	path, prop, proppath, type, options, labels, tooltips, inline, fcolor, saveFn}) => 
{
	const listValue = asArray(storeValue);
	if ( ! Viewer) Viewer = Editor;
	return (<>
		<ul className={rowStyle && "rowStyle"}>
		{listValue.map((item,i) => 
			<li key={i} >{is(item)? <Viewer item={item} i={i} path={proppath.concat(i)} /> : "_"} 
				{Editor !== Viewer && <AddOrEditButton arrayPath={proppath} i={i} listValue={listValue} Editor={Editor} item={item} itemType={itemType} />}
				<DeleteButton arrayPath={proppath} i={i} listValue={listValue} /> 
				{item && item.error && <Badge pill color="danger" title={getItemErrorMessage(item)}> 🐛 </Badge>}
			</li>
		)}
		<li><AddOrEditButton size="sm" arrayPath={proppath} Editor={Editor} listValue={listValue} itemType={itemType} /></li>
	</ul>
	</>);


	return 
}; // ./radio
registerControl({type:'list', $Widget: PropControlList});

const BasicViewer = ({item, i}) => {
	return <div>{i}: {str(item)}</div>;
};

const BasicEditor = ({path}) => {
	let item = DataStore.getValue(path);
	return <div>TODO editor for {str(item)}</div>;
};

const getItemErrorMessage = item => {
	if ( ! item) return null;
	if (typeof(item.error)==="string" && item.error) return item.error;	
	return item.error.detailMessage || item.error.message || JSON.stringify(item.error);
};

/**
 * 
 * @param {Object} p
 * @param {?string} p.itemType for the label/title "Add X"
 * @returns 
 */
const AddOrEditButton = ({arrayPath, i=-1, listValue, Editor, item, itemType}) => {
	assert(Editor, "No list Editor");
	let [show, setShow] = useState();
	let epath = i===-1? ['widget','AddButton'].concat(...arrayPath) : arrayPath.concat(i);
	const doAdd = e => {
		let form = DataStore.getValue(epath);
		DataStore.setValue(arrayPath.concat(listValue.length), form);
		DataStore.setValue(epath, null);
		setShow(false);
	};
	const onClick = e => { DataStore.update(); setShow(true); }
	return (<>		
		{i===-1?
			<Button onClick={onClick}><Icon name="plus" /> Add {itemType}</Button>
			: <><Button size="sm" className="ml-1" color="outline-secondary" onClick={onClick}><Icon name="memo"/></Button></>
		}
		<Modal isOpen={show} toggle={() => setShow( ! show)} >
			<ModalHeader toggle={() => setShow( ! show)} >Add {itemType}</ModalHeader>
			<ModalBody>
				<Editor path={epath} item={item} />
			</ModalBody>
			<ModalFooter>{i===-1 && <Button color="primary" onClick={doAdd}>Add</Button>}</ModalFooter>
		</Modal>
	</>);
};


const DeleteButton = ({arrayPath, i, listValue}) => {
	const doDelete = e => {
		const ok = confirm("Remove?");
		if ( ! ok) return;
		let newList = listValue.slice();
		newList.splice(i, 1); // copy then remove to force an update - is that needed??
		DataStore.setValue(arrayPath, newList);
	};
	return <Button size="sm" className="ml-1" color="outline-secondary" onClick={doDelete}><Icon name="trashcan"/></Button>;
};

export default PropControlList;

