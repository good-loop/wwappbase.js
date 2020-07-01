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
# 04. Ensure that all of the git repositories on this production
#     server are ALREADY on the branch(es) which you wish to use
#     as the basis for building the production releases for a project
#
# 05. as the user 'winterwell':
#     cd into your project's repository
#     ./production.server.project.builder.sh

####### Goal -- create a project building script (using git, bob, jerbil, maven, npm, and webpack as the tools)
## which uses very similar, if not, the exact same, functions as the teamcity builder template script.

PROJECT_USES_BOB='yes'  #yes or no :: If 'yes', then you must also supply the name of the service which is used to start,stop,or restart the jvm
NAME_OF_SERVICE='my_new_project_main' # This can be blank, but if your service uses a JVM, then you must put in the service name which is used to start,stop,or restart the JVM on the server.
PROJECT_USES_NPM='yes' # yes or no
PROJECT_USES_WEBPACK='yes' #yes or no
PROJECT_USES_JERBIL='yes' #yes or no
PROJECT_USES_WWAPPBASE_SYMLINK='yes'


#####  SPECIFIC SETTINGS
## This section should only be selectively edited - based on non-standardized needs
#####
WWAPPBASE_REPO_PATH_ON_SERVER_DISK="/home/winterwell/wwappbase.js"


##### UNDENIABLY ESOTERIC SETTINGS
## This is the space where your project's settings make it completely non-standard
#####
BOB_ARGS='' #you can set bob arguments here, but they will run each and every time that the project is auto-built
BOB_BUILD_PROJECT_NAME='' #If the project name isn't automatically sensed by bob, you can set it explicitly here
NPM_CLEANOUT='no' #yes/no , will nuke the node_modules directory if 'yes', and then get brand-new packages.
NPM_I_LOGFILE="/home/winterwell/.npm/_logs/npm.i.for.$PROJECT_NAME.log"
NPM_RUN_COMPILE_LOGFILE="/home/winterwell/.npm/_logs/npm.run.compile.for.$PROJECT_NAME.log"

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
        if [[ ! -d /home/winterwell/bobwarehouse/code ]]; then
            printf "\nYou must manually clone the 'winterwell-code' repo into the path /home/winterwell/bobwarehouse/  before attempting to use bob to compile your Java project\n"
            exit 0
        fi
    fi
}