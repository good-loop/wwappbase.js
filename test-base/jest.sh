#!/bin/bash
#./jest.sh [flags] args -> ./jest.sh -d test

########
### Setting values to variables if there are no arguments given when running the script
########
ENDPOINT=''
SERVICE=''
CONFIG=''
PUPPETEER_RUN_HEADLESS=''
# local/test/''
TEST_SERVER_TYPE='test' 

########
### Select a service to run tests against
########

########
### Which set of tests are we running?
### Should these be run in a headed or headless browser?
########
while getopts ":s:d" opt; do
	case $opt in
		d) PUPPETEER_RUN_HEADLESS=false;;
		s) SERVICE=$OPTARG;;
	esac
done

case $SERVICE in
	adserver|ADSERVER)
	CONFIG='./config-files/adserver.jest.config.js';;
	sogive|SOGIVE)
	CONFIG='./config-files/sogive.jest.config.js';;
	myloop|MYLOOP)
	CONFIG='./config-files/myloop.jest.config.js';;
	*)
	exit;;
esac

########
### Handling Test Target arguments
########
shift $((OPTIND - 1))

case $1 in
	test|TEST)
	printf "\nGoing to run Jest tests on test\n"
	TEST_SERVER_TYPE='test'
	;;
	production|PRODUCTION)
	printf "\nGoing to run Jest tests on production\n"
	TEST_SERVER_TYPE=''	
	;;
	local|LOCAL|localhost|LOCALHOST)
	printf "\nGoing to run Jest tests on local\n"
	TEST_SERVER_TYPE='local'	
	;;
	*)
	printf "\nGoing to run Jest tests on $1\n"
esac

########
### Satisfy NPM contingencies
#######
printf "\nGetting NPM Packages to Run Jest Tests...\n"
cd ~/winterwell/wwappbase.js/test-base && npm i

#########
### Run the tests
#########
RES=$(cd ~/winterwell/wwappbase.js/test-base/res/ && find -iname "*.js")
#Jest will babel any test files itself,
#but anything it sees as "outside of its runtime" (config files)
#need to be babeled by us
printf "\nWebpacking config files..."
cd ~/winterwell/wwappbase.js/test-base/ && webpack

#########
### Check for Test Output Folders
#########
BASE_DIR="/home/$USER/winterwell/adserver/puppeteer-tests/"
if [[ ! -d "$BASE_DIR/test-results" ]]; then
	mkdir -p $BASE_DIR/test-results
fi

printf "\nLaunching Jest... \n"

# Config files need to know if we are running on local/test/production
PUPPETEER_RUN_HEADLESS=$PUPPETEER_RUN_HEADLESS TEST_SERVER_TYPE=$TEST_SERVER_TYPE npm run jest -- --config $CONFIG
