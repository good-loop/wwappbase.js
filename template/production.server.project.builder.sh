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

## Dependency Checks Functions
# Human checklist:
# 01. 'bob' is a globally available command -- and it is up-to-date
# 02. 'jerbil' is a globally available command -- and it is up-to-date
# 03. 'mvn' is a globally available command
# 04. 'JAVA_HOME' is set correctly
# 05. 'node' is version 12.x
# 06. 'npm' is at the latest version
# 07. 'wwappbase.js' directory is where it is expected (as defined earlier in this script)