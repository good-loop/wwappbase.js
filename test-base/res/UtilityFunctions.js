const fs = require('fs');
const $ = require('jquery');
const {CommonSelectors} = require('../utils/SelectorsMaster');

/**Used to disable all page animations
 * Found that these were making tests less reliable
 * Insert into page via page.addScriptTag(disableAnimations);
 */
const disableAnimations = {
    content:
        `function disableAnimations() {
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

/**Might actually be a good idea to add CSS selectors for certain elements in here
 * Many parts of page are generated from common source: will be identified by common CSS selector
 * Could end up being more flexible having these defined in here, so that changes in source code
 * are easy to mirror in test setup. Would have to go spelunking through a raft of files otherwise.
 */

/**Currently want to take screenshot and take a note of any errors */
//Any circumstance under which call to process.arg[1] would return something bad?
//Probably will discontinue use of this function. Lot of functionality needed on success as well as failure.
async function onFail({error, page}) {
    console.log(`Utility functions onFail is deprecated. So is test-manager for that matter.`);
    //await takeScreenshot(page);
}

async function takeScreenshot({page, path, date = new Date().toISOString()}) {
    try {
        await page.screenshot({path: `${path}/${date}.png`});
    }
    catch(e) {
        //dir not found
        //Shouldn't give infinite loop: mkdirSync throws error if directory can't be created
        if (e.code === 'ENOENT') {
            fs.mkdirSync(path);
            await takeScreenshot(page);
        }
        else{
            console.log('setup_script.js -- screenshot failed ' + e.code + ': ' + e.message);
        }
    }
}

/**Deprecated. Use page.waitFor(ms) instead*/
function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**Login to app. Should work for both SoGive and Good-loop 
 * Make sure that you are actually on a page with a clickable login button before running this!
*/
async function login({page, username, password}) {
    if(!username || !password) throw new Error('UtilityFunctions -- no username/password provided to login');

    await page.addScriptTag(disableAnimations);
    await page.waitForSelector(CommonSelectors['log-in']);
    await page.click(CommonSelectors['log-in']);
    await page.waitForSelector(CommonSelectors['log-in-email']);
    await page.waitForSelector(CommonSelectors['log-in-password']);

    await page.click(CommonSelectors['log-in-email']);
    await page.keyboard.type(username);  
    await page.click(CommonSelectors['log-in-password']);
    await page.keyboard.type(password); 
    await page.keyboard.press('Enter');
    
    await page.waitForSelector(CommonSelectors['log-in-email'], {hidden: true});
}

/**
 * Takes an object in form {CSS_SELECTOR: value},
 * and fills in form accordingly
 */
async function fillInForm({page, Selectors, data}) {
    const keys = Object.keys(data);
    for(let i=0; i<keys.length; i++){
        const key = keys[i];
        const selector = Selectors[key];
        //Only clicks checkbox if value doesn't match boolean provided. Would be easier to directly manipulate the DOM state,
        //but that doesn't seems to defeat the purpose of end-to-end testing
        if(await page.$eval(selector, e => e.type) === 'checkbox') {
                //Would be nicer to have this as one if statement, but there is a bit of faff around passing arguments into page.$eval()
                const checkValue = await page.$eval(selector, e => e.checked);
                if(checkValue != data[key]) await page.click(selector)
            }
        else {
            await page.click(selector);
            //Check for default value. Clear field if found
            if(await page.$eval(selector, e => e.value)){
                await page.keyboard.down('Control');
                await page.keyboard.press('a');
                await page.keyboard.up('Control');
                await page.keyboard.press('Backspace');
            } 
            await page.keyboard.type(`${data[key]}`);
        }
    }
}

/**Retrieves ID of event with given name
 * by querying JSON endpoint
 * @param eventOrFundOrVertiserOrVert seriously needs a new name. Thankfully, is only ever called internally.
 */
async function IdByName({page, fundName, eventOrFundOrVertiserOrVert}) {
    const r = await $.ajax({
        url: `${APIBASE}${eventOrFundOrVertiserOrVert}/_list.json`,
        withCredentials: true,
        jwt: 'eyJraWQiOiJ1b2J4b3UxNjJjZWVkZTJlMSIsImFsZyI6IlJTMjU2In0.eyJpc3MiOiJzb2dpdmUiLCJqdGkiOiJTX0o1UE5rNHpGT0YtVGlrSVdJcDJBIiwiaWF0IjoxNTI3MjQ5NzkwLCJkdmNzaWciOm51bGwsInN1YiI6Im1hcmtAd2ludGVyd2VsbC5jb21AZW1haWwifQ.kmdCG5Xh2YypPLmtD_FP4Gc27cbpOd2Dx1LCOlBJNWqphBN-WQa7I6v-LmhwTbdheb8t7xE10xXtrsp9mObQ8QKsGU6Emdnyp9-eKrUTQFMf5HqwD-qpsiYEjw9SWTSaQkTOP4ieCbE61QL2-_3TN8hq4AAxYmjgJG0IUKUkN5jtozXCFYddqmpEXR4teRr7P470RDEAOqleddIJqd0KCId2ohGCe5CqMDFfcCLoaW-ICghQUAx9wlUDCmEN0I9BxErDp9WJ7spqji0MeanEurLlbAU47q5SyVQS70zAUJS3OhqFK_LHmFVETEQhb5nMpik3hSZJpS5x_YT56causg',
    });
    const hit = r.cargo.hits.filter(fundraiser => fundraiser.name === fundName);
    if(hit && hit[0] && hit[0].id) return hit[0].id;
    return '';
}

async function eventIdFromName({page, eventName}) {
    return await IdByName({page, fundName: eventName, eventOrFundOrVertiserOrVert:'event'});
}

async function fundIdByName({page, fundName}) {
    return await IdByName({page, fundName, eventOrFundOrVertiserOrVert:'fundraiser'});
};

async function vertiserIdByName({vertiserName}) {
    return await IdByName({fundName: vertiserName, eventOrFundOrVertiserOrVert:'vertiser'});
};

async function vertIdByName({vertName}) {
    return await IdByName({fundName: vertName, eventOrFundOrVertiserOrVert:'vert'}); 
};

/** Depends on current setup where ServerIO is placed in to the window */
async function isPointingAtProduction({page}) {
    const endpoint = await page.evaluate( () => window.ServerIO.DATALOG_ENDPOINT);
    return endpoint.match(/\/\/lg.good-loop.com/);
};

async function soGiveFailIfPointingAtProduction({page}) {
    const endpoint = await page.evaluate( () => window.ServerIO.APIBASE);
    if( endpoint.match(/\/\/app.sogive.org/) || window.location.href.match(/\/\/app.sogive.org/) ) throw new Error("Test service is pointing at production server! Aborting test.");
};

module.exports = {
    APIBASE,
    disableAnimations,
    eventIdFromName,
    fillInForm,
    fundIdByName,
    isPointingAtProduction,
    login,
    onFail, 
    soGiveFailIfPointingAtProduction,
    takeScreenshot,
    timeout,
    vertIdByName,
    vertiserIdByName
};
