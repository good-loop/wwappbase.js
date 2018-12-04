Puppeteer can use CSS selectors to interact with elements in the DOM. As there is a large number of elements that need to be accessed in multiple test files, I thought it best to store all of the selectors in a common repository. This has proved useful in maintaining the test files as selectors often change when the UI for any given service is updated.

In this folder, you will find all of the CSS selectors used to test the entire GoodLoop/SoGive suite.

HOW DO I USE THESE IN MY TEST?

Import SelectorsMaster in to your test file. SelectorsMaster is a JavaScript object. The selectors contained within are namespaced by service (e.g myloop, portal, sogive). If you were creating a new SoGive test, your import statement would look something like:

const {SoGiveSelectors, CommonSelectors} = require('../test-base/utils/SelectorsMaster');

Note that any selectors which are the same across all platforms, such as those for the LoginWidget, are stored under "CommonSelectors". 

HOW DO I EDIT OR ADD SELECTORS?

If your selector is the same across all platforms, put it in SelectorsMaster -> CommonSelectors.

If your selector is platform specific, add it to the platform-specific file that feels most appropriate. 
