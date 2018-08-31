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
    Delete: `div.SavePublishDiscard > button.btn.btn-danger` 
};

module.exports = {
    CommonSelectors,
    PortalSelectors,
    AdServerSelectors,
    SoGiveSelectors
};