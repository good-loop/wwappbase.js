const MyLoopSelectors = {
    sign_up:"a[href='https://testmy.good-loop.com/#my']",
    logged_in_greeting:"div.WelcomeCard div.logged-in",
    "personaliseAds":`#my > div > div.container.avoid-navbar > div > div:nth-child(6) > div.panel-body > div > div:nth-child(3) > div > label:nth-child(1)`,
    "-personaliseAds":"#my > div > div.container.avoid-navbar > div > div:nth-child(8) > div.panel-body > div > div:nth-child(3) > div > label:nth-child(2)",
    "-recordDonations":`#my > div > div.container.avoid-navbar > div > div:nth-child(8) > div.panel-body > div > div:nth-child(4) > div > label:nth-child(2) > input[type="radio"]`,
    "recordDonations":`#my > div > div.container.avoid-navbar > div > div:nth-child(8) > div.panel-body > div > div:nth-child(4) > div > label:nth-child(1) > input[type="radio"]`,
    "-recordAdsBehaviour":`#my > div > div.container.avoid-navbar > div > div:nth-child(6) > div.panel-body > div > div:nth-child(6) > div > label:nth-child(2)`,
    "recordAdsBehaviour":`#my > div > div.container.avoid-navbar > div > div:nth-child(6) > div.panel-body > div > div:nth-child(6) > div > label:nth-child(1)`
};

module.exports = MyLoopSelectors;