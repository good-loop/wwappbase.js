const MyLoopSelectors = {
    'log-in':"#my > div > div.container.avoid-navbar > div > div.Card.panel.panel-default.headerCard > div > div > div > div.col-md-7.header-text.frank-font > a",
    logged_in_greeting:"div.WelcomeCard div.logged-in",
    name: `#my > div > div.container.avoid-navbar > div > div:nth-child(4) > div.panel-body > div:nth-child(1) > div > div.mirror > div.container > div > div.col-md-4.profile-details > div:nth-child(1) > div.col-md-8 > input`,
    gender: `#my > div > div.container.avoid-navbar > div > div:nth-child(4) > div.panel-body > div:nth-child(1) > div > div.mirror > div.container > div > div.col-md-4.profile-details > div:nth-child(2) > div.col-md-8 > select`,
    location: `#my > div > div.container.avoid-navbar > div > div:nth-child(4) > div.panel-body > div:nth-child(1) > div > div.mirror > div.container > div > div.col-md-4.profile-details > div:nth-child(3) > div.col-md-8 > input`,
    job: `#my > div > div.container.avoid-navbar > div > div:nth-child(4) > div.panel-body > div:nth-child(1) > div > div.mirror > div.container > div > div.col-md-4.profile-details > div:nth-child(4) > div.col-md-8 > input`,
    relationship: `#my > div > div.container.avoid-navbar > div > div:nth-child(4) > div.panel-body > div:nth-child(1) > div > div.mirror > div.container > div > div.col-md-4.profile-details > div:nth-child(5) > div.col-md-8 > select`,
    edit: `#my > div > div.container.avoid-navbar > div > div:nth-child(4) > div.panel-body > div:nth-child(1) > div > div:nth-child(2) > div > button`,
    "personaliseAds":`#my > div > div.container.avoid-navbar > div > div:nth-child(5) > div.panel-body > div > div:nth-child(3) > div > label:nth-child(1)`,
    "-personaliseAds":`#my > div > div.container.avoid-navbar > div > div:nth-child(5) > div.panel-body > div > div:nth-child(5) > div > label:nth-child(2)`,
    "recordDonations":`#my > div > div.container.avoid-navbar > div > div:nth-child(5) > div.panel-body > div > div:nth-child(3) > div > label:nth-child(1)`,
    "-recordDonations":`#my > div > div.container.avoid-navbar > div > div:nth-child(5) > div.panel-body > div > div:nth-child(3) > div > label:nth-child(2)`,
    "recordAdsBehaviour":`#my > div > div.container.avoid-navbar > div > div:nth-child(5) > div.panel-body > div > div:nth-child(6) > div > label:nth-child(1)`,
    "-recordAdsBehaviour":`#my > div > div.container.avoid-navbar > div > div:nth-child(5) > div.panel-body > div > div:nth-child(6) > div > label:nth-child(2)`
};

module.exports = MyLoopSelectors;