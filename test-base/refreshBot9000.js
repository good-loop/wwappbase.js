/**
 * Adserver variant on the blink?
 * Need to see it in a live environment?
 * Then you need the refreshBot9000!
 * Simply give it a URL, and the refreshBot9000 will reload the page until any requests to good-loop appear in the network tab
 * It really is that simple!!!!!!
 * 
 * Easiest way to run: 
 * 1) Open terminal
 * 2) Enter "babel-node refreshBot9000 --url <URL_TO_TEST> --refresh <NUMBER_OF_TIMES_TO_REFRESH>"
 * 
 * Things to watch out for:
 * 1) Assumed that images/other bits are not cached between sessions
 *    If this is not the case, no files containg "good-loop" will be downloaded
 */
const puppeteer = require('puppeteer');
//Issue if Chromium browser refreshing causes Linux to focus on window. Annoying.
//Was thinking that we could potentially take advantage of websockets for this:
//have it refresh until it finds the tag, save browser instance to a temp directory,
//then finally create a new headed browser instance from the stored object

//Will only work if this process preserves the browser's state exactly as is.
//If the pages reload on opening, will obviously lose the instance found.

//Unfortunately necessary as am apparently not allowed to have an assignment with await outside of an async function
//Very annoying. Must be a better explanation for the error I'm seeing (await is a reserved keyword)
// async function init() {
//     if(!browser) {
//         browser = await puppeteer.launch({headless: false});
//         page = await browser.newPage();
//         // console.log(page);        
//         await page.goto('https://www.independent.co.uk/');
//     }
// }

// turn array into neater object
// key = [n], value = [n+1]
const args = process.argv.reduce((obj, v, i) => {
    if(i % 2 === 0) {
        // filter out "--" from console arg
        obj[(v.match(/^--([^-]*)/) && v.match(/^--([^-]*)/)[1]) || v] = process.argv[i+1];
    }
    return obj;
}, {});

const {url} = args;
const REFRESH_LIMIT = +args.refresh || 20; // number of times to refresh before giving up
const reloadTime = 5000; // how long to wait before reloading page again

let refreshCounter = 0;
let goodLoopAdFound = false;

async function refreshOMatic() {
    if(!url) throw new Error("DOES NOT COMPUTE: provide a --url to test");
    const browser = await puppeteer.launch({headless: false});
    const page = await browser.newPage();

    // very important: cannot search through network requests for good-loop img otherwise
    await page.setCacheEnabled(false); 
    await page.setRequestInterception(true);
    // listen for good-loop image being downloaded
    page.on('request', r => {
        // console.warn(r.url());
        if(r.url().includes("good-loop")) {
            goodLoopAdFound = true;
        }
        r.continue();            
    });
    await page.goto(url);

    const result = await refreshPage({page, browser});
    // browser.close();
    return result;
}

async function refreshPage({page, browser}) {
    if(goodLoopAdFound) {
        //Page found, do stuff
        console.log("Found it!")
        return true;
    }
    else if(refreshCounter === REFRESH_LIMIT) {
        console.log(`Refreshed maxium of ${REFRESH_LIMIT} times. Adunit not found`);
        return false;
    }

    await page.reload();
    await page.waitFor(reloadTime);//Give stuff a second to load. Also prevents this from inadvertently becoming a weedy DOS attack
    refreshCounter++;
    console.log("Times refreshed: "+refreshCounter);
    return await refreshPage({page, browser});
}

/**
 * Originally planned to have it refresh as headless
 * then switch to headed upon finding adunit.
 * Not sure if I still want to do that 
 */
async function switchToHeadedBrowser(browser) {
    const headedInstance = await puppeteer.connect({
         options: {headless: false},
         browserWSEndpoint: browser.WSEndpoint()
     });
     await browser.close();
     browser = headedInstance;
}

refreshOMatic();
