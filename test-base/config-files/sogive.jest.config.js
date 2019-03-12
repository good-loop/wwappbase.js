const path = require('path');
const baseConfig = require('./base.config');
const {generateEndpointURL} = require('./configUtils');

module.exports = Object.assign(
    baseConfig, 
    {
        testURL: generateEndpointURL('.sogive.org'),
        rootDir: path.resolve(__dirname, '../'),
        testRegex: "(/__sogive_tests__/.*|(\\.|/)(test|spec))\\.[jt]sx?$"
    }
);
