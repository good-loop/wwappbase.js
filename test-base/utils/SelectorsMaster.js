import PortalSelectors from './SelectorsPortal';
import AdServerSelectors from './SelectorsAdServer';
import SoGiveSelectors from './SelectorsSoGive';
import MyLoopSelectors from './SelectorsMyLoop';


// Selectors that are used across all platfroms are written directly in SelectorsMaster
const CommonSelectors = {
    'log-in': '#top-right-menu > li > a',
    'log-in-email': '#loginByEmail input[name="email"]',
    'log-in-password': '#loginByEmail input[name="password"]',
    Save: `div.SavePublishDiscard > button.btn.btn-default`,
    Publish: `div.SavePublishDiscard > button.btn.btn-primary`,
    Discard: `div.SavePublishDiscard > button.btn.btn-warning`,
    Delete: `div.SavePublishDiscard > button.btn.btn-danger`,
    facebookLogin: 'div.social-signin span.color-facebook',
    twitterLogin: 'div.social-signin span.color-twitter'
};

const FacebookSelectors = {
    username: '#email',
    password: '#pass',
    login: '#loginbutton',
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

module.exports = {
    AdServerSelectors,
    CommonSelectors,
    FacebookSelectors,
    PortalSelectors,
    SoGiveSelectors,
    TwitterSelectors,
    MyLoopSelectors
};