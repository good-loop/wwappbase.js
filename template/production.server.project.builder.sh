#!/bin/bash


# Production Server -- Project Builder
# VERSION=0.1b
# VERSION_MEANING=script has been written, but never used.

## USAGE -- human instructions for a how to use:
# Assumption -- you want to use this script to build
#     a project (eg. adserver, datalogger, portal, etc.)
#     on a production server.
#
# 01. ssh into the production server
#
# 02. Have this project builder script already on the server repo,
#     with this current version with all of the current edits.
#     You might have to `git pull` in order to get it's repo up
#     to date. And get this script up-to-date
#
# 03. Get yourself into a tmux session -- this will allow your
#     command(s) to be executed regardless of your ssh connection
#     status
#
# 04. Ensure that ALL of the git repositories on this production
#     server are ALREADY on the branch(es) which you wish to use
#     as the basis for building the production releases for a project
#
# 05. as the user 'winterwell':
#     cd into your project's repository
#     ./production.server.project.builder.sh

####### Goal -- create a project building script (using git, bob, jerbil, maven, npm, and webpack as the tools)
## which uses very similar, if not, the exact same, functions as the teamcity builder template script.
PROJECT_NAME='my_new_project' #This is simply a human readable name
PROJECT_USES_BOB='yes'  #yes or no :: If 'yes', then you must also supply the name of the service which is used to start,stop,or restart the jvm
NAME_OF_SERVICE='my_new_project_main' # This can be blank, but if your service uses a JVM, then you must put in the service name which is used to start,stop,or restart the JVM on the server.
PROJECT_USES_NPM='yes' # yes or no
PROJECT_USES_WEBPACK='yes' #yes or no
PROJECT_USES_JERBIL='yes' #yes or no
PROJECT_USES_WWAPPBASE_SYMLINK='yes'


#####  SPECIFIC SETTINGS
## This section should only be selectively edited - based on non-standardized needs
#####
PROJECT_ROOT_ON_SERVER="/home/winterwell/$PROJECT_NAME"
WWAPPBASE_REPO_PATH_ON_SERVER_DISK="/home/winterwell/wwappbase.js"


##### UNDENIABLY ESOTERIC SETTINGS
## This is the space where your project's settings make it completely non-standard
#####
BOB_ARGS='' #you can set bob arguments here, but they will run each and every time that the project is auto-built
BOB_BUILD_PROJECT_NAME='' #If the project name isn't automatically sensed by bob, you can set it explicitly here
NPM_CLEANOUT='no' #yes/no , will nuke the node_modules directory if 'yes', and then get brand-new packages.
NPM_I_LOGFILE="/home/winterwell/.npm/_logs/npm.i.for.$PROJECT_NAME.log"
NPM_RUN_COMPILE_LOGFILE="/home/winterwell/.npm/_logs/npm.run.compile.for.$PROJECT_NAME.log"
BOBWAREHOUSE_PATH='/home/winterwell/bobwarehouse'

#######
### Functions
#######

# Dependency Check Function - 'bob' is globally available
function check_bob_exists {
    if [[ $PROJECT_USES_BOB = 'yes' ]]; then
        if [[ $(which bob) = '' ]]; then
            printf "\nNo global installation of 'bob' was found. As 'root' please:\n\tnpm install -g java-bob\nAnd then as a regular user, please:\n\tbob\nand then retry this script\n"
            exit 0
        fi
    fi
}

# Dependency Check Function - 'jerbil' is globally available
function check_jerbil_exists {
    if [[ $PROJECT_USES_JERBIL = 'yes' ]]; then
        if [[ $(which jerbil) = '' ]]; then
            printf "\nNo global installation of 'jerbil' was found. As 'root' please:\n\tnpm install -g jerbil-website\nAnd then as a regular user, please:\n\tjerbil\nAnd then retry this script\n"
            exit 0
        fi
    fi
}

# Dependency Check Function - 'mvn' is globally available
function check_maven_exists {
    if [[ $PROJECT_USES_BOB = 'yes' ]]; then
        if [[ $(which mvn) = '' ]]; then
            printf "\nNo global installation of maven was found. As 'root' please:\n\tapt-get install maven\nAnd then retry this script\n"
            exit 0
        fi
    fi
}

# Dependency Check Function - 'JAVA_HOME' is set correctly in this CLI environment
function check_java_home {
    if [[ $PROJECT_USES_BOB = 'yes' ]]; then
        if [[ $(printf $JAVA_HOME) = '' ]]; then
            printf "\nYou must have an export in this user's .bashrc file which set's JAVA_HOME to the path where your java is installed\n\n\texport JAVA_HOME=/usr/lib/jvm/java-11-openjdk-amd64\n\nand then\n\tsource ~/.bashrc\nAnd then retry this script\n"
            exit 0
        fi
        if [[ $(printf $JAVA_HOME) != '/usr/lib/jvm/java-11-openjdk-amd64' ]]; then
            printf "\nYour \$JAVA_HOME is not set to the correct path.  It should be /usr/lib/jvm/java-11-openjdk-amd64\n"
            exit 0
        fi
    fi
}

# Dependency Check Function - nodejs is at version 12.x
function check_nodejs_version {
    if [[ $PROJECT_USES_NPM = 'yes' ]]; then
        if [[ $(node -v | grep "v12") = '' ]]; then
            printf "Either nodejs is not installed, or it is not at version 12.x.x\n"
            exit 0
        fi
    fi
}

# Dependency Check Function - wwappbase.js is verified on disk
function check_for_wwappbasejs_location {
    if [[ $PROJECT_USES_WWAPPBASE_SYMLINK = 'yes' ]]; then
        if [[ ! -d $WWAPPBASE_REPO_PATH_ON_SERVER_DISK ]]; then
            printf "\nThe location of $WWAPPBASE_REPO_PATH_ON_SERVER_DISK could not be verified.  Please check this server's repositories and then check the variables regarding wwappbase.js at the top of this script.\n"
            exit 0
        fi
    fi
}

# Dependency Check Function - bobwarehouse directory has discrete 'code' repository nested inside of it.
function check_for_code_repo_in_bobwarehouse {
    if [[ $PROJECT_USES_BOB = 'yes' ]]; then
        if [[ ! -d $BOBWAREHOUSE_PATH/code ]]; then
            printf "\n\nNo 'code' repo found in $BOBWAREHOUSE_PATH.  Cloning now ...\n"
            cd $BOBWAREHOUSE_PATH && git clone git@git.winterwell.com:/winterwell-code code
            printf "\nContinuing...\n"
        fi
    fi
}

# Stopping the JVM Backend (if applicable)
function stop_service {
    if [[ $PROJECT_USES_BOB = 'yes' ]]; then
        for server in ${TARGET_SERVERS[@]}; do
            printf "\nStopping $NAME_OF_SERVICE on $server...\n"
            ssh winterwell@$server "sudo service $NAME_OF_SERVICE stop"
        done
    fi
}

# Bob -- Evaluate and Use
function use_bob {
    if [[ $PROJECT_USES_BOB = 'yes' ]]; then
        BUILD_PROCESS_NAME='bob'
        BUILD_STEP='bob was attempting to render jars'
        for server in ${TARGET_SERVERS[@]}; do
            printf "\ncleaning out old bob.log on $server ...\n"
            ssh winterwell@$server "rm -rf $PROJECT_ROOT_ON_SERVER/bob.log"
            printf "\n$server is updating bob...\n"
            ssh winterwell@$server "bob -update"
            printf "\n$server is building JARs...\n"
            ssh winterwell@$server "cd $PROJECT_ROOT_ON_SERVER && bob $BOB_ARGS $BOB_BUILD_PROJECT_NAME"
            printf "\nchecking bob.log for failures on $server\n"
            if [[ $(ssh winterwell@$server "grep -i 'Compile task failed' $PROJECT_ROOT_ON_SERVER/bob.log") = '' ]]; then
                printf "\nNo failures recorded in bob.log on $server.  JARs should be fine.\n"
            else
                printf "\nFailure or failures detected in latest bob.log. Sending Alert Emails and Breaking Operation\n"
                send_alert_email
                exit 0
            fi
        done
    fi
}

# NPM -- Evaluate and Use
function use_npm {
    if [[ $PROJECT_USES_NPM = 'yes' ]]; then
        BUILD_PROCESS_NAME='npm'
        BUILD_STEP='npm was downloading packages'
        NPM_LOG_DATE=$(date +%Y-%m-%d)
        for server in ${TARGET_SERVERS[@]}; do
            if [[ $NPM_CLEANOUT = 'yes' ]]; then
                printf "\nDeleting the existing node_modules...\n"
                ssh winterwell@$server "rm -rf $PROJECT_ROOT_ON_SERVER/node_modules"
            fi
            # Ensuring that there are no residual npm error/debug logs in place
            ssh winterwell@$server "rm -rf /home/winterwell/.npm/_logs/*.log"
            printf "\nEnsuring all NPM Packages are in place on $server ...\n"
            ssh winterwell@$server "cd $PROJECT_ROOT_ON_SERVER && npm i &> $NPM_I_LOGFILE"
            printf "\nChecking for errors while npm was attempting to get packages on $server ...\n"
            if [[ $(ssh winterwell@$server "grep -i 'error' $NPM_I_LOGFILE") = '' ]]; then
                printf "\nNPM package installer check : No mention of 'error' in $NPM_I_LOGFILE on $server\n"
            else
                printf "\nNPM encountered one or more errors while attempting to get node packages. Sending Alert Emails, but Continuing Operation\n"
                # Get the NPM_I_LOGFILE
                scp winterwell@$server:$NPM_I_LOGFILE .
                # Add it to the Attachments
                ATTACHMENTS+=("-a npm.i.for.$PROJECT_NAME.log")
                # Send the email
                send_alert_email
            fi
            if [[ $(ssh winterwell@$server "grep -i 'is not in the npm registry' $NPM_I_LOGFILE") = '' ]]; then
                printf "\nNPM package installer check : No mention of packages which could not be found in $NPM_I_LOGFILE on $server\n"
            else
                printf "\nNPM encountered one or more errors while attempting to get node packages. Sending Alert Emails, but Continuing Operation\n"
                # Get the NPM_I_LOGFILE
                scp winterwell@$server:$NPM_I_LOGFILE .
                # Add it to the Attachments
                ATTACHMENTS+=("-a npm.i.for.$PROJECT_NAME.log")
                # Send the email
                send_alert_email
            fi
        done
    fi
}

# Webpack -- Evaluate and Use
function use_webpack {
    if [[ $PROJECT_USES_WEBPACK = 'yes' ]]; then
        BUILD_PROCESS_NAME='webpack'
        BUILD_STEP='npm was running a weback process'
        for server in ${TARGET_SERVERS[@]}; do
            printf "\nNPM is now running a Webpack process on $server\n"
            ssh winterwell@$server "cd $PROJECT_ROOT_ON_SERVER && npm run compile &> $NPM_RUN_COMPILE_LOGFILE"
            printf "\nChecking for errors that occurred during Webpacking process on $server ...\n"
            if [[ $(ssh winterwell@$server "cat $NPM_RUN_COMPILE_LOGFILE | grep -i 'error' | grep -iv 'ErrorAlert.jsx'") = '' ]]; then
                printf "\nNo Webpacking errors detected on $server\n"
            else
                printf "\nOne or more errors were recorded during the webpacking process. Sending Alert Emails, but Continuing Operation\n"
                # Get the NPM_RUN_COMPILE_LOGFILE
                scp winterwell@$server:$NPM_RUN_COMPILE_LOGFILE .
                # Add it to the Attachments
                ATTACHMENTS+=("-a npm.run.compile.for.$PROJECT_NAME.log")
                # Send the email
                send_alert_email
            fi
        done
    fi
}

# Jerbil -- Evaluate and Use
function use_jerbil {
    if [[ $PROJECT_USES_JERBIL = 'yes' ]]; then
        BUILD_PROCESS_NAME='jerbil'
        BUILD_STEP='jerbil was attempting to render markdown to html'
        for server in ${TARGET_SERVERS[@]}; do
            printf "\n$server is ensuring that jerbil is up to date\n"
            ssh winterwell@$server "jerbil -update"
            printf "\n$server is converting markdown to html..\n"
            ssh winterwell@$server "cd $PROJECT_ROOT_ON_SERVER && jerbil"
            ### Is there a way to check for errors?  I'd like to check to check for errors
        done
    fi
}

# Starting the JVM Backend (if applicable)
function start_service {
    if [[ $PROJECT_USES_BOB = 'yes' ]]; then
        for server in ${TARGET_SERVERS[@]}; do
            printf "\nStarting $NAME_OF_SERVICE on $server...\n"
            ssh winterwell@$server "sudo service $NAME_OF_SERVICE start"
        done
    fi
}


################
### Run the Functions in Order
################
check_bob_exists
check_jerbil_exists
check_maven_exists
check_java_home
check_nodejs_version
check_for_wwappbasejs_location
check_for_code_repo_in_bobwarehouse
stop_service
use_bob
use_npm
use_webpack
use_jerbil
start_service