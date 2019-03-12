const path = require('path');
const baseConfig, {generateEndpointURL} = require('./base.config');

module.exports = Object.assign(
    baseConfig, 
    {
        "testURL": "http://testportal.good-loop.com",
        rootDir: path.resolve(__dirname, '../'),
        testRegex: "(/__myloop_tests__/.*|(\\.|/)(test|spec))\\.[jt]sx?$"
    }
);
