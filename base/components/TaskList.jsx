import React, { Component } from 'react';
import {ReactDOM} from 'react-dom';
import {SJTest} from 'sjtest';
import Login from 'you-again';
import C from '../CBase';
import Misc from './Misc';
import {stopEvent, join} from 'wwutils';
import DataStore from '../plumbing/DataStore';
import ListLoad from './ListLoad';
import Task from '../data/Task';
// init basic stuff
import ActionMan from '../plumbing/ActionManBase';
import Crud from '../plumbing/Crud';
// import {} from BS;

const TaskListItem = ({item}) => {
	return (<div>
		<div>{item.tags? item.tags.join(" ") : null}</div>
		{item.text}
		<div>{item.assigned? item.assigned.join(" ") : null}</div>
	</div>);
};

const TaskList = ({tags=[], assigned=[]}) => {		
	const type = C.TYPES.Task;
	let q = join(
		tags.map(t => "tags:"+t).join(" "), 
		assigned.map(t => "assigned:"+t).join(" ")
	);
	const wpath = ['widget', 'TaskList', 'q:'+q];
	const widget = DataStore.getValue(wpath) || {};
	// TODO collapse to the side c.f. Drive etc
	if (widget.hide) {	
	}

	return (
		<div className='TaskList pull-right'>
			<h3>Tasks</h3>
			<QuickTaskMaker tags={tags} assigned={assigned} /> 
			<div>&nbsp;</div>
			<ListLoad 
				hasFilter
				q={q}
				type={type} 
				status={C.KStatus.ALL_BAR_TRASH} 
				ListItem={TaskListItem}
				checkboxes canDelete
				className='DefaultListLoad' />
	</div>);
};

const QuickTaskMaker = ({tags, assigned}) => {		
	if ( ! Login.isLoggedIn()) {
		return null;
	}
	const qpath = ['widget', 'QuickTaskMaker'];
	const quickTask = e => {
		e.preventDefault();
		let base = DataStore.getValue(qpath);
		base.tags = tags;
		base.assigned = assigned;
		let task = Task.make(base);
		ActionMan.publishEdits('Task', task.id, task);
		DataStore.setValue(qpath, null);
	};
	const ttext = DataStore.getValue(qpath.concat('text'));
	return (
		<form className='QuickTaskMaker form-inline' onSubmit={quickTask}>
			<Misc.PropControl type='text' path={qpath} prop='text' placeholder='Make a new task' /> &nbsp;
			<button className='btn btn-primary' disabled={ ! ttext} type='submit'>Add</button>			
		</form>);
};

export default TaskList;
