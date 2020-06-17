# runtest.js and jest-puppeteer.config.js
In this directory, you will find two pretty basic JS files which instruct jest how to run and what configs to use.

Copy runtest.js and jest-puppeteer.config.js into the root of your project, and then create src/puppeteer-tests/\_\_tests\_\_/

Place your tests inside of src/puppeteer-tests/\_\_tests\_\_  and then return to the root of your project.

Ensure that your package.json contains relevant entries (probably more up to date ones) similar to 
the jest/puppeteer entries found in ~/winterwell/wwappbase.js/test-base/package.json

Then ensure that you have all needed packages by running npm i

Simply use
node runtest.js
in order to run all tests found in your src/puppeteer-tests/\_\_tests\_\_ directory.