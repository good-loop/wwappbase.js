'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.LoginWidgetEmbed = exports.LoginLink = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _sjtest = require('sjtest');

var _youAgain = require('you-again');

var _youAgain2 = _interopRequireDefault(_youAgain);

var _reactBootstrap = require('react-bootstrap');

var _wwutils = require('wwutils');

var _jsCookie = require('js-cookie');

var _jsCookie2 = _interopRequireDefault(_jsCookie);

var _DataStore = require('../../plumbing/DataStore');

var _DataStore2 = _interopRequireDefault(_DataStore);

var _ActionMan = require('../../plumbing/ActionMan');

var _ActionMan2 = _interopRequireDefault(_ActionMan);

var _Misc = require('../Misc');

var _Misc2 = _interopRequireDefault(_Misc);

var _C = require('../../C');

var _C2 = _interopRequireDefault(_C);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// For testing
if (("" + window.location).indexOf('login=local') !== -1) {
	_youAgain2.default.ENDPOINT = 'http://localyouagain.winterwell.com/youagain.json';
	console.warn("config", "Set you-again Login endpoint to " + _youAgain2.default.ENDPOINT);
}

/**
	TODO:
	- doEmailLogin(email, password) and doSocialLogin(service) are available as props now
	- Use them in the appropriate section of the form
*/

var STATUS_PATH = ['widget', _C2.default.show.LoginWidget, 'status'];

var LoginLink = function LoginLink() {
	return _react2.default.createElement(
		'a',
		{ href: window.location, onClick: function onClick(e) {
				e.preventDefault();e.stopPropagation();_DataStore2.default.setShow(_C2.default.show.LoginWidget, true);
			} },
		'Login or Register'
	);
};

var canSignIn = {
	facebook: true,
	instagram: true,
	twitter: true
};

var SocialSignin = function SocialSignin(_ref) {
	var verb = _ref.verb,
	    services = _ref.services;

	if (verb === 'reset') return null;
	if (!services) {
		return null;
	}
	return _react2.default.createElement(
		'div',
		{ className: 'social-signin' },
		services.map(function (service) {
			return _react2.default.createElement(SocialSignInButton, { service: service, verb: verb, key: service });
		}),
		_react2.default.createElement(
			'p',
			null,
			_react2.default.createElement(
				'small',
				null,
				'We will never share your data or post to social media without your consent. You can read our ',
				_react2.default.createElement(
					'a',
					{ href: 'https://sogive.org/privacy-policy.html', target: '_new' },
					'privacy policy'
				),
				' for more information.'
			)
		)
	);
};

var SocialSignInButton = function SocialSignInButton(_ref2) {
	var service = _ref2.service,
	    verb = _ref2.verb;

	if (!canSignIn[service]) return null;

	return _react2.default.createElement(
		'div',
		{ className: 'form-group' },
		_react2.default.createElement(
			'button',
			{ onClick: function onClick() {
					return socialLogin(service);
				}, className: 'btn btn-default signin' },
			_react2.default.createElement(_Misc2.default.Logo, { size: 'small', service: service, bgcolor: true }),
			' ',
			_react2.default.createElement(
				'span',
				null,
				(0, _wwutils.toTitleCase)(verb),
				' with ',
				(0, _wwutils.toTitleCase)(service)
			)
		)
	);
};

var socialLogin = function socialLogin(service) {
	_youAgain2.default.auth(service, _C2.default.app.facebookAppId);
	// auth doesnt return a future, so rely on Login's change listener
	// to close stuff.
}; // ./socialLogin


var emailLogin = function emailLogin(_ref3) {
	var verb = _ref3.verb,
	    app = _ref3.app,
	    email = _ref3.email,
	    password = _ref3.password;

	(0, _sjtest.assMatch)(email, String, password, String);
	var call = verb === 'register' ? _youAgain2.default.register({ email: email, password: password }) : _youAgain2.default.login(email, password);

	_DataStore2.default.setValue(STATUS_PATH, _C2.default.STATUS.loading);

	call.then(function (res) {
		console.warn("login", res);
		_DataStore2.default.setValue(STATUS_PATH, _C2.default.STATUS.clean);
		if (_youAgain2.default.isLoggedIn()) {
			// close the dialog on success
			_DataStore2.default.setShow(_C2.default.show.LoginWidget, false);
		} else {
			// poke React via DataStore (e.g. for Login.error)
			_DataStore2.default.update({});
		}
	}, function (err) {
		_DataStore2.default.setValue(STATUS_PATH, _C2.default.STATUS.clean);
	});
};

var EmailSignin = function EmailSignin(_ref4) {
	var verb = _ref4.verb,
	    onLogin = _ref4.onLogin;

	// we need a place to stash form info. Maybe appstate.widget.LoginWidget.name etc would be better?
	var person = _DataStore2.default.appstate.data.User.loggingIn;

	var doItFn = function doItFn() {
		if (!person) {
			_youAgain2.default.error = { text: "Please fill in email and password" };
			return;
		}
		var e = person.email;
		var p = person.password;
		if (verb === 'reset') {
			(0, _sjtest.assMatch)(e, String);
			var call = _youAgain2.default.reset(e).then(function (res) {
				if (res.success) {
					_DataStore2.default.setValue(['widget', _C2.default.show.LoginWidget, 'reset-requested'], true);
					if (onLogin) onLogin(res);
				} else {
					// poke React via DataStore (for Login.error)
					_DataStore2.default.update({});
				}
			});
			return;
		}
		emailLogin(_extends({ verb: verb }, person));
	};

	var buttonText = {
		login: 'Log in',
		register: 'Register',
		reset: 'Reset password'
	}[verb];

	// login/register
	var path = ['data', _C2.default.TYPES.User, 'loggingIn'];
	var status = _DataStore2.default.getValue(STATUS_PATH);
	return _react2.default.createElement(
		'form',
		{
			id: 'loginByEmail',
			onSubmit: function onSubmit(event) {
				event.preventDefault();
				doItFn();
			}
		},
		verb === 'reset' ? _react2.default.createElement(
			'p',
			null,
			'Forgotten your password? No problem - we will email you a link to reset it.'
		) : null,
		_react2.default.createElement(
			'div',
			{ className: 'form-group' },
			_react2.default.createElement(
				'label',
				null,
				'Email'
			),
			_react2.default.createElement(_Misc2.default.PropControl, { type: 'email', path: path, item: person, prop: 'email' })
		),
		verb === 'reset' ? null : _react2.default.createElement(
			'div',
			{ className: 'form-group' },
			_react2.default.createElement(
				'label',
				null,
				'Password'
			),
			_react2.default.createElement(_Misc2.default.PropControl, { type: 'password', path: path, item: person, prop: 'password' })
		),
		verb === 'reset' && _DataStore2.default.getValue('widget', _C2.default.show.LoginWidget, 'reset-requested') ? _react2.default.createElement(
			'div',
			{ className: 'alert alert-info' },
			'A password reset email has been sent out.'
		) : null,
		_react2.default.createElement(
			'div',
			{ className: 'form-group' },
			_react2.default.createElement(
				'button',
				{ type: 'submit', className: 'btn btn-primary form-control', disabled: _C2.default.STATUS.isloading(status) },
				buttonText
			)
		),
		_react2.default.createElement(LoginError, null),
		_react2.default.createElement(ResetLink, { verb: verb })
	);
}; // ./EmailSignin

var verbPath = ['widget', _C2.default.show.LoginWidget, 'verb'];

var ResetLink = function ResetLink(_ref5) {
	var verb = _ref5.verb;

	if (verb !== 'login') return null;
	var toReset = function toReset() {
		// clear any error from a failed login
		_youAgain2.default.error = null;
		_DataStore2.default.setValue(verbPath, 'reset');
	};
	return _react2.default.createElement(
		'div',
		{ className: 'pull-right' },
		_react2.default.createElement(
			'small',
			null,
			_react2.default.createElement(
				'a',
				{ onClick: toReset },
				'Forgotten password?'
			)
		)
	);
};

var LoginError = function LoginError() {
	if (!_youAgain2.default.error) return _react2.default.createElement('div', null);
	return _react2.default.createElement(
		'div',
		{ className: 'form-group' },
		_react2.default.createElement(
			'div',
			{ className: 'alert alert-danger' },
			_youAgain2.default.error.text
		)
	);
};

/**
		Login or Signup (one widget)
		See SigninScriptlet

*/
var LoginWidget = function LoginWidget(_ref6) {
	var showDialog = _ref6.showDialog,
	    logo = _ref6.logo,
	    title = _ref6.title,
	    services = _ref6.services;

	if (showDialog === undefined) {
		showDialog = _DataStore2.default.getShow('LoginWidget');
		// NB: the app is shown regardless
	}
	if (!services) services = ['twitter', 'facebook'];
	var verb = _DataStore2.default.getValue(verbPath) || 'login';

	if (!title) title = 'Welcome ' + (verb === 'login' ? '(back)' : '') + ' to {C.app.name}';

	var heading = {
		login: 'Log In',
		register: 'Register',
		reset: 'Reset Password'
	}[verb];

	return _react2.default.createElement(
		_reactBootstrap.Modal,
		{ show: showDialog, className: 'login-modal', onHide: function onHide() {
				return _DataStore2.default.setShow(_C2.default.show.LoginWidget, false);
			} },
		_react2.default.createElement(
			_reactBootstrap.Modal.Header,
			{ closeButton: true },
			_react2.default.createElement(
				_reactBootstrap.Modal.Title,
				null,
				_react2.default.createElement(_Misc2.default.Logo, { service: logo, size: 'large', transparent: false }),
				title
			)
		),
		_react2.default.createElement(
			_reactBootstrap.Modal.Body,
			null,
			_react2.default.createElement(LoginWidgetGuts, { services: services })
		),
		_react2.default.createElement(
			_reactBootstrap.Modal.Footer,
			null,
			_react2.default.createElement(SwitchVerb, null)
		)
	);
}; // ./LoginWidget


var LoginWidgetEmbed = function LoginWidgetEmbed(_ref7) {
	var services = _ref7.services,
	    verb = _ref7.verb,
	    onLogin = _ref7.onLogin;

	if (!verb) verb = _DataStore2.default.getValue(verbPath) || 'register';
	return _react2.default.createElement(
		'div',
		{ className: 'login-widget' },
		_react2.default.createElement(LoginWidgetGuts, { services: services, verb: verb, onLogin: onLogin }),
		_react2.default.createElement(SwitchVerb, { verb: verb })
	);
};

var SwitchVerb = function SwitchVerb(_ref8) {
	var verb = _ref8.verb;

	if (!verb) verb = _DataStore2.default.getValue(verbPath);
	if (verb === 'register') {
		return _react2.default.createElement(
			'div',
			{ className: 'switch-verb' },
			'Already have an account? ',
			_react2.default.createElement(
				'button',
				{ className: 'btn btn-primary', onClick: function onClick(e) {
						return (0, _wwutils.stopEvent)(e) && _DataStore2.default.setValue(verbPath, 'login');
					} },
				'Login'
			)
		);
	}
	return _react2.default.createElement(
		'div',
		{ className: 'switch-verb' },
		'Don\'t yet have an account? ',
		_react2.default.createElement(
			'button',
			{ className: 'btn btn-primary', onClick: function onClick(e) {
					return (0, _wwutils.stopEvent)(e) && _DataStore2.default.setValue(verbPath, 'register');
				} },
			'Register'
		)
	);
};

var LoginWidgetGuts = function LoginWidgetGuts(_ref9) {
	var services = _ref9.services,
	    verb = _ref9.verb,
	    onLogin = _ref9.onLogin;

	if (!verb) verb = _DataStore2.default.getValue(verbPath) || 'login';
	return _react2.default.createElement(
		'div',
		{ className: 'login-guts container-fluid' },
		_react2.default.createElement(
			'div',
			{ className: 'login-divs row' },
			_react2.default.createElement(
				'div',
				{ className: 'login-email col-sm-6' },
				_react2.default.createElement(EmailSignin, {
					verb: verb,
					onLogin: onLogin
				})
			),
			_react2.default.createElement(
				'div',
				{ className: 'login-social col-sm-6' },
				_react2.default.createElement(SocialSignin, { verb: verb, services: services })
			)
		)
	);
};

exports.default = LoginWidget;
exports.LoginLink = LoginLink;
exports.LoginWidgetEmbed = LoginWidgetEmbed;