const General = {};

General.CRUD = {
    Save: `div.SavePublishDiscard > button.btn.btn-default`,
    Publish: `div.SavePublishDiscard > button.btn.btn-primary`,
    Discard: `div.SavePublishDiscard > button.btn.btn-warning`,
    Delete: `div.SavePublishDiscard > button.btn.btn-danger` 
};

General.Environmnet = {
    'log-in':'#top-right-menu > li > a'
};

const Main = {
    FirstCharityIcon: "#glbox > div > div.charity-chooser > ul > li:nth-child(1) > div",
    Banner: "div.glhdr"
};

const Advertiser = {
    Create: "#advertiser > div > div > div:nth-child(2) > button",
    'name': "#advertiser > div > div > div.form > div.form-group > input",
    'charity-id': "div > div:nth-child(2) > div.form-group > div > input",
    'charity-name': "#advertiser > div > div > div.form > div.Card.panel.panel-warning > div.panel-body > div.container-fluid > div > div:nth-child(1) > div > div:nth-child(3) > input",
    'charity-url': "#advertiser > div > div > div.form > div.Card.panel.panel-warning > div.panel-body > div.container-fluid > div > div:nth-child(1) > div > div:nth-child(4) > div > input",
    'charity-white-logo': "#advertiser > div > div > div.form > div.Card.panel.panel-warning > div.panel-body > div.container-fluid > div > div:nth-child(1) > div > div:nth-child(5) > div > input",
    'charity-colour-logo': "#advertiser > div > div > div.form > div.Card.panel.panel-warning > div.panel-body > div.container-fluid > div > div:nth-child(1) > div > div:nth-child(7) > div > input",
    'charity-small-print': "#advertiser > div > div > div.form > div.Card.panel.panel-warning > div.panel-body > div.container-fluid > div > div:nth-child(1) > div > div:nth-child(9) > input",
    'charity-circle-crop-factor': "#advertiser > div > div > div.form > div.Card.panel.panel-warning > div.panel-body > div.container-fluid > div > div:nth-child(1) > div > div:nth-child(10) > input",
    'parent-charity-id': "#advertiser > div > div > div.form > div.Card.panel.panel-warning > div.panel-body > div:nth-child(5) > div.form-group > div > input"
};

const Advert = {
    Create: '#advert > div > div:nth-child(2) > button',
    on: '#advert > div > div:nth-child(2) > div > div:nth-child(4) > div > label',
    name: '#advert > div > div:nth-child(2) > div > div > div:nth-child(7) > input',
    campaign: '#advert > div > div:nth-child(2) > div > div > div:nth-child(8) > input',
    logo: '#advert > div > div:nth-child(2) > div > div > div.CardAccordion > div:nth-child(1) > div.panel-body > div:nth-child(1) > div > input',
    'white-logo': '#advert > div > div:nth-child(2) > div > div > div.CardAccordion > div:nth-child(1) > div.panel-body > div:nth-child(2) > div > input',
    about: '#advert > div > div:nth-child(2) > div > div > div.CardAccordion > div:nth-child(1) > div.panel-body > div:nth-child(6) > textarea',
    video: '#advert > div > div:nth-child(2) > div > div > div.CardAccordion > div:nth-child(5) > div.panel-body > div:nth-child(1) > input',
    'mobile-video': '#advert > div > div:nth-child(2) > div > div > div.CardAccordion > div:nth-child(5) > div.panel-body > div:nth-child(4) > input',
};

const Selectors = {
    Advertiser,
    Advert,
    General,
    Main
};

module.exports = Selectors;
