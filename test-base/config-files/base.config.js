const path = require('path');

module.exports = {
  "reporters": [
    "default",
    path.resolve(__dirname, '../res/custom-reporter.js')
  ],
  setupFilesAfterEnv:[path.resolve(__dirname, '../res/setup_script.js'),"react-testing-library/cleanup-after-each"],
  verbose: true
};
