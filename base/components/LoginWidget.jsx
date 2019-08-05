import React from 'react';
import { assert, assMatch } from 'sjtest';
import Login from 'you-again';
import {Modal} from 'react-bootstrap'; // TODO from BS
import BS from './BS';
import { XId, uid, stopEvent, toTitleCase} from 'wwutils';
import Cookies from 'js-cookie';
import DataStore from '../plumbing/DataStore';
import Misc from './Misc';
import C from '../CBase';
import ServerIO from '../plumbing/ServerIOBase';
// import { Server } from 'net';

// For testing
if ( (""+window.location).indexOf('login=local') !== -1) {	
	Login.ENDPOINT = 'http://localyouagain.good-loop.com/youagain.json';
	console.warn("config", "Set you-again Login endpoint to "+Login.ENDPOINT);
} else if ( (""+window.location).indexOf('login=test') !== -1) {	
	Login.ENDPOINT = 'https://test.youagain.good-loop.com/youagain.json';
	console.warn("config", "Set you-again Login endpoint to "+Login.ENDPOINT);
}

const VERB_PATH = ['widget','LoginWidget','verb'];

/**
	TODO:
	- doEmailLogin(email, password) and doSocialLogin(service) are available as props now
	- Use them in the appropriate section of the form
*/

const STATUS_PATH = ['widget', 'LoginWidget', 'status'];

const LoginLink = ({className, onClick, style, verb='Login'}) => {
	return (<a className={className} href={window.location} onClick={ e => { e.preventDefault(); e.stopPropagation(); LoginWidget.show(); onClick && onClick(e); } } style={style} >
		{verb}
	</a>);
	
};

const RegisterLink = ({className, onClick, ...props}) => <LoginLink 
	className={className} 
	onClick={() => {props.onClick && props.onClick(); LoginWidget.changeVerb('register');}} 
	verb='Register' 
	{...props}
/>;

/**
		Login or Signup (one widget)
		See SigninScriptlet
		@param render {?JSX} default: LoginWidgetGuts

*/
const LoginWidget = ({showDialog, logo=<Misc.Logo service={C.app.service} size='large' transparent={false} />, title, render=LoginWidgetGuts, services}) => {
	if (showDialog === undefined) {
		showDialog = DataStore.getValue(['widget','LoginWidget', 'show']);
		// NB: the app is shown regardless
	}
	if ( ! showDialog) return null;
	if ( ! services) services = ['twitter', 'facebook'];
	let verb = DataStore.getValue(VERB_PATH) || 'login';

	if ( ! title) title = `Welcome ${verb==='login'? '(back)' : ''} to {C.app.name}`;

	const heading = {
		login: 'Log In',
		register: 'Register',
		reset: 'Reset Password'
	}[verb];

	// BS.Modal still has some glitches. But react-bootstrap modal plain fails for BS v4
	let Modal34 = BS.version===4? BS.Modal : Modal;
	return (
		<Modal34 show={showDialog} className="login-modal" onHide={() => LoginWidget.hide()}>
			<Modal34.Header closeButton>
				<Modal34.Title>
					{logo}
					{title}					
				</Modal34.Title>
			</Modal34.Header>
			<Modal34.Body>
				{render({services})}
			</Modal34.Body>
			<Modal34.Footer>
				<SwitchVerb verb={verb} />
			</Modal34.Footer>
		</Modal34>
	);
}; // ./LoginWidget

LoginWidget.show = () => {
	DataStore.setValue(['widget','LoginWidget', 'show'], true);
};

LoginWidget.hide = () => {
	DataStore.setValue(['widget','LoginWidget', 'show'], false);
};

LoginWidget.changeVerb = verb => DataStore.setValue(VERB_PATH, verb);

const canSignIn = {
	facebook: true,
	instagram: true,
	twitter: true,
};

const SocialSignin = ({verb, services}) => {
	if (verb === 'reset') return null;
	if (!services) return null;

	return (
		<div className="social-signin">
			{ services.map(service => <SocialSignInButton service={service} verb={verb} key={service} />)}
			<p><small>We will never share your data or post to social media without your consent.
				You can read our <a href={C.app.privacyPolicy || 'https://sogive.org/privacy-policy.html'} target="_new">privacy policy</a> for more information.
			</small></p>
		</div>
	);
};

const SocialSignInButton = ({className = "btn btn-default signin", children, service, verb = 'sign in', size}) => {
	if (!canSignIn[service]) return null;
	if (!children) children = <><Misc.Logo size='small' service={service} color={false} square={false} /> {toTitleCase(verb)} with {toTitleCase(service)}</>;
	// TODO this will prep FB on mouseover -- But what about mobile or fast clickers?
	// TODO You Again should catch failure, and switch to a click through approach.
	const onMouseOver = service === 'facebook' ? () => Login.prepFB(C.app.facebookAppId) : null;

	if ({facebook: 1, twitter: 1, instagram: 1}[service]) className += (' white bg-' + service);
	if (size) className += (' btn-' + size);

	return (
		<div className='form-group'>
			<button onClick={() => socialLogin(service)} className={className} onMouseOver={onMouseOver}>
				{children}
			</button>
		</div>
	);
};


const socialLogin = (service) => {
	// Special behaviour for My-Loop/Portal
	// Doing it this way seemed the most maintainable option
	if( ServerIO.mixPanelTrack ) ServerIO.mixPanelTrack({mixPanelTag:'Social login clicked ' + service});
	Login.auth(service, C.app.facebookAppId, Login.PERMISSIONS.ID_ONLY);
	// auth doesnt return a future, so rely on Login's change listener
	// to close stuff.
}; // ./socialLogin

/**
 * ajax call -- via Login.login() -- to login
 */
LoginWidget.emailLogin = ({verb, app, email, password, onRegister}) => {
	assMatch(email, String, password, String);
	let call = verb==='register'?
		Login.register({email:email, password:password})
		: Login.login(email, password);
	
	DataStore.setValue(STATUS_PATH, C.STATUS.loading);

	call.then(function(res) {
		console.warn("login", res);
		DataStore.setValue(STATUS_PATH, C.STATUS.clean);
		if (Login.isLoggedIn()) {
			// close the dialog on success
			LoginWidget.hide();
			// Security: wipe the password from DataStore
			DataStore.setValue(['data', C.TYPES.User, 'loggingIn', 'password'], null);

			if(verb === 'register' && onRegister) {
				onRegister({...res, email});
			}
		} else {
			// poke React via DataStore (e.g. for Login.error)
			DataStore.update({});
		}
	}, err => {
		DataStore.setValue(STATUS_PATH, C.STATUS.clean);
	});
};

/**
 * @param onSignIn called after user has successfully registered and been logged in
 */
const EmailSignin = ({verb, onLogin, onRegister}) => {
	// we need a place to stash form info. Maybe appstate.widget.LoginWidget.name etc would be better?
	const path = ['data', C.TYPES.User, 'loggingIn'];
	let person = DataStore.getValue(path);	

	const doItFn = () => {
		// Special behaviour for My-Loop/Portal
		// Doing it this way seemed the most maintainable option
		if( ServerIO.mixPanelTrack ) ServerIO.mixPanelTrack({mixPanelTag:'Email login attempted', data:{verb}});
		
		if ( ! person) {
			Login.error = {text: "Please fill in email and password"};
			return;
		}
		let e = person.email;
		let p = person.password;
		if (verb==='reset') {
			assMatch(e, String);
			let call = Login.reset(e)
				.then(function(res) {
					if (res.success) {
						DataStore.setValue(['widget', 'LoginWidget', 'reset-requested'], true);
						if (onLogin) onLogin(res);
					} else {
						// poke React via DataStore (for Login.error)
						DataStore.update({});
					}
				});
			return;
		}
		LoginWidget.emailLogin({verb, onRegister, ...person});
	};

	const buttonText = {
		login: 'Log in',
		register: 'Register',
		reset: 'Reset password',
	}[verb];

	// login/register	
	let status = DataStore.getValue(STATUS_PATH);
	return (
		<form
			id="loginByEmail"
			onSubmit={(event) => {
				event.preventDefault();
				doItFn();
			}}
		>
			{verb==='reset'? <p>Forgotten your password? No problem - we will email you a link to reset it.</p> : null}
			<div className="form-group">
				<label>Email</label>
				<Misc.PropControl type='email' path={path} item={person} prop='email' />
			</div>
			{verb==='reset'? null : <div className="form-group">
				<label>Password</label>
				<Misc.PropControl type='password' path={path} item={person} prop='password' />
			</div>}
			{verb==='reset' && DataStore.getValue('widget', 'LoginWidget', 'reset-requested')? <div className="alert alert-info">A password reset email has been sent out.</div> : null}
			<div className="form-group">
				<button type="submit" className="btn btn-primary form-control" disabled={C.STATUS.isloading(status)}>
					{ buttonText }
				</button>
			</div>
			<LoginError />
			<ResetLink verb={verb} />
		</form>
	);
}; // ./EmailSignin


const ResetLink = ({verb}) => {
	if (verb !== 'login') return null;
	const toReset = () => {
		// clear any error from a failed login
		Login.error = null;
		DataStore.setValue(VERB_PATH, 'reset');
	};
	return (
		<div className='pull-right'>
			<small>
				<a onClick={toReset}>Forgotten password?</a>
			</small>
		</div>
	);
};

const LoginError = function() {
	if ( ! Login.error) return <div />;
	return (
		<div className="form-group">
			<div className="alert alert-danger">{ Login.error.text }</div>
		</div>
	);
};




const LoginWidgetEmbed = ({services, verb, onLogin}) => {
	// NB: prefer the user-set verb (so they can change it)
	verb = DataStore.getValue(VERB_PATH) || verb || 'register';
	
	if(Login.isLoggedIn()) {
		const user = Login.getUser();
		return (
			<div>
				<p>Logged in as {user.name || user.xid}</p>
				<small>Not you? <button className="btn-link" onClick={() => Login.logout()}>Log out</button></small>
			</div>);
	}

	return (
		<div className='login-widget'>
			<LoginWidgetGuts services={services} verb={verb} onLogin={onLogin}/>
			<SwitchVerb verb={verb} />
		</div>
	);
};

const SwitchVerb = ({verb}) => {
	if ( ! verb) verb = DataStore.getValue(VERB_PATH);
	if (verb === 'register') {
		return (
			<div className='switch-verb'>
				Already have an account? <button className='btn btn-primary' onClick={e => stopEvent(e) && LoginWidget.changeVerb('login')} >Login</button>
			</div>
		);
	}
	return (
		<div className='switch-verb'>
			Don&#39;t yet have an account? <button className='btn btn-primary' onClick={e => stopEvent(e) && LoginWidget.changeVerb('register')} >Register</button>
		</div>
	);
};

const LoginWidgetGuts = ({services, verb, onLogin}) => {
	if (!verb) verb = DataStore.getValue(VERB_PATH) || 'login';
	return (
		<div className="login-guts container-fluid">
			<div className="login-divs row">
				<div className="login-email col-sm-6">
					<EmailSignin
						verb={verb}
						onLogin={onLogin}
					/>
				</div>
				<div className="login-social col-sm-6">
					<SocialSignin verb={verb} services={services} />
				</div>
			</div>
		</div>
	);
};


export default LoginWidget;
export {LoginLink, LoginWidgetEmbed, RegisterLink, SocialSignInButton, EmailSignin, SocialSignin, VERB_PATH};
