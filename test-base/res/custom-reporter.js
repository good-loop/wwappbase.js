const fs = require('fs');

class CustomReporter {
    constructor(globalConfig, options) {
      this._globalConfig = globalConfig;
      this._options = options;
    }
    
  //Seems to run after test suite is completed rather than
  //after each individual test
  onTestResult(test, testResult, aggregatedTestResult) {
      //Error message seems to be in testResult.failureMessage
      //Not sure this is a suitable place to screenshot
      //Would have to pass browser object in.
      //Could always take the screenshot during test.
      //Bit more faff for tester to set-up though
      //Also know 100% that code in here will be called regardless of success/failure
      //Still need to somehow access browser object from in here for this to work

      //testResult contains results for entire test suite.
      //Failure message can be got from testResult.testResults -> {failureMessages}
      //fullName and title are found in the same place.
      testResult.testResults
      .forEach(runData => {
          //Only log if there are error messages to report
          if(runData.failureMessages.length !== 0) {
            const contents = 
                `Test name: ${runData.fullName}\nTime taken: ${runData.duration}\nFailure Messages:       
                ${
                    runData.failureMessages
                    .map(message => message + '\n')
                }`;
            this.writeToLog({
                testName: runData.fullName,
                contents,
                path: `test-results/Logs(failure)`
            });
          }
      });
  }

  onRunComplete(contexts, results) {
      // console.log(contexts);
      // console.log(results);
      // console.log(this._globalConfig.testFailureExitCode);
  }

  writeToLog({contents, path, testName}) {
    const date = new Date().toISOString();
    if(!fs.existsSync(path)) {
        fs.mkdirSync(path);
    }
    fs.appendFileSync(`${path}/${testName}:${date}.txt`.replace(/\s/g, "."), contents);  
    }
}
  
module.exports = CustomReporter;
