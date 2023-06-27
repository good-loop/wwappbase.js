export const loginEmail = process.env.PLAYWRIGHT_LOGIN_EMAIL;
export const loginPassword = process.env.PLAYWRIGHT_LOGIN_PASSWORD;

export const checkForErrors = async (page, baseUrl) => {
    // Check for a "there was an error" message in the body.
    const bodyText = await page.evaluate(() => document.querySelector('body').innerText.toLowerCase());
    if (bodyText.includes('there was an error')) {
        throw new Error('Error text found in the page');
    }

    // Check for any 4xx or 5xx error codes - but only for `baseUrl` - not any external requests
    // Skip if not `baseUrl` is provided
    page.on('response', response => {
        const status = response.status();
        if (response.url().startsWith(baseUrl) && status >= 400 && baseUrl) {
            console.log(response.url());
            throw new Error(`Received bad response with status code ${status} from ${response.url()}`);
        }
    });
};