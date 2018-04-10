'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _sjtest = require('sjtest');

var _wwutils = require('wwutils');

var _DataStore = require('../plumbing/DataStore');

var _DataStore2 = _interopRequireDefault(_DataStore);

var _C = require('../C');

var _C2 = _interopRequireDefault(_C);

var _Money = require('../data/charity/Money');

var _Money2 = _interopRequireDefault(_Money);

var _NGO = require('../data/charity/NGO');

var _NGO2 = _interopRequireDefault(_NGO);

var _Project = require('../data/charity/Project');

var _Project2 = _interopRequireDefault(_Project);

var _Misc = require('./Misc.jsx');

var _Misc2 = _interopRequireDefault(_Misc);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var shareOnFacebook = function shareOnFacebook(_ref) {
	var url = _ref.url,
	    shareText = _ref.shareText,
	    take2 = _ref.take2;

	if (window.FB) {
		FB.ui({
			quote: shareText,
			method: 'share',
			href: url
		},
		// callback
		function (response) {
			console.log("FB", response);
			if (response && response.error_message) {
				console.error('Error while posting.');
				return;
			}
			// foo
		});
		return;
	}
	if (take2) {
		throw new Error("Could not load Facebook");
	}
	// Load FB
	window.fbAsyncInit = function () {
		FB.init({
			appId: _C2.default.app.facebookAppId,
			autoLogAppEvents: false,
			xfbml: false,
			version: 'v2.9',
			status: true // auto-check login
		});
		// now try
		take2 = true;
		shareOnFacebook({ url: url, shareText: shareText, take2: take2 });
	};
	(function (d, s, id) {
		var fjs = d.getElementsByTagName(s)[0];
		if (d.getElementById(id)) return;
		var js = d.createElement(s);js.id = id;
		js.src = "//connect.facebook.net/en_US/sdk.js";
		fjs.parentNode.insertBefore(js, fjs);
	})(document, 'script', 'facebook-jssdk');
	return;
}; // ./shareOnFacebook


// TODO move social share buttons from DonationForm here

var SocialShare = function SocialShare(_ref2) {
	var charity = _ref2.charity,
	    donation = _ref2.donation,
	    shareText = _ref2.shareText;

	if (!shareText) {
		shareText = _NGO2.default.summaryDescription(charity) || _NGO2.default.displayName(charity);
	}
	var lcn = "" + window.location;
	var pageInfo = {
		title: _NGO2.default.displayName(charity),
		image: _NGO2.default.image(charity),
		desc: _NGO2.default.summaryDescription(charity),
		shareText: shareText
	};
	// TODO make this line nicer
	// TODO just send the charity ID, and load the rest server side, to give a nicer url
	// Also window.location might contain parameters we dont want to share.
	var url = "https://app.sogive.org/share?link=" + (0, _wwutils.encURI)(lcn) + "&title=" + (0, _wwutils.encURI)(pageInfo.title) + "&image=" + (0, _wwutils.encURI)(pageInfo.image) + "&desc=" + (0, _wwutils.encURI)(pageInfo.desc);
	pageInfo.url = url;

	return _react2.default.createElement(
		'div',
		{ className: 'share-social-buttons' },
		_react2.default.createElement(
			'a',
			{ className: 'share-social-twitter',
				href: 'https://twitter.com/intent/tweet?text=' + (0, _wwutils.encURI)(shareText) + '&url=' + (0, _wwutils.encURI)(url), 'data-show-count': 'none' },
			_react2.default.createElement('span', { className: 'fa fa-twitter' })
		),
		_react2.default.createElement(
			'a',
			{ className: 'share-social-facebook', onClick: function onClick(e) {
					return shareOnFacebook(pageInfo);
				} },
			_react2.default.createElement('span', { className: 'fa fa-facebook' })
		),
		_react2.default.createElement(
			'a',
			{ className: 'share-social-email',
				href: 'mailto:?subject=' + (0, _wwutils.encURI)(_NGO2.default.displayName(charity) + " shared via SoGive") + '&body=' + (0, _wwutils.encURI)(window.location),
				target: '_blank'
			},
			_react2.default.createElement('span', { className: 'fa fa-envelope-o' })
		)
	);
};

exports.default = SocialShare;