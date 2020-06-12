const path = require('path');
const baseConfig = require('./base.config');
const {generateEndpointURL} = require('./configUtils');

module.exports = Object.assign(
    baseConfig, 
    {
        testURL: generateEndpointURL('demo.good-loop.com'),
        rootDir: path.resolve(__dirname, '../'),
        testRegex: "(/__demo_page_tests__/.*|(\\.|/)(test|spec))\\.[jt]sx?$"
    }
);
