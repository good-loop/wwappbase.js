import React, { Component } from 'react';
import {ReactDOM} from 'react-dom';
import {SJTest, assMatch} from 'sjtest';
import Login from 'you-again';
import C from '../CBase';
import List from '../data/List';
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
	// glyph fire button?? or a prod button??
	return (<div>
		<div className='pull-left'>
			<Misc.PropControl path={['widget','todo']} prop='closed' type='checkbox' />
		</div>
		<div><small><code>{item.tags? item.tags.join(" ") : null}</code></small></div>
		{item.text}		
		<div>{item.assigned? item.assigned.join(" ") : null}</div>
		{item.url && item.url !== ''+window.location? <div><small><a href={item.url}>{item.url}</a></small></div> : null}
	</div>);
};

const TaskListButton = ({bpath, value, list}) => {
	return (<button type="button" className='btn btn-default navbar-btn navbar-nav' 
		disabled={ ! bpath}
		onClick={e => DataStore.setValue(bpath, ! value)}>Tasks {list? '('+List.total(list)+')' : null}</button>
	);
};

const setTaskTags = (...tags) => {		
	tags = tags.filter(t => t);	
	assMatch(tags, 'String[]', "TaskList.jsx setTaskTags()"); //fails for [] :( TODO fix assMatch
	let oldTags = DataStore.getValue(['widget', 'TaskList', 'tags']);
	if (JSON.stringify(tags) === JSON.stringify(oldTags)) {
		// no-op
		return;
	}
	// we're probably inside a render, so update after the current render
	setTimeout( () => {				
		DataStore.setValue(['widget', 'TaskList', 'tags'], tags);
	}, 1);
};

const TaskList = ({}) => {		
	// where are we? page + id as tags
	let tags = DataStore.getValue('widget', 'TaskList', 'tags');
	if ( ! tags) {
		return <TaskListButton />
	}
	// widget settings
	const wpath = ['widget', 'TaskList', tags.join("+") || 'all'];
	const widget = DataStore.getValue(wpath) || {};

	const type = C.TYPES.Task;
	let q = tags.map(t => "tags:"+t).join(" AND ")
		// assigned.map(t => "assigned:"+t).join(" ")

	const status = C.KStatus.ALL_BAR_TRASH;
	// HACK refactor into ListLoad or List.js
	
	let pvItems = ActionMan.list({type, status, q:q});

	// button mode?
	if ( ! widget.show) {
		return <TaskListButton bpath={wpath.concat('show')} list={pvItems.value} />
	}

	return (<div>
		<TaskListButton bpath={wpath.concat('show')} value={true} list={pvItems.value} />
		<div className='TaskList avoid-navbar' style={{position:'fixed', right:0, top:0}}>
			<h4>Tasks for {tags.join(" ")}</h4>
			<QuickTaskMaker tags={tags} items={pvItems.value} /> 
			<div>&nbsp;</div>
			<ListLoad 
				hasFilter={pvItems.value && pvItems.value.total > 5}
				q={q}
				type={type} 
				status={status} 
				ListItem={TaskListItem}				
				className='DefaultListLoad' 
				canDelete
				/>
	</div></div>);
};

const QuickTaskMaker = ({tags=[], assigned=[], items}) => {		
	if ( ! Login.isLoggedIn()) {
		return null;
	}
	const qpath = ['widget', 'QuickTaskMaker'];
	const quickTask = e => {
		e.preventDefault();
		// make
		let base = DataStore.getValue(qpath);
		base.tags = tags;
		base.assigned = assigned;
		let task = Task.make(base);
		// publish
		ActionMan.publishEdits('Task', task.id, task);
		// clear the form
		DataStore.setValue(qpath, null);
		// optimistic add to list
		// NB: Crud will auto-add to published, but it cant handle auto-add to filtered lists
		if (items) List.add(task, items);
	};
	const ttext = DataStore.getValue(qpath.concat('text'));
	return (
		<form className='QuickTaskMaker form-inline' onSubmit={quickTask}>
			<Misc.PropControl type='text' path={qpath} prop='text' placeholder='Make a new task' /> &nbsp;
			<button className='btn btn-primary' disabled={ ! ttext} type='submit'>Add</button>			
		</form>);
};

export default TaskList;
export {
	setTaskTags
}
