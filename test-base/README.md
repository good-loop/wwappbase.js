
## Setting up tests

In a project:

	cp ../wwappbase.js/template/runtest.js .
	cp ../wwappbase.js/template/jest-puppeteer.config.js .
	mkdir src/puppeteer-tests/
	mkdir src/puppeteer-tests/__tests__

NB: these directories are the jest+puppeteer defaults

	cd src/puppeteer-tests/
	ln -s ../../../logins/test/Credentials.js
	ln -s ../../../wwappbase.js/test-base


Place your tests inside of src/puppeteer-tests/\_\_tests\_\_  and then return to the root of your project.

Ensure that your package.json contains relevant entries (probably more up to date ones) similar to 
the jest/puppeteer entries found in ~/winterwell/wwappbase.js/test-base/package.json

Then ensure that you have all needed packages by running npm i

## Runing tests

Simply use

	node runtest.js

Or to run against test:

	node runtest.js --site test

in order to run all tests found in your src/puppeteer-tests/\_\_tests\_\_ directory

To run a specific test, use

	node runtest.js --test _keyword_

For jest options, see https://jestjs.io/docs/en/cli.html

