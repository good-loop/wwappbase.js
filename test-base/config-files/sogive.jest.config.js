const path = require('path');
const baseConfig, {generateEndpointURL} = require('./base.config');

module.exports = Object.assign(
    baseConfig, 
    {
        testURL: "https://test.sogive.com",
        rootDir: path.resolve(__dirname, '../'),
        testRegex: "(/__sogive_tests__/.*|(\\.|/)(test|spec))\\.[jt]sx?$"
    }
);
