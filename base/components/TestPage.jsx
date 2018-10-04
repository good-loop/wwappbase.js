/**
 * A convenient place for ad-hoc widget tests.
 * This is not a replacement for proper unit testing - but it is a lot better than debugging via repeated top-level testing.
 */
import React from 'react';
import ReactDOM from 'react-dom';

import SJTest, {assert} from 'sjtest';
import Login from 'you-again';
import printer from '../utils/printer.js';
import DataStore from '../plumbing/DataStore';
import C from '../CBase';
import Roles from '../Roles';
import Misc from './Misc';
import SimpleTable from './SimpleTable';
import PropControl from './PropControl';
import MDText from './MDText';

const TestPage = () => {
	let path = ['widget', 'TestPage'];
	let widget = DataStore.getValue(path) || {};

	let columns = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 'a1', 'b1', 'c1', 'd1', 'e1', 'f1', 'g1', 'h1', 'i1', 'j1', 'k1', 'l1', 'm1', 'n1', 'o1', 'p1', 'q1', 'r1', 's1', 't1', 'u1', 'v1', 'w1', 'x1', 'y1', 'z1', 'a2', 'b2', 'c2', 'd2','f2', 'g2', 'h2', 'i2'];
	let temp1 = {a:'www-bubblyaquarius-com.filesusr.com',b:1,c:0,e:0,f:0,g:0,h:0,i:0,j:0,k:0,l:0,m:0,n:0,o:0,p:0,q:0,r:0,s:0,t:0,u:0,v:0,w:0,x:0,y:0,z:0,a1:1,b1:1,c1:0,d1:1,e1:0,f1:0,g1:0,h1:0,i1:0,j1:0,k1:0,l1:0,m1:0,n1:0,o1:0,p1:0,q1:0,r1:0,s1:0,t1:0,u1:0,v1:0,w1:0,x1:0,y1:0,z1:0,a2:0,b2:0,c2:0,d2:0,e2:0,f2:0,g2:0,h2:0,i2:0};
	let temp2 = {a:'platypusinnovation.blogspot.com',b:1,c:0,d:1,e:0,f:0,g:0,h:0,i:0,j:0,k:0,l:0,m:0,n:0,o:0,p:0,q:0,r:0,s:0,t:0,u:0,v:0,w:0,x:0,y:0,z:0,a1:1,b1:1,c1:0,d1:1,e1:0,f1:0,g1:0,h1:0,i1:0,j1:0,k1:0,l1:0,m1:0,n1:0,o1:0,p1:0,q1:0,r1:0,s1:0,t1:0,u1:0,v1:0,w1:0,x1:0,y1:0,z1:0,a2:0,b2:0,c2:0,d2:0,e2:0,f2:0,g2:0,h2:0,i2:0};
	let temp3 = {a:1,b:1,c:0,d:1,e:0,f:0,g:0,h:0,i:0,j:0,k:0,l:0,m:0,n:0,o:0,p:0,q:0,r:0,s:0,t:0,u:0,v:0,w:0,x:0,y:0,z:0,a1:1,b1:1,c1:0,d1:1,e1:0,f1:0,g1:0,h1:0,i1:0,j1:0,k1:0,l1:0,m1:0,n1:0,o1:0,p1:0,q1:0,r1:0,s1:0,t1:0,u1:0,v1:0,w1:0,x1:0,y1:0,z1:0,a2:0,b2:0,c2:0,d2:0,e2:0,f2:0,g2:0,h2:0,i2:0};	
	let data = [temp1,temp2,temp3];

	return (
		<div className='TestPage'>
			<h2>Test Page</h2>
			<p>Insert a test widget below</p>

			<PropControl type='textarea' path={path} prop='accents' label='Text with accents / unicode' />

			<blockquote>{widget.accents}</blockquote>
			<MDText source={widget.accents} />

			<SimpleTable columns={columns} data={data} />

			<PropControl type='radio' path={path} prop='radioTest' options={['daily','weekly','annual']}  />

			<p>Inline</p>
			<PropControl type='radio' path={path} prop='radioTest2' options={['a','b','c']} inline />

		</div>
	);
};

export default TestPage;
