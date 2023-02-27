
import React, {useState} from 'react';

import PropControl, {registerControl, PropControlParams, DSsetValue} from '../PropControl';
import DataStore from '../../plumbing/DataStore';
import { Badge, Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import { asArray, is, str } from '../../utils/miscutils';
import { assert } from '../../utils/assert';
import Icon from '../Icon';

import '../../style/PropControls/PropControlList.less';

/**
 * A list-of-objects editor
 * @param {Object} p
 * @param {?String} p.itemType Used for labels
 * @param {JSX|boolean} p.Viewer {path, item, i} Set false to use the Editor.
 * @param {?JSX} p.Editor {path, item} item is null for Add. Can be the same as Viewer
 */
export function PropControlList2({ storeValue, set, confirmDelete=true, Viewer=BasicViewer, Editor=BasicEditor, itemType, rowStyle, proppath }) {
	const listValue = asArray(storeValue);
	if (!Viewer) Viewer = Editor;

	return (
		<ul className={rowStyle && 'rowStyle'}>
			{listValue.map((item,i) => (
				<li key={i} >
					{is(item) ? (
						<Viewer item={item} i={i} path={proppath.concat(i)} />
					) : '_'}
					{Editor && Editor !== Viewer && (
						<AddOrEditButton set={set} arrayPath={proppath} i={i} listValue={listValue} Editor={Editor} item={item} itemType={itemType} />
					)}
					{item && item.error && <Badge pill color="danger" title={getItemErrorMessage(item)}> 🐛 </Badge>}
					<DeleteWithConfirmButton confirmDelete={confirmDelete} set={set} arrayPath={proppath} i={i} listValue={listValue} />
				</li>
			))}
			{Editor && <li><AddOrEditButton set={set} size="sm" arrayPath={proppath} Editor={Editor} listValue={listValue} itemType={itemType} /></li>}
		</ul>
	);
}

registerControl({type: 'list', $Widget: PropControlList2});


function BasicViewer({item, i}) {
  return <div>{i}: {str(item)}</div>;
}


function BasicEditor({path}) {
	let item = DataStore.getValue(path);
	return <div>TODO editor for {str(item)}</div>;
}


const getItemErrorMessage = item => {
	if (!item) return null;
	if (typeof(item.error)==="string" && item.error) return item.error;	
	return item.error.detailMessage || item.error.message || JSON.stringify(item.error);
};


/**
 * 
 * @param {Object} p
 * @param {?string} p.itemType for the label/title "Add X"
 * @returns 
 */
function AddOrEditButton({arrayPath, i = -1, listValue, Editor, item, itemType, set}) {
	assert(Editor, "No list Editor");
	let [show, setShow] = useState();
	const toggle = () => setShow(!show);

	const existingItem = (i !== -1);

	let epath = existingItem ? arrayPath.concat(i) : ['widget', 'AddButton'].concat(...arrayPath);
	const doAdd = e => {
		let form = DataStore.getValue(epath);
		// TODO set(newList)
		DataStore.setValue(arrayPath.concat(listValue.length), form);
		DataStore.setValue(epath, null);
		setShow(false);
	};
	const onClick = e => { DataStore.update(); setShow(true); };

	
	return <>
		{existingItem ? (
			<Button size="sm" className="ml-1" color="outline-secondary" onClick={onClick}><Icon name="memo" /></Button>
		) : (
			<Button onClick={onClick}><Icon name="plus" /> Add {itemType}</Button>
		)}
		<Modal isOpen={show} toggle={toggle} >
			<ModalHeader toggle={toggle}>Add {itemType}</ModalHeader>
			<ModalBody>
				<Editor path={epath} item={item} />
			</ModalBody>
			<ModalFooter>{i===-1 && <Button color="primary" onClick={doAdd}>Add</Button>}</ModalFooter>
		</Modal>
	</>;
}


function DeleteWithConfirmButton({arrayPath, i, listValue, set, confirmDelete}) {
	const doDelete = () => {
		if (confirmDelete) {
			if ( ! confirm(`Delete item ${i}?`)) return;
		}
		// Copy array before mutating, to break identity in simple equality checks
		const newList = listValue.slice();
		newList.splice(i, 1);
		set(newList);
		// DataStore.setValue(arrayPath, newList);
	};

	return (
		<Button size="sm" className="ml-1 delete-item" 
			color={confirmDelete? "danger" : "secondary"} 
			onClick={doDelete} title={confirmDelete? "Delete" : "remove"} >
			{confirmDelete? <Icon name="trashcan"/> : <span>&times;</span>}
		</Button>
	);
}


/**
 * A list-of-objects editor
 * 
 * @param {PropControlParams} p
 * @param {?Boolean} confirmDelete = true
 * @param {?String} p.itemType Used for labels
 * @param {JSX|boolean} p.Viewer {path, item, i} Set false to use the Editor.
 * @param {JSX} p.Editor {path, item} item is null for Add. Can be the same as Viewer
 */
function PropControlList(p) {
  return <PropControl type="list" {...p} />;
}

export default PropControlList;

