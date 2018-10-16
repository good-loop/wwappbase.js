const MyLoopSelectors = {
    sign_up:"#my > div > div.container.avoid-navbar > div > div:nth-child(1) > div > div > div > a",
    logged_in_greeting:"#my > div > div.container.avoid-navbar > div > div:nth-child(1) > div > div > div > div.pull-right.logged-in",
    "personaliseAds":`#my > div > div.container.avoid-navbar > div > div:nth-child(8) > div.panel-body > div > div:nth-child(3) > div > label:nth-child(1)`,
    "-personaliseAds":"#my > div > div.container.avoid-navbar > div > div:nth-child(8) > div.panel-body > div > div:nth-child(3) > div > label:nth-child(2)",
    "-recordDonations":`#my > div > div.container.avoid-navbar > div > div:nth-child(8) > div.panel-body > div > div:nth-child(4) > div > label:nth-child(2) > input[type="radio"]`,
    "recordDonations":`#my > div > div.container.avoid-navbar > div > div:nth-child(8) > div.panel-body > div > div:nth-child(4) > div > label:nth-child(1) > input[type="radio"]`,
    "-recordAdsBehaviour":`#my > div > div.container.avoid-navbar > div > div:nth-child(8) > div.panel-body > div > div:nth-child(5) > div > label:nth-child(2) > input[type="radio"]`,
    "recordAdsBehaviour":`#my > div > div.container.avoid-navbar > div > div:nth-child(8) > div.panel-body > div > div:nth-child(5) > div > label:nth-child(1) > input[type="radio"]`
};

module.exports = MyLoopSelectors;