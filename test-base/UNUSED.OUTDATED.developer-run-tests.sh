# !/bin/bash

VERSION='0.0.3b'

## List of tests written for specific projects. When new tests are written for new projects, edit this line
SUPPORTED_TESTS='adserver, demo, myloop, sogive, and studio'
USAGE="\tdeveloper-run-tests.sh -p adserver\n\tOR with all options argued\n\tdeveloper-run-tests.sh -p adserver -t local -a test_wide_multiple -h true -c true -s 150\n\n\tp = project_name\n\tt = target server eg. test|local|production.  DEFAULT = local\n\ta = use this advertID (applicable to portal/adserver tests). DEFAULT = test_wide_multiple\n\th = Should the tests be run headlessly? true or false. DEFAULT = true\n\tc = use my computers local binary of chrome, rather than chromium. true or false. DEFAULT = false\n\ts = milliseconds of slowdown between automated commands. DEFAULT = 0\n\n\tSupported Projects : $SUPPORTED_TESTS\n\n"
########
## Ensuring a clean environment
########
if [[ -f runtests.js ]]; then
    rm runtests.js
fi

if [[ -f jest-puppeteer.config.js ]]; then
	rm jest-puppeteer.config.js
fi

########
### What test are we running? or rather, which project/product would you like to test today?
########
# Declare Default Values - which can be overwritten with arguments -- see $USAGE
TARGET_SERVER='local'
SPECIFIED_ADVERT_ID='test_wide_multiple'
HEADLESS_BROWSER_PREFERENCE='true' # true = 'yes, please HIDE the GUI Browser, and run headlessly'
USE_CHROME_T_OR_F='false'
SLOW_MO_VALUE='0'


# Parse flagged arguments.  Declaring a project is manditory
while getopts p:t:a:h:c:s: opt; do
	case $opt in
		# Project Name : This flag must be set in order for the script to run correctly
		p)
			if [ -z $OPTARG ]; then
				printf "\nNo project specified\n\texample of valid usage:\n\t$USAGE\n\n"
				exit 0
			else
				case $OPTARG in
					adserver|ADSERVER)
						PROJECT_NAME='adserver'
					;;
					demo|DEMO)
						PROJECT_NAME='demo'
					;;
					myloop|MYLOOP)
						PROJECT_NAME='myloop'
					;;
					sogive|SOGIVE)
						PROJECT_NAME='sogive'
					;;
					studio|STUDIO)
						PROJECT_NAME='studio'
					;;
					*)
						printf "\nInvalid Project Name\n\texample of viable usage:\n\t$USAGE\n\n\tSupported Projects:\n\t$SUPPORTED_TESTS\n\n"
						exit 0
					;;
				esac
			fi
		;;
		# Target server : if none is specified, use the default 'local'
		t)
			if [[ -z $OPTARG ]]; then
				TARGET_SERVER='local'
			else
				TARGET_SERVER=$OPTARG
			fi
		;;
		# Advert : If an advert id is specified, use it, otherwise use default of 'test_wide_multiple'
		a)
			if [ -z $OPTARG ]; then
				SPECIFIED_ADVERT_ID='test_wide_multiple'
			else
				SPECIFIED_ADVERT_ID=$OPTARG
			fi
		;;
		# Browser should be Headless/Shown : If this option is specified, then honor it, otherwise, default to headless mode
		h)
			if [ -z $OPTARG ]; then
				HEADLESS_BROWSER_PREFERENCE='true'
			else
				HEADLESS_BROWSER_PREFERENCE=$OPTARG
				case $HEADLESS_BROWSER_PREFERENCE in
					true|TRUE)
						HEADLESS_BROWSER_PREFERENCE='true'
					;;
					false|FALSE)
						HEADLESS_BROWSER_PREFERENCE='false'
					;;
					*)
						printf "\nYour preference for either a headless or GUI browser could not be parsed.\n\n\tviable options are 'true' or 'false'\n\n"
						exit 0
					;;
				esac
			fi
		;;
		# Chrome Usage : Should the localhost's installation of google chrome be used in order to perform the tests, rather than chromium
		c)
			if [ -z $OPTARG ]; then
				USE_CHROME_T_OR_F='false'
			else
				USE_CHROME_T_OR_F=$OPTARG
				case $USE_CHROME_T_OR_F in
					true|TRUE)
						USE_CHROME_T_OR_F='true'
					;;
					false|FALSE)
						USE_CHROME_T_OR_F='false'
					;;
					*)
						printf "\nYour preference for using a local installation of google chrome to run the tests could not be parsed.\n\tviable options are 'true' or 'false'\n\n"
						exit 0
				;;
				esac
			fi
		;;
		# slowMo -- an option to have jest/puppeteer purposely slow down so that you can see each and every action in slow motion
		### The value is supposed to be an integer which is measured in milliseconds.
		s)
			if [ -z $OPTARG ]; then
				SLOW_MO_VALUE='0'
			else
				SLOW_MO_VALUE=$OPTARG
				re='^[0-9]+$'
				if ! [[ $OPTARG =~ $re ]]; then
					printf "\nThe -s argument can only use integers.\n"
					printf "\n$USAGE\n"
					exit 0
				fi
			fi
		;;
		\?)
			printf "\nInvalid Option used\n\nViable Usage:\n\t$USAGE\n\n"
			exit 0
		;;
		:)
			printf "\nOption -$OPTARG requires an argument\n"
			exit 0
		;;
	esac
done
if [ $OPTIND -eq 1 ]; then
	printf "\nNo options were passed\n"
	printf "\n$USAGE\n"
	exit 0
fi
shift $((OPTIND -1))

# Declaring the Set Variables to the User
printf "\nProject : $PROJECT_NAME\n"
printf "\nTarget Server (URL prefix) : $TARGET_SERVER\n"
printf "\n(If Adserver/Portal Testing) Using Advert : $SPECIFIED_ADVERT_ID\n"
printf "\nHIDE GUI Browser And Run HEADLESSLY? : $HEADLESS_BROWSER_PREFERENCE\n"
printf "\nUse Local Chrome instead of Chromium? : $USE_CHROME_T_OR_F\n"
printf "\nUse SlowMo with a Value of : $SLOW_MO_VALUE milliseconds\n"


########
## Functions: Generate skeleton 'runtests.js'
#######
function generate_runtests_conts_block {
	cat <<EOF
		'use strict';
		const shell = require('shelljs');
		const yargv = require('yargs').argv;
EOF
}

function generate_runtests_config_block {
	cat <<EOF
		let config = {
			site: '$TARGET_SERVER',
			unsafe: false,
			vert: '$SPECIFIED_ADVERT_ID',
			head: $HEADLESS_BROWSER_PREFERENCE,
			chrome: $USE_CHROME_T_OR_F,
			flag: false,
		};
EOF
}

function generate_runtests_let_block {
	cat <<EOF
		let argv = process.argv.slice(0, 2);
		let testPath = '$PROJECT_NAME';
		let runInBand = '';
EOF
}

function generate_runtests_object_functions {
	cat <<EOF
		Object.entries(yargv).forEach(([key, value]) => {
			if (key === 'test') { testPath = value; }
			if (key === 'runInBand') { runInBand = '--runInBand'; }

			if (Object.keys(config).includes(key)) {
				if (typeof config[key] === "boolean") {
					const bool = config[key];
					config[key] = !bool;
				} else config[key] = value;
			}
		});
EOF
}

function generate_runtests_process_settings {
	cat <<EOF
		// Store configuration on env
		process.env.__CONFIGURATION = JSON.stringify(config);

		// Setting real ARGV
		process.argv = argv;
EOF
}

function generate_runtests_shell_exec {
	cat <<EOF
		shell.exec(\`npm run test\${' ' + testPath} \${runInBand}\`);
EOF
}


########
### Functions : Generate jest-puppeteer.config.js
########
function generate_jest_puppeteer_config_js {
	cat <<EOF
	const config = JSON.parse(process.env.__CONFIGURATION);
console.log(config)

module.exports = {
	launch: {
		headless: config.head,
        slowMo: process.env.SLOWMO ? process.env.SLOWMO : $SLOW_MO_VALUE,
		executablePath: config.chrome ? '/usr/bin/google-chrome-stable' : ''
	}
};
EOF
}

########
### Preamble: Check for msmtp and mutt
# ########
# if [[ $(which mutt) = '' ]]; then
#         printf "\nYou must have mutt installed in order to run these tests\n\Install with:\n\t'sudo apt-get install mutt'\n"
#         printf "\nAfter installing, you must run mutt for the first time by typing in: 'mutt'\n"
#         exit 0
# fi
# if [[ $(which msmtp) = '' ]]; then
#         printf "\nYou must have msmtp installed in order to run these tests\nInstall with:\n\t'sudo apt-get install msmtp'\n"
#         exit 0
# fi


########
### Whom shall receive the emails?:: Add new recipients with a comma separating the addresses
########
EMAIL_RECIPIENTS=()
DELAY_SECONDS='5'

########
### Ensuring that local repo of 'logins' is up-to-date
########
printf "\nEnsuring that your 'logins' are up-to-date\n"
git --git-dir=/home/$USER/winterwell/logins/.git/ --work-tree=/home/$USER/winterwell/logins gc --prune=now
git --git-dir=/home/$USER/winterwell/logins/.git/ --work-tree=/home/$USER/winterwell/logins pull origin master
git --git-dir=/home/$USER/winterwell/logins/.git/ --work-tree=/home/$USER/winterwell/logins reset --hard FETCH_HEAD
cp -r ~/winterwell/logins/test-base/adserver/utils adserver/
cp -r ~/winterwell/logins/test-base/sogive/utils sogive/
cp -r ~/winterwell/logins/test-base/myloop/utils myloop/
cp -r ~/winterwell/logins/test-base/studio/utils studio/


########
### Ensure that symlinks exist for .msmtprc and .muttrc
########
# if [[ -f /home/$USER/.msmtprc ]]; then
#         rm /home/$USER/.msmtprc
#         cp /home/$USER/winterwell/logins/.msmtprc /home/$USER/.msmtprc
# else
#         cp /home/$USER/winterwell/logins/.msmtprc /home/$USER/.msmtprc
# fi
# if [[ ! -f /tmp/msmtp/msmtp.log ]]; then
#         mkdir -p /tmp/msmtp/
#         touch /tmp/msmtp/msmtp.log
#         chmod 777 /tmp/msmtp/msmtp.log
# fi
# if [[ -f /home/$USER/.muttrc ]]; then
#         rm /home/$USER/.muttrc
#         ln -s /home/$USER/winterwell/logins/.muttrc /home/$USER/.muttrc
# else
#         ln -s /home/$USER/winterwell/logins/.muttrc /home/$USER/.muttrc
# fi

# chmod 0600 /home/$USER/.msmtprc


#########
### Launching the Tests
#########
printf "\nGetting Ready to Perform Tests...\n"
while [ $DELAY_SECONDS -gt 0 ]; do
	printf "$DELAY_SECONDS\033[0K\r"
	sleep 1
	: $((DELAY_SECONDS--))
done

if [[ ! -d test-results ]]; then
    mkdir -p test-results/Logs
fi

TIME=$(date +%Y-%m-%dT%H:%M:%S-%Z)
generate_runtests_conts_block > runtests.js
generate_runtests_config_block >> runtests.js
generate_runtests_let_block >> runtests.js
generate_runtests_object_functions >> runtests.js
generate_runtests_process_settings >> runtests.js
generate_runtests_shell_exec >> runtests.js
generate_jest_puppeteer_config_js >> jest-puppeteer.config.js
node runtests.js &> test-results/Logs/$1-testing-output-$TIME.log


# function send_alert {
#     TIME=$(date +%Y-%m-%dT%H:%M:%S-%Z)
# 	message="Jest Detected Failure for -- $1 tests"
# 	body="Hi,\nThe jest/puppeteer script threw out a FAIL notice at $TIME:\n\n$line\n"
# 	title="[$HOSTNAME] $message"
# 	printf "$body" | mutt -s "$title" ${ATTACHMENTS[@]} -- $EMAIL_RECIPIENTS
# }


########
### Cleaning Up
########
if [[ -d adserver/utils ]]; then
    rm -rf adserver/utils
fi

if [[ -d sogive/utils ]]; then
    rm -rf sogive/utils
fi

if [[ -d myloop/utils ]]; then
    rm -rf myloop/utils
fi

if [[ -d studio/utils ]]; then
    rm -rf studio/utils
fi

#########
### Telling the human where to access their logged test results
#########
printf "\nYour test result log can be accessed in ~/winterwell/wwappbase.js/test-base/test-results/Logs/$1-testing-output-$TIME.log\n"
