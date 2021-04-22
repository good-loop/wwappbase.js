import React, { useState, useEffect } from 'react';

import Login from '../youagain';
import { Row, Col, Modal, ModalHeader, ModalBody, Button } from 'reactstrap';
import { stopEvent, toTitleCase } from '../utils/miscutils';
import DataStore from '../plumbing/DataStore';
import Misc from './Misc';
import C from '../CBase';
import ServerIO from '../plumbing/ServerIOBase';
import ErrAlert from './ErrAlert';
import PropControl from './PropControl';
import { assMatch } from '../utils/assert';

// For testing
if (window.location.href.match(/login=local/)) {
	Login.ENDPOINT = 'http://localyouagain.good-loop.com/youagain.json';
	console.warn('config', `Set you-again Login endpoint to ${Login.ENDPOINT}`);
} else if (window.location.href.match(/login=test/)) {
	Login.ENDPOINT = 'https://testyouagain.good-loop.com/youagain.json';
	console.warn('config', `Set you-again Login endpoint to ${Login.ENDPOINT}`);
}


const WIDGET_PATH = ['widget', 'LoginWidget', 'verb'];
const SHOW_PATH = [...WIDGET_PATH, 'show'];
const VERB_PATH = [...WIDGET_PATH, 'verb'];
const STATUS_PATH = [...WIDGET_PATH, 'status'];


/** Pretty names for the available verbs  */
const displayVerb = {
	login: "Log in",
	register: "Register",
	reset: "Reset",
	signin: "Sign in",
	connect: "Connect"
};

/** As above, but for a button */
const verbButtonLabels = {
	login: 'Log In',
	register: 'Register',
	reset: 'Reset password',
};

/** Services you can connect through */
const canSignIn = {
	facebook: true,
	instagram: true,
	twitter: true,
};


/** True if the login widget is open */
const getShowLogin = () => DataStore.getValue(SHOW_PATH);
/** Open or close the login widget */
const setShowLogin = show => {
	console.log("setShowLogin", show);
	return DataStore.setValue(SHOW_PATH, show);
}
/** Set the login widget's mode - eg login, register, reset */
const setLoginVerb = verb => DataStore.setValue(VERB_PATH, verb);

const socialLogin = (service) => {
	Login.auth(service, C.app.facebookAppId, Login.PERMISSIONS.ID_ONLY);
	// auth doesnt return a future, so rely on Login's change listener
	// to close stuff.
}; // ./socialLogin


/**
 * ajax call -- via Login.login() -- to login
 */
const emailLogin = ({verb, app, email, password, onRegister, onLogin}) => {
	assMatch(email, String, password, String);
	const call = (verb === 'register') ? (
		Login.register({email:email, password:password})
	) : (
		Login.login(email, password)
	);

	DataStore.setValue(STATUS_PATH, C.STATUS.loading);

	call.then(function(res) {
		console.warn("login", res);
		DataStore.setValue(STATUS_PATH, C.STATUS.clean);
		if (Login.isLoggedIn()) {
			// close the dialog on success
			// Security: wipe the password from DataStore
			DataStore.setValue(['data', C.TYPES.User, 'loggingIn', 'password'], null);

			if(verb === 'register' && onRegister) {
				onRegister({...res, email});
			} else {
				if (onLogin) onLogin({...res, email});
				setShowLogin(false);
			}
		} else {
			// poke React via DataStore (e.g. for Login.error)
			DataStore.update({});
		}
	}, err => {
		DataStore.setValue(STATUS_PATH, C.STATUS.clean);
	});
};




// Convenience: Stop propagation and prevent default on an event, null-safe
const killEvent = e => {
	if (!e) return;
	e.stopPropagation && e.stopPropagation();
	e.preventDefault && e.preventDefault();
}



/**
	TODO:
	- doEmailLogin(email, password) and doSocialLogin(service) are available as props now
	- Use them in the appropriate section of the form
*/



/**
 * @param {String} verb "login"|"register"
 */
const LoginLink = ({className, onClick, style, verb, children}) => {
	if (!verb && !children) verb = 'login';
	
	const onClick2 = e => {
		killEvent(e);
		if (verb) setLoginVerb(verb);
		setShowLogin(true);
		onClick && onClick(e);
	};
	
	return (
		<a className={className} href={window.location} onClick={onClick2} style={style}>
			{children || toTitleCase(displayVerb[verb])}
		</a>
	);
};

const LogoutLink = ({className}) => <a href={'#'} className="logout-link" onClick={() => Login.logout()}>Log out</a>;

const RegisterLink = ({className, ...props}) => <LoginLink
	className={className}
	onClick={() => setLoginVerb('register')}
	verb="Register"
	{...props}
/>;


const RegisteredThankYou = () => {
	const user = Login.getUser();
	const name = user.name || user.xid;
	return (<>
		<h3>Thank you- and welcome!</h3>
		Welcome to {C.app.name}, {name}!<br/>
		Check out your new account <a href="/#account">here</a>.
	</>);
};

/**
	Log In or Register (one widget)
	See SigninScriptlet
	@param render {?JSX} default: LoginWidgetGuts
	@param logo {?String} image url. If unset, guess via app.id
*/
const LoginWidget = ({showDialog, logo, title, Guts = LoginWidgetGuts, services, onLogin, onRegister, noRegister}) => {
	const show = getShowLogin();
	
	// Login widget will vanish when an in-page navigation is made
	const onHashChange = () => setShowLogin(false);

	// Use hashchange event as normal navigations a. should refresh and close the LoginWidget anyway and b. are hard to track
	useEffect(function() {
		window.addEventListener("hashchange", onHashChange);
		
		return function cleanup() {
		  window.removeEventListener("hashchange", onHashChange);
		}
	}, []);

	// Set up state for showing registration thanks
	const [showThankyou, setThankyou] = useState(false);
	// The widget shouldn't get stuck showing the thankyou, so reset it once it closes
	if (!show && showThankyou) setThankyou(false);

	if (!services) services = ['twitter', 'facebook'];
	let verb = DataStore.getValue(VERB_PATH) || 'login';

	if (!title) title = `Welcome ${(verb === 'login') ? '(back)' : ''} to ${C.app.name}`;

	const registerCallback = () => {
		setThankyou(true);
		if (onRegister) onRegister();
	}

	return (
		<Modal
			isOpen={show}
			className="login-modal"
			toggle={() => setShowLogin(!show)}
			size="lg"
		>
			<ModalHeader toggle={() => setShowLogin(!show)}>
				<Misc.Logo service={C.app.id} url={logo} transparent={false} className="pull-left m-r1" />
				{' '}{title}
			</ModalHeader>
			<ModalBody>
				{showThankyou ?
					<RegisteredThankYou />
				: <Guts services={services} onLogin={onLogin} onRegister={registerCallback} noRegister={noRegister} />}
			</ModalBody>
		</Modal>
	);
}; // ./LoginWidget


const SocialSignin = ({verb, services}) => {
	if (verb === 'reset') return null;
	if (!services) return null;

	const buttons = services.map(service => (
		<div key={service} className="form-group">
			<SocialSignInButton service={service} verb={verb} key={service} />
		</div>
	));

	return (
		<div className="social-signin">
			{buttons}
			<p><small>We will never share your data without your consent unless there is a legal obligation.
				You can read our <a href={C.app.privacyPolicy} target="_new">privacy policy</a> for more information.
			</small></p>
		</div>
	);
};

const SocialSignInButton = ({className = "btn signin", children, service, verb = 'login', size}) => {
	if ( ! canSignIn[service]) return null;
	if ( ! children) children = <>
		<Misc.Logo size="xsmall" service={service} color={false} square={false} /> {toTitleCase(displayVerb[verb])} with {toTitleCase(service)}
	</>;
	
	// TODO this will prep FB on mouseover -- But what about mobile or fast clickers?
	// TODO You Again should catch failure, and switch to a click through approach.
	const onMouseOver = service === 'facebook' ? () => Login.prepFB(C.app.facebookAppId) : null;

	className += ' ' + service
	// Add service-specific colours
	if ({facebook: 1, twitter: 1, instagram: 1}[service]) className += (' border border-white white bg-' + service);
	if (size) className += (' btn-' + size);

	return (
		<button onClick={() => socialLogin(service)} className={className} onMouseOver={onMouseOver}>
			{children}
		</button>
	);
};


const EmailReset = ({}) => {
	const verb = 'reset';
	const requested = DataStore.getValue('widget', 'LoginWidget', 'reset-requested');
	const path = ['data', C.TYPES.User, 'loggingIn'];

	const doItFn = e => {
		killEvent(e);				
		let email = DataStore.getValue(path.concat("email"));
		if ( ! email) {			
			Login.error = {text:'Please enter your email'};
			DataStore.update();
			return;
		}		
		assMatch(email, String);
		let call = Login.reset(email).then(res => {
			if (res.success) {
				DataStore.setValue(['widget', 'LoginWidget', 'reset-requested'], true);
				if (onLogin) onLogin(res);
			} else {
				DataStore.update({}); // The error will be in state, provoke a redraw to display it
			}
		});
	};

	return (
		<form id="loginByEmail" onSubmit={doItFn}>
			<p>Forgotten your password? No problem - we will email you a link to reset it.</p>
			<PropControl label='Email' type="email" path={path} prop="email" placeholder="Email" />			
			{requested ? <div className="alert alert-info">A password reset email has been sent out.</div> : ''}
			<div className="form-group">
				<Button type="submit" size="lg" color="primary" disabled={C.STATUS.isloading(status)}>
					{verbButtonLabels[verb]}
				</Button>
			</div>
			<ErrAlert error={Login.error} />
		</form>
	);
};


/**
 * @param onLogin called after user has successfully logged in
 * @param onRegister called after the user has successfully registered
 */
const EmailSignin = ({verb, onLogin, onRegister, noRegister}) => {
	// Reset: just email & submit
	if (verb === 'reset') {
		return <EmailReset />
	}

	// Registration disabled? Enforce it, out of paranoia
	if (noRegister && verb === 'register') {
		setLoginVerb('login');
		verb = 'login';
	}

	// we need a place to stash form info. Maybe appstate.widget.LoginWidget.name etc would be better?
	const path = ['data', C.TYPES.User, 'loggingIn'];
	let person = DataStore.getValue(path);

	const doItFn = e => {
		killEvent(e);
		if ( ! person) {			
			Login.error = {text:'Please fill in email and password'};
			return;
		}
		let email = person.email;
		emailLogin({verb, onRegister, ...person});
	};

	// login/register
	let status = DataStore.getValue(STATUS_PATH);
	return (
		<form id="loginByEmail" onSubmit={doItFn}>
			<PropControl label='Email' type="email" path={path} item={person} prop="email" placeholder="Email" />			
			<PropControl label='Password' type="password" path={path} item={person} prop="password" placeholder="Password" />
			<div className="form-group">
				<Button type="submit" size="lg" color="primary" disabled={C.STATUS.isloading(status)}>
					{verbButtonLabels[verb]}
				</Button>
				{noRegister ? null : <SwitchVerb verb={verb} />}
			</div>
			<ResetLink verb={verb} />
			<ErrAlert error={Login.error} />
		</form>
	);
}; // ./EmailSignin


const ResetLink = ({verb}) => {
	if (verb !== 'login') return null;
	const toReset = e => {
		killEvent(e);
		// clear any error from a failed login
		Login.error = null;
		DataStore.setValue(VERB_PATH, 'reset');
	};
	return (
		<small className="reset-link"><a href="#" onClick={toReset}>Forgotten password?</a></small>
	);
};

/**
 * A non-modal login widget - stick it in a page
 */
const LoginWidgetEmbed = ({services, verb, onLogin}) => {
	// NB: prefer the user-set verb (so they can change it)
	verb = DataStore.getValue(VERB_PATH) || verb || 'register';
	
	if(Login.isLoggedIn()) {
		const user = Login.getUser();
		return (
			<div>
				<p>Logged in as {user.name || user.xid}</p>
				<small>Not you? <Button color="link" size="sm" onClick={() => Login.logout()}>Log out</Button></small>
			</div>);
	}

	return (
		<div className="login-widget">
			<LoginWidgetGuts services={services} verb={verb} onLogin={onLogin} />
		</div>
	);
};

const SwitchVerb = ({verb = DataStore.getValue(VERB_PATH)}) => {
	let explain = (verb === 'register') ? 'Already have an account?' : 'Don\'t yet have an account?';
	let switchText = {register: 'Log In', login: 'Register'}[verb];
	let doIt = e => stopEvent(e) && setLoginVerb({login: 'register', register: 'login'}[verb]);

	return (
		<div className="switch-verb">
			<small>{explain}</small><br/>
			<a href="#" onClick={doIt}>{switchText}</a>
		</div>
	);
};

const LoginWidgetGuts = ({services, verb, onLogin, onRegister, noRegister}) => {
	if (!verb) verb = DataStore.getValue(VERB_PATH) || 'login';
	return (
		<div className="login-guts container-fluid">
			<Row>
				<div className="login-email col-sm-6 pb-2">
					<EmailSignin
						verb={verb}
						onLogin={onLogin}
						onRegister={onRegister}
						noRegister={noRegister}
					/>
				</div>
				<div className="login-social col-sm-6">
					<SocialSignin verb={verb} services={services} />
				</div>
			</Row>
		</div>
	);
};


const LoginPage = ({error}) => (
	<div>
		<h3 className="mt-2">Welcome to {C.app.name} - Please Sign-up or Login below</h3>
		<LoginWidgetEmbed />
	</div>);

export default LoginWidget;
export {
	LoginLink,
	LogoutLink,
	LoginWidgetEmbed,
	RegisterLink,
	SocialSignInButton,
	EmailSignin,
	SocialSignin,
	VERB_PATH,
	getShowLogin,
	setShowLogin,
	setLoginVerb,
	emailLogin,
	socialLogin,
	LoginPage
};
