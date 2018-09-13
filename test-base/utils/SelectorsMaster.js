// Eventually want to refactor so that all puppeteer files fetch selectors from here
import PortalSelectors from './SelectorsPortal';
import AdServerSelectors from './SelectorsAdServer';
import SoGiveSelectors from './SelectorsSoGive';

const CommonSelectors = {
    'log-in': '#top-right-menu > li > a',
    'log-in-email': `#loginByEmail > div:nth-child(1) > input`,
    'log-in-password': `#loginByEmail > div:nth-child(2) > input`,
    Save: `div.SavePublishDiscard > button.btn.btn-default`,
    Publish: `div.SavePublishDiscard > button.btn.btn-primary`,
    Discard: `div.SavePublishDiscard > button.btn.btn-warning`,
    Delete: `div.SavePublishDiscard > button.btn.btn-danger`,
    facebookLogin: 'span.color-facebook',
    twitterLogin: 'span.color-twitter'
};

const FacebookSelectors = {
    username: '#email',
    password: '#pass',
    login: '#loginbutton'
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
    TwitterSelectors
};