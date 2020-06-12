
// Selectors that are used across all platfroms are written directly in SelectorsMaster
const CommonSelectors = {
	logIn: '.login-link',
	logInEmail: '#loginByEmail input[name="email"]',
	logInPassword: '#loginByEmail input[name="password"]',
	Save: '.SavePublishDiscard button[name="save"]',
	SaveAs: '.SavePublishDiscard button[name="save-as"]',
	Publish: '.SavePublishDiscard button[name="publish"]',
	DiscardEdits: '.SavePublishDiscard button[name="discard-edits"]',
	Unpublish: '.SavePublishDiscard button[name="unpublish"]',
	Delete: '.SavePublishDiscard button[name="delete"]',
	facebookLogin: '.social-signin .facebook',
	twitterLogin: '.social-signin .twitter'
};

const TestAs = {
	FirstCharityIcon: "chooser-list.ready > a",
	Banner: "#banner",
	ClickToPlay: ".gl-play-video",
	TwitterLink: "a[alt='Twitter']",
	LinkedInLink: "a[alt='LinkedIn']",
	FacebookLink: "a[alt='Facebook']"
};

const FacebookSelectors = {
	username: '#email',
	password: '#pass',
	login: '#loginbutton input',
	continue: '#u_0_4 > div._58xh._1flz > div._1fl- > div._2mgi._4k6n > button'
};

const TwitterSelectors = {
	apiUsername: '#username_or_email',
	apiPassword: '#password',
	apiLogin: '#allow',
	username: 'fieldset > div:nth-child(2) > input',
	password: 'div:nth-child(3) > input',
	login: 'div.clearfix > button'
};

// Portal selectors
const CRUD = {
	Save: `div.SavePublishDiscard [name=save]`,
	Publish: `div.SavePublishDiscard [name=publish]`,
	Discard: `div.SavePublishDiscard [name=discard]`,
	Delete: `div.SavePublishDiscard [name=delete]`
};

const Environment = {
	logIn: '#top-right-menu .login-link a'
};

const Main = {
	FirstCharityIcon: ".chooser-list .ch1",
	Banner: "div.glhdr"
};

const Advertiser = {
	Create: "[name=create-item]",
	'name': "#advertiser input.brand-name",
	'contact-name': "#advertiser .person-editor input[name=name]",
	'contact-email': "#advertiser .person-editor input[name=id]",
	'contact-title': "#advertiser .person-editor input[name=description]",
};

const Advert = {
	Create: '#advert [name=create-item]',
	on: '#advert > div > div:nth-child(2) > div > div:nth-child(4) > div > label', // TODO Update this when we find out how it's used
	name: '#advert input[name="name"]',
	campaign: '#advert input[name="campaign"]',
	logo: '#advert .branding-editor input[name="logo"]',
	'white-logo': '#advert .branding-editor input[name="logo_white"]',
	about: '#advert .branding-editor [name="about"]',
	video: '#advert .videos-editor .item-editor:first-child input[name="url"]',
	videoSeconds: '#advert .videos-editor .item-editor:first-child input[name="videoSeconds"]',
	viewAdverts: '#advertiser > div > div > div:nth-child(2) > a', // TODO Update this when we find out how it's used
	charityOne: '#advert .charity-controls .ch1 .autocomplete input', // May be fragile - .autocomplete class is set by a module we need to switch away from
	charityTwo: '#advert .charity-controls .ch2 .autocomplete input',
	charityThree: '#advert .charity-controls .ch3 .autocomplete input'
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

module.exports = {
	CommonSelectors,
	TestAs,
	FacebookSelectors,
	TwitterSelectors,
	CRUD,
	Environment,
	Main,
	Advertiser,
	Advert,
	AdSignUp
};
