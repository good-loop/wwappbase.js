# !/bin/bash

VERSION='0.0.2b'

## List of tests written for specific projects. When new tests are written for new projects, edit this line
SUPPORTED_TESTS='adserver, demo, myloop, and sogive'
USAGE='developer-run-tests.sh adserver'
########
## Ensuring a clean environment
########
if [[ -f runtests.js ]]; then
    rm runtests.js
fi
cp developer_config_injector_master.js runtests.js

########
### What test are we running? or rather, which project/product would you like to test today?
########
case $1 in
    adserver|ADSERVER)
        echo "let testPath = 'adserver';" >> runtests.js
        echo "shell.exec(\`npm run test\${' ' + testPath} \${runInBand}\`);" >> runtests.js
    ;;
    demo|DEMO)
        echo "let testPath = 'demo';" >> runtests.js
        echo "shell.exec(\`npm run test\${' ' + testPath} \${runInBand}\`);" >> runtests.js
    ;;
    myloop|MYLOOP)
        echo "let testPath = 'myloop';" >> runtests.js
        echo "shell.exec(\`npm run test\${' ' + testPath} \${runInBand}\`);" >> runtests.js
    ;;
    sogive|SOGIVE)
        echo "let testPath = 'sogive';" >> runtests.js
        echo "shell.exec(\`npm run test\${' ' + testPath} \${runInBand}\`);" >> runtests.js
    ;;
    *)
        printf "\nUnknown Project specified, or no project specified\n\tsupported projects are:\n\t$SUPPORTED_TESTS\n\n\nexample:\n\t$USAGE"
    ;;
esac
    




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

#########
### Telling the human where to access their logged test results
#########
printf "\nYour test result log can be accessed in ~/winterwell/wwappbase.js/test-base/test-results/Logs/$1-testing-output-$TIME.log\n"
