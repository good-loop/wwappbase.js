const MyLoopSelectors = {
    'log-in':"#top-right-menu",
    logged_in_greeting:".dropdown",
    name: 'input[placeholder="Unknown name"]',
    gender: 'select[placeholder="Unknown gender"]',
    location: 'input[placeholder="Unknown location"]',
    job: 'input[placeholder="Unknown job"]',
    relationship: 'select[placeholder="Unknown relationship"]',
    edit: 'button.edit',
    // "recordDonations":`div.form-group label.radio-inline input[name="cookies"][value="true"]`,
    // "-recordDonations":`div.form-group label.radio-inline input[name="personaliseAds"][value="false"]`,
    "sendMessages":`div.form-group label.radio-inline input[name="sendMessages"][value="true"]`,
    "-sendMessages":`div.form-group label.radio-inline input[name="sendMessages"][value="false"]`,
    "personaliseAds":`div.form-group label.radio-inline input[name="personaliseAds"][value="true"]`,
    "-personaliseAds":`div.form-group label.radio-inline input[name="personaliseAds"][value="false"]`
};

module.exports = MyLoopSelectors;
