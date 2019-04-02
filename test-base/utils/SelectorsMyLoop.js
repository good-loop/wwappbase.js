const MyLoopSelectors = {
    'log-in':"#top-right-menu",
    logged_in_greeting:"div.post-login",
    name: `#my > div > div.container.avoid-navbar > div > div:nth-child(4) > div.panel-body > div:nth-child(1) > div > div.mirror > div.container.word-wrap > div > div.col-sm-5.col-sm-pull-5.profile-details > div:nth-child(1) > div.col-md-8 > input`,
    gender: `#my > div > div.container.avoid-navbar > div > div:nth-child(4) > div.panel-body > div:nth-child(1) > div > div.mirror > div.container.word-wrap > div > div.col-sm-5.col-sm-pull-5.profile-details > div:nth-child(2) > div.col-md-8 > select`,
    location: `#my > div > div.container.avoid-navbar > div > div:nth-child(4) > div.panel-body > div:nth-child(1) > div > div.mirror > div.container.word-wrap > div > div.col-sm-5.col-sm-pull-5.profile-details > div:nth-child(3) > div.col-md-8 > input`,
    job: `#my > div > div.container.avoid-navbar > div > div:nth-child(4) > div.panel-body > div:nth-child(1) > div > div.mirror > div.container.word-wrap > div > div.col-sm-5.col-sm-pull-5.profile-details > div:nth-child(4) > div.col-md-8 > input`,
    relationship: `#my > div > div.container.avoid-navbar > div > div:nth-child(4) > div.panel-body > div:nth-child(1) > div > div.mirror > div.container.word-wrap > div > div.col-sm-5.col-sm-pull-5.profile-details > div:nth-child(5) > div.col-md-8 > select`,
    edit: 'button.edit',
    // "recordDonations":`div.form-group label.radio-inline input[name="cookies"][value="true"]`,
    // "-recordDonations":`div.form-group label.radio-inline input[name="personaliseAds"][value="false"]`,
    "sendMessages":`div.form-group label.radio-inline input[name="sendMessages"][value="true"]`,
    "-sendMessages":`div.form-group label.radio-inline input[name="sendMessages"][value="false"]`,
    "personaliseAds":`div.form-group label.radio-inline input[name="personaliseAds"][value="true"]`,
    "-personaliseAds":`div.form-group label.radio-inline input[name="personaliseAds"][value="false"]`
};

module.exports = MyLoopSelectors;
