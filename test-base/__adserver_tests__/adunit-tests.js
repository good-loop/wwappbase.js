const puppeteer = require('puppeteer');
const $ = require('jquery');
const urlFN = require('url');
const {AdServerSelectors} = require('../utils/SelectorsMaster');
const {APIBASE, watchAdvertAndDonate} = require('../res/UtilityFunctions');

//Note: Chromium is unable to play mp4 encoded videos. Need to make sure that advert being used is set to use a .webm video.
let adID; //ID for advert I set up for puppeteer to use. Obviously use different ids for local/test
let vpaidAdID;
let ADBASE;
let LandingPageURL;
let datalogParams = {
    jwt:'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJzZXJ2ZXIiOiJiZXN0ZXIiLCJzdWIiOiJtYXJrQHdpbnRlcndlbGwuY29tQGVtYWlsIiwiaXNzIjoiZ29vZC1sb29wIiwiaWF0IjoxNTMwMjg2MDQ5LCJqdGkiOiJ2dWd2Y28xNjQ0YzI4MDg2ZiJ9.cbe1ZbxPHIuyveWnr5LE-Vn1N9JUgn8d0hC5WQcbSoaMMf-Ua98mWvuwwNKrtGvenMxv-b_hAHObYSwWhleMMOV-MtdKYy0lyIn1o8AhIQmgiFNtmtKkuTxk2E8HNip_N19JK7vHXMzRX8h-j8HKD08UdQy_0b4kYl1OD_W1MQK72ToYIDEvVbu9RrTYPm_esbAsEsETYfcBdpCoIkjFdSs-hOsDnTSVMZ6WktFSGWMrstG368DdiyVaWb6WosLOJJcgaF02KMuJ_6yLhmlgBW6M4xS2AwGksH9D2Brwhfg5EWfIQeinypcK-V43hSW9zGJNGbbB42o0ZNxNDnuwww',
    // name:'all-events',
    'breakdown[]':'evt',
    dataspace:'gl',
    app:'good-loop',
};
// You can check these manually here:
// https://testlg.good-loop.com/data?q=vert%3AURFFCVRT&breakdown%5B%5D=evt&dataspace=gl&app=good-loop

const statsToCheck = [//Check that the given keys have been incremented by one after watching ad.
    // 'click',
    'autoplay',
    'autoplayfail',
    'startVideo',
    'elapse',

    'render', //Turned off due to issues with render2 vs render
    'req',
    'open',
    'endvideo',
    'minview',
    'consent-requested',
    'donation',
    'pick',
    'visible'
];
// local/test/production
// have adverts set up to use in local & test
setEndpointAndAd();

// ADBASE and adID will be undefined until setEndpointAndAd has been called
const variants = [
    {
        variant: 'landingPage',
        url: `${LandingPageURL}?gl.vert=${adID}`
    },
    {
        variant: 'billboard',
        url: `${ADBASE}/billboard?gl.vert=${adID}`,
        type: 'banner'
    },
    {
        variant: 'vertical',
        url: `${ADBASE}/old/vertical?gl.vert=${adID}`,
        type: 'banner'
    },
    {
        variant: 'leaderboard',
        url: `${ADBASE}/leaderboard?gl.vert=${adID}`,
        type: 'banner'
    },
    {
        variant: 'footer',
        url: `${ADBASE}/footer?gl.vert=${adID}`,
        type: 'banner'
    },
    {
        variant: 'rectangle',
        url: `${ADBASE}/old/rectangle?gl.vert=${adID}`,
        type: 'banner'
    },
    {
        variant: 'vpaid',
        url: `${ADBASE}/vpaid?gl.vert=${adID}`
    },
    {
        variant: 'vpaid-google',
        url: `${ADBASE}/old/vpaid-google`
    },
    {
        variant: 'snap',
        url: `${ADBASE}/old/snap?gl.vert=${adID}`
    },
    {
        variant: 'pre-roll',
        url: `${ADBASE}/old/pre-roll?gl.vert=${adID}`
    },
    {
        variant: 'mpu2',
        url: `${ADBASE}/mpu2?gl.vert=${adID}`
    },
    {
        variant: 'in-read',
        url: `${ADBASE}/old/in-read?gl.vert=${adID}`
    },
    {
        variant: 'landscape',
        url: `${ADBASE}/landscape?gl.vert=${adID}`
    },
    {
        variant: 'mpu',
        url: `${ADBASE}/mpu?gl.vert=${adID}`
    },
    {
        variant: 'portrait',
        url: `${ADBASE}/portrait?gl.vert=${adID}`
    },
    {
        variant: 'single',
        url: `${ADBASE}/single?gl.vert=${adID}`
    },
    {
        variant: 'square',
        url: `${ADBASE}/square?gl.vert=${adID}`
    },
    {
        variant: 'tq-mpu2',
        url: `${ADBASE}/tq-mpu2?gl.vert=${adID}`
    },
    {
        variant: 'vbnr',
        url: `${ADBASE}/vbnr?gl.vert=${adID}`
    },
];

console.warn('Adunit tests will generally take ~300 seconds to complete');

variants.forEach( ({type, url, variant}) => {
    test(`Watch ${variant} video, and check that datalogger has been correctly updated`, async () => {
        const browser = await window.__BROWSER__;
        const page = await browser.newPage();

        const beforeAdData = await retrieveAdData({adId:adID});
        await page.goto(url);
        await watchAdvertAndDonate({page, type});
        await page.waitFor(3000);    

        const afterAdData = await retrieveAdData({adId:adID});
        check(beforeAdData, afterAdData, variant);
    }, 45000);
});

test(`Check that pagewrapper is working`, async () => {
    const browser = await window.__BROWSER__;
    const page = await browser.newPage();

    await page.goto(`${LandingPageURL}/pagewrapper.html?gl.vert=${adID}`);
    
    await page.waitForSelector(AdServerSelectors.TestAs.FirstCharityIcon);
    await page.click(AdServerSelectors.TestAs.FirstCharityIcon);
    
    // Check that each of the social media buttons redirects to appropriate page
    // Whether or not anything after that works is for the social media service to test
    await page.click(AdServerSelectors.TestAs.TwitterLink);
    await testSocialMediaButton({browser, expectedURL: "twitter.com"});

    await page.click(AdServerSelectors.TestAs.LinkedInLink);
    await testSocialMediaButton({browser, expectedURL: "linkedin.com"});

    await page.click(AdServerSelectors.TestAs.FacebookLink);
    await testSocialMediaButton({browser, expectedURL: "facebook.com"});
}, 30000);

test(`Check that custom events are working`, async () => {
    const browser = await window.__BROWSER__;
    const page = await browser.newPage();

    // Checking that calling link onEvent and GoodLoop macro replacement is working
    // Set to register an event with key set by macro replacement
    const beforeAdData = await retrieveAdData({ adId: adID});

    await page.goto(`${LandingPageURL}?gl.vert=${adID}`);

    // This will be the key for the event generated by macro link
    const hostName = await page.evaluate( () => window.location.hostname );

    await watchAdvertAndDonate({page});

    // Advert in portal is set-up to insert elements in to DOM
    // for each custom event available. Check here that this has happened
    if( ! (await page.$('#onEndVideo')) ) {
        throw new Error('Element has not been created for #onEndVideo');
    }

    await page.waitFor(3000);

    const afterAdData = await retrieveAdData({ adId: adID} );

    expect(afterAdData[hostName]).toEqual(++beforeAdData[hostName]);
}, 30000);

// TODO: Add test to check that skip button is working?

function setEndpointAndAd() {
    /**HACK: this will point to local/test/production portal
     * need to modify to point at adserver test page
     * Necessary as adserver and portal share the same __tests__ folder and jest.sh
     * separating these may be the long-term fix for this
    */
    // force convert to string
    if (('' + APIBASE).includes('localportal')) {
        ADBASE = 'http://local.good-loop.com';
        LandingPageURL = 'http://localas.good-loop.com';
        adID = 's0IiStuo';
        vpaidAdID = 'YIeWNl0m';
        datalogParams.urlBase = 'http://locallg.good-loop.com';
    }
    else if (('' + APIBASE).includes('testportal')) {
        ADBASE = 'https://test.good-loop.com';
        LandingPageURL = 'https://testas.good-loop.com';
        adID = 'URFFCVRT';    
        vpaidAdID = 'hZgjUaHX'; // video served via VAST tag
        datalogParams.urlBase = 'https://testlg.good-loop.com';
    }
    else {
        throw new Error('adserver-tests can not be run against production -- aborting');
        // ADBASE = 'https://as.good-loop.com';
        // LandingPageURL = 'https://as.good-loop.com';
        // adID = 'W830wIsC';    
        // vpaidAdID = 'hZgjUaHX'; // video served via VAST tag
        // datalogParams.urlBase = 'https://lg.good-loop.com';
    } 
}

async function retrieveAdData({adId}) {
    const r = await $.ajax({
        url: `${datalogParams.urlBase}/data?q=vert%3A${adId}&breakdown%5B%5D=${datalogParams['breakdown[]']}&dataspace=${datalogParams.dataspace}&app=${datalogParams.app}&jwt=${datalogParams.jwt}&withCredentials=true`,
    });
    return r.cargo && r.cargo.by_evt && r.cargo.by_evt.buckets ? formatAdData({adData: r.cargo.by_evt.buckets}) : null;
}

/**Relevant data will initially be returned as an array of objects with form: [{"doc_count":4,"key":"close"}]
 * Want to transform this to {{"close":4}}
*/
function formatAdData({adData}) {
    return adData.reduce((obj, e) => {
        obj[e.key] = e.doc_count;
        return obj;
    }, {});
}

function check(beforeAdData, afterAdData, variant) {
    //Check that datalogger stats have been incremented
    statsToCheck.forEach(stat => {
        try {
            expect(afterAdData[stat]).toEqual(++beforeAdData[stat]);//Test will fail if this condition is not met
        } catch (e) {
            console.log(stat + ' count failed to update for ' + variant);
            throw new Error(e);
        }
    });
}

/** Written for the pagewrapper test. Want to make sure that the social media buttons actually redirect where they're supposed to */
async function testSocialMediaButton({browser, expectedURL}) {
    let pageResolve;
    let redirectFinished = new Promise(function(resolve, reject) { pageResolve = resolve; });
    redirectFinished.resolve = pageResolve;

    const listener = async (target) => {
        if(target._targetInfo.type !== 'page') return;
        const targetPage = await target.page();
        const targetURL = urlFN.parse(targetPage.url()).host;
        expect( targetURL.match(expectedURL) );

        browser.removeListener('targetcreated', listener);
        targetPage.close();
        redirectFinished.resolve();
    };

    browser.on('targetcreated', listener);

    await redirectFinished;
}