const General = {};

General.CRUD = {
	Save: `div.SavePublishDiscard > button.btn.btn-default`,
	Publish: `div.SavePublishDiscard > button.btn.btn-primary`,
	Discard: `div.SavePublishDiscard > button.btn.btn-warning`,
	Delete: `div.SavePublishDiscard > button.btn.btn-danger` 
};

General.Environment = {
	logIn: '#top-right-menu > li > a'
};

const Main = {
	FirstCharityIcon: "#glbox > div > div.charity-chooser > ul > li:nth-child(1) > div",
	Banner: "div.glhdr"
};

const Advertiser = {
	Create: "#advertiser > div > div:nth-child(2) > button",
	'name': "#advertiser > div > div > div.form > div.form-group > input",
	'contact-name': "#advertiser > div > div > div.form > div.well > div:nth-child(3) > input",
	'contact-email': "#advertiser > div > div > div.form > div.well > div.form-group.XId > input",
	'contact-title': "#advertiser > div > div > div.form > div.well > div:nth-child(4) > input"
};

const Advert = {
	Create: 'span.glyphicon-plus',
	on: '#advert > div > div:nth-child(2) > div > div:nth-child(4) > div > label',
	name: '#advert input[name="name"]',
	campaign: '#advert input[name="campaign"]',
	logo: 'div.imgUpload input[name="logo"]',
	'white-logo': 'div.imgUpload input[name="logo_white"]',
	about: 'textarea[name="about"]',
	video: '#advert input[name="url"]',
	videoSeconds: '#advert input[name="videoSeconds"]',
	viewAdverts: '#advertiser > div > div > div:nth-child(2) > a',
	charityOne: '#advert > div > div:nth-child(2) > div > div > div.CardAccordion > div:nth-child(6) > div.panel-body > div.container-fluid > div > div:nth-child(1) > div > div:nth-child(2) > div.form-group.autocomplete > div > input',
	charityTwo: '#advert > div > div:nth-child(2) > div > div > div.CardAccordion > div:nth-child(6) > div.panel-body > div.container-fluid > div > div:nth-child(2) > div > div:nth-child(2) > div.form-group.autocomplete > div > input',
	charityThree: '#advert > div > div:nth-child(2) > div > div > div.CardAccordion > div:nth-child(6) > div.panel-body > div.container-fluid > div > div:nth-child(3) > div > div:nth-child(2) > div.form-group.autocomplete > div > input'
};

const PubSignUp = {
	email: '#loginByEmail input[name="email"]',
	password: '#loginByEmail input[name="password"]',
	register: '#loginByEmail > div:nth-child(3) > button',
	next: 'div.nav-buttons.clearfix > button.pull-right:not([disabled])',
	linkToWebsite: '#pubsignup > div > div.WizardStage > div.form-group > input',
	claimSite: '#pubsignup > div > div.WizardStage > button',
	wordPressInstructions: '#WordPress',
	pubPageLink: '#pubsignup > div > div.WizardStage > div:nth-child(1) > div > a',
};

const AdSignUp = {
	email: 'input[name="email"]',
	website: 'input[name="url"]',
	video: 'input[name="video"]',
	logo: 'input[name="logo"]',
	charityOne: 'input[placeholder="Charity A"]',
	charityTwo: 'input[placeholder="Charity B"]',
	charityThree: 'input[placeholder="Charity C"]',
	total: 'input[name="total"]',
	notes: 'textarea[name="notes"]',
	submit: 'button.btn.btn-lg.btn-primary'
};

const Selectors = {
	Advertiser,
	Advert,
	General,
	Main,
	PubSignUp,
	AdSignUp
};

module.exports = Selectors;
