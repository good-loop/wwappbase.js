const path = require('path');
const baseConfig = require('./base.config');
const {generateEndpointURL} = require('./configUtils');

module.exports = Object.assign(
    baseConfig, 
    {
        testURL: generateEndpointURL('my.good-loop.com'),        
        rootDir: path.resolve(__dirname, '../'),
        testRegex: "(/__myloop_tests__/.*|(\\.|/)(test|spec))\\.[jt]sx?$"
    }
);
