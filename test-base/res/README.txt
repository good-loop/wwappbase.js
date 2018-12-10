If you are using or even writing tests you should, in general, never have to worry about anything in this directory. Jest will babel test files, and their dependencies, before running. Unfortunately, Jest will not babel any files considered to be "outside of its runtime". This means config files (setup_script.js and custom-report.js).

These config files are important as they tell Jest what to do before and after each test. Our current test setup will not function without these.

Babeled versions of all files contained within this folder must be present in /test-base/babeled-res/ before Jest can be run. Note that run-tests.sh should do this for you. 
