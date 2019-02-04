'use strict';

let takeScreenshot = (() => {
    var _ref = _asyncToGenerator(function* ({ page, path, name = new Date().toISOString() }) {
        try {
            yield page.screenshot({ path: `${path}/${name}.png` });
        } catch (e) {
            //dir not found
            //Shouldn't give infinite loop: mkdirSync throws error if directory can't be created
            if (e.code === 'ENOENT') {
                fs.mkdirSync(path);
                yield takeScreenshot({ page, path, name });
            } else {
                console.log('setup_script.js -- screenshot failed ' + e.code + ': ' + e.message);
            }
        }
    });

    return function takeScreenshot(_x) {
        return _ref.apply(this, arguments);
    };
})();

/**Login to app. Should work for both SoGive and Good-loop 
 * Make sure that you are actually on a page with a clickable login button before running this!
 * @param selectors CSS selectors for the given page
 * @param url option param. Will go to the url before attempting to log in
 * @param service how are you loggin in? Can be email, Twitter or Facebook
*/


let login = (() => {
    var _ref2 = _asyncToGenerator(function* ({ browser, page, username, password, Selectors, service }) {
        if (!username || !password) throw new Error('UtilityFunctions -- no username/password provided to login');

        // support for older tests that did not have these params
        if (!Selectors) Selectors = CommonSelectors;
        if (!service) service = 'email';

        yield page.waitForSelector(Selectors['log-in']);
        yield page.click(Selectors['log-in']);

        if (service === 'email') {
            yield page.waitForSelector(Selectors['log-in-email']);
            yield page.waitForSelector(Selectors['log-in-password']);

            yield page.click(Selectors['log-in-email']);
            yield page.keyboard.type(username);
            yield page.click(Selectors['log-in-password']);
            yield page.keyboard.type(password);
            yield page.keyboard.press('Enter');

            yield page.waitForSelector(Selectors['log-in-email'], { hidden: true });
        }

        if (service === 'twitter') {
            yield page.waitForSelector(Selectors.twitterLogin);
            yield page.click(Selectors.twitterLogin);
            yield page.waitForSelector(Selectors.apiUsername);

            yield page.click(Selectors.apiUsername);
            yield page.keyboard.type(username);
            yield page.click(Selectors.apiPassword);
            yield page.keyboard.type(password);

            yield page.click(Selectors.apiLogin);
            // twitter, for some reason, wants you
            // to enter the exact same username & password
            // again, but on a different page
            yield page.waitForNavigation({ waitUntil: 'load' });
            yield page.waitFor(5000); // Give Twitter login a second to process
            // await page.click(TwitterSelectors.username);
            // await page.keyboard.type(twitterUsername);
            // await page.click(TwitterSelectors.password);
            // await page.keyboard.type(twitterPassword);
            // await page.click(TwitterSelectors.login);
        }

        if (service === 'facebook') {

            if (!browser) throw new Error('login function needs to be passed a browser object when logging in via Facebook');

            // return promise and await below
            // workaround for issue where Jest would reach end of test
            // and deem it a success without waiting for the browser.on
            // callback to finish executing
            let fbResolve;
            let fbLoginFinished = new Promise(function (resolve, reject) {
                fbResolve = resolve;
            });
            fbLoginFinished.resolve = fbResolve;

            browser.on('targetcreated', (() => {
                var _ref3 = _asyncToGenerator(function* (target) {
                    if (target._targetInfo.type !== 'page') return;
                    const fbPage = yield target.page();

                    yield fbPage.waitForSelector(Selectors.username);
                    yield fbPage.click(Selectors.username);
                    yield fbPage.keyboard.type(username);

                    yield fbPage.click(Selectors.password);
                    yield fbPage.keyboard.type(password);
                    yield fbPage.click(Selectors.login);

                    // only seems to appear once...
                    // await fbPage.waitForSelector(FacebookSelectors.continue);
                    // await fbPage.click(FacebookSelectors.continue);

                    fbLoginFinished.resolve();
                });

                return function (_x3) {
                    return _ref3.apply(this, arguments);
                };
            })());

            // trigger above code to handle
            // facebook login page
            // second click to handle popup being blocked
            yield page.click(Selectors.facebookLogin);
            yield page.click(Selectors.facebookLogin);

            // check that user is logged in, fail test if not
            yield fbLoginFinished;
        }
    });

    return function login(_x2) {
        return _ref2.apply(this, arguments);
    };
})();

/**
 * Takes an object in form {CSS_SELECTOR: value},
 * and fills in form accordingly
 */


let fillInForm = (() => {
    var _ref4 = _asyncToGenerator(function* ({ page, Selectors, data }) {
        const keys = Object.keys(data);
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            const selector = Selectors[key];

            //Clicks checkbox if value doesn't match boolean provided
            if ((yield page.$eval(selector, function (e) {
                return e.type;
            })) === 'checkbox') {
                //Would be nicer to have this as one if statement, but there is a bit of faff around passing arguments into page.$eval()
                const checkValue = yield page.$eval(selector, function (e) {
                    return e.checked;
                });
                if (checkValue != data[key]) yield page.click(selector);
            }
            // Select drop-down menu option
            else if ((yield page.$eval(selector, function (e) {
                    return e.tagName;
                })) === 'SELECT') {
                    yield page.select(selector, data[key]);
                } else {
                    yield page.click(selector);
                    //Check for default value. Clear field if found
                    if (yield page.$eval(selector, function (e) {
                        return e.value;
                    })) {
                        yield page.keyboard.down('Control');
                        yield page.keyboard.press('a');
                        yield page.keyboard.up('Control');
                        yield page.keyboard.press('Backspace');
                    }
                    yield page.keyboard.type(`${data[key]}`);
                }
        }
    });

    return function fillInForm(_x4) {
        return _ref4.apply(this, arguments);
    };
})();

/**Retrieves ID of event with given name
 * by querying JSON endpoint
 * @param eventOrFundOrVertiserOrVert seriously needs a new name. Thankfully, is only ever called internally.
 */


let IdByName = (() => {
    var _ref5 = _asyncToGenerator(function* ({ fundName, eventOrFundOrVertiserOrVert }) {
        // Make sure that we're comparing strings
        fundName = fundName + '';
        const r = yield $.ajax({
            url: `${APIBASE}${eventOrFundOrVertiserOrVert}/_list.json`,
            withCredentials: true,
            jwt: 'eyJraWQiOiJ1b2J4b3UxNjJjZWVkZTJlMSIsImFsZyI6IlJTMjU2In0.eyJpc3MiOiJzb2dpdmUiLCJqdGkiOiJTX0o1UE5rNHpGT0YtVGlrSVdJcDJBIiwiaWF0IjoxNTI3MjQ5NzkwLCJkdmNzaWciOm51bGwsInN1YiI6Im1hcmtAd2ludGVyd2VsbC5jb21AZW1haWwifQ.kmdCG5Xh2YypPLmtD_FP4Gc27cbpOd2Dx1LCOlBJNWqphBN-WQa7I6v-LmhwTbdheb8t7xE10xXtrsp9mObQ8QKsGU6Emdnyp9-eKrUTQFMf5HqwD-qpsiYEjw9SWTSaQkTOP4ieCbE61QL2-_3TN8hq4AAxYmjgJG0IUKUkN5jtozXCFYddqmpEXR4teRr7P470RDEAOqleddIJqd0KCId2ohGCe5CqMDFfcCLoaW-ICghQUAx9wlUDCmEN0I9BxErDp9WJ7spqji0MeanEurLlbAU47q5SyVQS70zAUJS3OhqFK_LHmFVETEQhb5nMpik3hSZJpS5x_YT56causg'
        });
        const hit = r.cargo.hits.filter(function (fundraiser) {
            return fundraiser.name === fundName;
        });
        if (hit && hit[0] && hit[0].id) return hit[0].id;
        return '';
    });

    return function IdByName(_x5) {
        return _ref5.apply(this, arguments);
    };
})();

let eventIdFromName = (() => {
    var _ref6 = _asyncToGenerator(function* ({ eventName }) {
        return yield IdByName({ fundName: eventName, eventOrFundOrVertiserOrVert: 'event' });
    });

    return function eventIdFromName(_x6) {
        return _ref6.apply(this, arguments);
    };
})();

let fundIdByName = (() => {
    var _ref7 = _asyncToGenerator(function* ({ fundName }) {
        return yield IdByName({ fundName, eventOrFundOrVertiserOrVert: 'fundraiser' });
    });

    return function fundIdByName(_x7) {
        return _ref7.apply(this, arguments);
    };
})();

let vertiserIdByName = (() => {
    var _ref8 = _asyncToGenerator(function* ({ vertiserName }) {
        return yield IdByName({ fundName: vertiserName, eventOrFundOrVertiserOrVert: 'vertiser' });
    });

    return function vertiserIdByName(_x8) {
        return _ref8.apply(this, arguments);
    };
})();

let vertIdByName = (() => {
    var _ref9 = _asyncToGenerator(function* ({ vertName }) {
        return yield IdByName({ fundName: vertName, eventOrFundOrVertiserOrVert: 'vert' });
    });

    return function vertIdByName(_x9) {
        return _ref9.apply(this, arguments);
    };
})();

/** Depends on current setup where ServerIO is placed in to the window */
let isPointingAtProduction = (() => {
    var _ref10 = _asyncToGenerator(function* ({ page }) {
        const endpoint = yield page.evaluate(function () {
            return window.ServerIO.DATALOG_ENDPOINT;
        });
        return endpoint.match(/\/\/lg.good-loop.com/);
    });

    return function isPointingAtProduction(_x10) {
        return _ref10.apply(this, arguments);
    };
})();

let soGiveFailIfPointingAtProduction = (() => {
    var _ref11 = _asyncToGenerator(function* ({ page }) {
        const endpoint = yield page.evaluate(function () {
            return window.ServerIO.APIBASE;
        });
        if (endpoint.match(/\/\/app.sogive.org/) || window.location.href.match(/\/\/app.sogive.org/)) throw new Error("Test service is pointing at production server! Aborting test.");
    });

    return function soGiveFailIfPointingAtProduction(_x11) {
        return _ref11.apply(this, arguments);
    };
})();

// Goes to the given URL (which must contain a Good-loop ad), watches the video, and makes a donation 
/**
 * Advert must already be somewhere on the page before this method is called
 * @param { object } page puppeteer test object
 * @param { string } type behaviour needs to be slightly different for type:banner ads
 * @param { string } url location where good-loop adunit is hosted
 */
let watchAdvertAndDonate = (() => {
    var _ref12 = _asyncToGenerator(function* ({ page, type }) {
        yield page.waitFor(1000); //Allow 'visible' event to register. Doesn't get counted if you start working right away
        let pageOrIFrame = page; // If unit is wrapped in iframe, need to use iframe.ACTION instead of page.ACTION

        // Adunit may have been loaded in to an iframe.
        // Puppeteer will not cycle through frames to look for a given selector, so need to tell it where to look
        // TODO cut down on possible values after this has been harmonised across the different pages/services
        const iframe = yield page.frames().find(function (f) {
            return f.name().slice(0, 2) === 'gl' || f.name() === 'test01' || f.name() === 'demo-iframe';
        });

        if (iframe) {
            pageOrIFrame = iframe;
        }

        // Banner-types
        // Ad on Vpaid page should just autoplay
        if (type === 'banner') {
            yield pageOrIFrame.waitForSelector(AdServerSelectors.TestAs.Banner);
            yield pageOrIFrame.click(AdServerSelectors.TestAs.Banner);
        }
        try {
            // Click-to-play video
            yield pageOrIFrame.waitForSelector(AdServerSelectors.TestAs.ClickToPlay, { timeout: 3000 });
            yield pageOrIFrame.click(AdServerSelectors.TestAs.ClickToPlay);
        } catch (e) {
            console.log("Non click-to-play video. Continuing...");
        }
        // Pick a charity
        yield pageOrIFrame.waitForSelector(AdServerSelectors.TestAs.FirstCharityIcon);
        yield pageOrIFrame.click(AdServerSelectors.TestAs.FirstCharityIcon);

        yield page.waitFor(5000); //Generally needs a second to register that donation has been made
    });

    return function watchAdvertAndDonate(_x12) {
        return _ref12.apply(this, arguments);
    };
})();

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const fs = require('fs');
const $ = require('jquery');
const { CommonSelectors, AdServerSelectors } = require('../utils/SelectorsMaster');

/**Used to disable all page animations
 * Found that these were making tests less reliable
 * Insert into page via page.addScriptTag(disableAnimations);
 */
const disableAnimations = {
    content: `function disableAnimations() {
            var jQuery = window.jQuery;
            if ( jQuery ) {
                jQuery.fx.off = true;
            }

            var css = document.createElement( "style" );
            css.type = "text/css";
            css.innerHTML = "* { -webkit-transition: none !important; transition: none !important; -webkit-animation: none !important; animation: none !important; }";
            document.body.appendChild( css );
        }

        if ( document.readyState !== "loading" ) {
            disableAnimations();
        } else {
            window.addEventListener( 'load', disableAnimations, false );
        }`
};

// set when calling Jest CLI with --testURL $url
const APIBASE = window.location;

;

;

;;

;

module.exports = {
    APIBASE,
    disableAnimations,
    eventIdFromName,
    fillInForm,
    fundIdByName,
    isPointingAtProduction,
    login,
    soGiveFailIfPointingAtProduction,
    takeScreenshot,
    vertIdByName,
    vertiserIdByName,
    watchAdvertAndDonate
};
