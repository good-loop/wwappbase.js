/**
 * Easiest way to run: 
 * 1) Open terminal
 * 2) Enter "babel-node refreshBot9000"
 * 
 * Adserver variant on the blink?
 * Need to see it in a live environment?
 * Then you need the refreshBot9000!
 * Simply give it a URL, and the refreshBot9000 will reload the page until any requests to good-loop appear in the network tab
 * It really is that simple!!!!!!
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

const reloadTime = 5000;
const pageToRefresh = 'http://test.good-loop.com/dfp-rectangle/';
let goodLoopAdFound = false;

async function refreshOMatic() {
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

    await page.goto(pageToRefresh); 
    await refreshPage({page, browser});
}

async function refreshPage({page, browser}) {
    await page.waitFor(reloadTime);//Give stuff a second to load. Also prevents this from inadvertently becoming a weedy DDOS attack    
    await page.reload();
    console.log('result: ' + goodLoopAdFound);

    // if (await page.$('.goodloopad') !== null || goodLoopAdFound) {
    if(goodLoopAdFound) {
        //Page found, do stuff
        console.log("Found it!")
        // switchToHeadedBrowser(browser);
    }
    else{
        refreshPage({page, browser});
    }
}

async function switchToHeadedBrowser(browser) {
    const headedInstance = await puppeteer.connect({
         options: {headless: false},
         browserWSEndpoint: browser.WSEndpoint()
     });
     await browser.close();
     browser = headedInstance;
}

refreshOMatic();
