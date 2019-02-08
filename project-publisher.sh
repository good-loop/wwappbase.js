#!/bin/bash

VERSION='Version=1.15.6'

###
# New in 1.15.6: Portal project now is told to webpack via 'npm run build' command
# New in 1.15.5: Made it so that Adserver publishing now targets one LESS file instead of an entire directory
#					Also, the syncing process will now ignore any directory called 'node_modules'.
# New in 1.15.4: Moved the task of starting the project-process lower in the order of operations
# New in 1.15.3: If publishing adserver [frontend|everything] then webpacking of the preact bundles takes place
# New in 1.15.2: Made webpacking the last step in publishing, so as to not overwrite a bundle.js with a locally generated one.
# New in 1.15.1: Fixed a loop-break if a fourth argument is not given. Fixed a post-publishing task for adserver publishes
# New in 1.15.0: Added ability to specify publishing of the frontend/backend/everything
# New in 1.14.0: LESS conversion now happening for preact adunits.
# New in 1.13.8: I feel the need for speed: Option to compile less less. Option to not run puppeteer tests.
# New in 1.13.7: Trying to preserve log.properties on adservers
# New in 1.13.6: Solving needs for Preact
# New in 1.13.5: Adding new adserver to the production cluster
# New in 1.13.4: Allows for syncing the preact-unit directory, and adding NPM and webpacking for the preact-unit
# New in 1.13.3: Ensuring that the directory 'web-iframe' is sync'ed to heppner on a production adserver publish task
# New in 1.13.2: Fixed the location of the less files for sogive
# New in 1.13.1: Ensuring that there are no zombie JARs that are synced to a server during a publish
# New in 1.13.0: Allowing for remaps of the $PROJECT_LOCATION variable if the project is being published by TeamCity
# New in 1.12.1: Fixed the minify_css function
# New in 1.12.0: Added new function: 'minify_css'.  made my-loop images optimised.
# New in 1.11.2: Added a line which copies a properties file, allowing gl-es-01 to run the BAOSE service
# New in 1.11.1: Switched the target of the BAOSE microservice from gl-es-03 to gl-es-01
# New in 1.11.0: New Project Param, 'POST_PUBLISHING_TASK' can be set and defined
# New in 1.10.0: Created the ability to stop and start more than one service per each project.
# New in 1.9.14: Ensured that variants get sync'ed to the production portal
# New in 1.9.13: Fixed a 'duh' error of putting in a FQDN instead of an abriged one
# New in 1.9.12: Made gl-es-03 the production profiler server, and hugh the test server
# New in 1.9.11: Patched in Roscoe's changes needed to compile new JS units
# New in 1.9.10: I realised that my.good-loop.com AND testmy.good-loop.com must have the same CDN for image-serving.
# New in 1.9.9 : Added sandrock to the my-loop production servers.  the lg cluster will be used as a CDN. Sandrock will serve all non-image assets
# New in 1.9.8 : My-Loop's production servers are gl-es-03, gl-es-04, gl-es-05
# New in 1.9.7 : Made the correct '.properties' file get renamed for the correct target server during sogive publishing
# New in 1.9.6 : double brackets for some bash's
# New in 1.9.5 : Added 'web-iframe' directory to the list of sync'ed items during an adserver publish process.
# New in 1.9.4 : fixed a typo
# New in 1.9.3 : Configured the sogiveapp syncing of the config (.properties) files so that the production server always gets the correct
#					file synced to it and renamed to an appropriate name.
# New in 1.9.2 : Added 'egbot' to the list of supported projects. This is a superficial change to this script.
# New in 1.9.1 : Added the ability to specify "experiment" as a second argument for the datalog project.
# New in 1.9.0 : Added the ability to specify "experiment" as a second argument for adserver and portal projects.
# New in 1.8.1 : Added "lib" dir to sync for the egbot project.
# New in 1.8.0 : Added "egbot" as a project that can be published.
# New in 1.7.0 : Added 'Calstat' as a project that can be published.  Alphabetised available projects so that they are more easily found
#					and edited by a human.
# New in 1.6.0 : Changed the Automated-Testing project-name matching to a case->esac loop. And added automated testing for the portal project.
# New in 1.5.6 : Added names 'lg' and 'LG' as aliases for the datalogger publish.
# New in 1.5.5 : Amended the list of needed items for a successful youagain server sync
# New in 1.5.4 : Added 'hugh.soda.sh' as a test server for the youagain project/product
# New in 1.5.3 : Fixed the way in which dboptions.properties files are sync'ed to targets, and renamed properly
# New in 1.5.2 : Fixed the 'LESS_FILES_LOCATION' directory for the portal publishing process.
# New in 1.5.1 : Added the directories 'web' and 'web-portal' to the portal syncing process.
# New in 1.5.0 : Added new variable "CSS_OUTPUT_LOCATION" which lets individual project specify where converted LESS files should be put before syncing.
# New in 1.4.14 : Found and fixed a bad output path where the all.css file was being created when compiling adunits.
# New in 1.4.13 : Preserved a youagain config file
# New in 1.4.12 : Added more items to sync for the profiler project
# New in 1.4.11 : Added webpacking to the publishing process of the profiler project
# New in 1.4.10 : Changed the checking of 'config-files-to-sync' from 'if' loops to 'case' checks.  Added syncing of properties files
#					when the portal is being published.  As new portal functions require emails to be sent.
# New in 1.4.9 : Fixed the preservation functions so that they actually work as intended.  Trust me, it was harder than it sounds.
# New in 1.4.8 : Added two new functions which allow for the preservation of files/directories throughout publishing tasks. This is useful
#				For projects which have an 'upload' feature, allowing users to upload files to be used in the frontend.
# New in 1.3.8 : Added a safety feature which cleans out the tmp-lib directory after a publish. This makes it so that there are not leftover
#				JAR files living and lurking in tmp-lib, and this means that each publish is performed cleanly and all JARs that are sync'ed
#				Have been deemed necessary by the Java side of the publishing process.				
# New in 1.2.8 : Fixed a check for a directory syntax
# New in 1.2.7 : Changed the way in which JARs are moved from tmp-lib to a 'lib' directory.  Old style was destructive, new style is addative
###

#####
## Versioning number/serialisation schema:
##
## First Digit = Major rewrite/overhaul/feature added. The script will be super distinguished against previous versions
## Second Digit = New Project Added to Script // New Syncing/Processing Parameter added
## Third Digit = Minor Edit -- Spelling mistakes, pretty-printing progress to terminal, fixing extra backslashes, New help text, fixing small bugs, etc.
#####


#####
## HOW TO ADD A NEW PROJECT
#####
# Copy the following template into Section 01 of this script in order to add a new Project
#
# newproject|NEWPROJECT)
# 	PROJECT='newproject'
# 	PRODUCTION_SERVERS=('production-server-name.soda.sh')
# 	TEST_SERVERS=('test-server-name.soda.sh')
# 	PROJECT_LOCATION="/home/$USER/winterwell/newproject"
# 	TARGET_DIRECTORY='/home/winterwell/newproject'
# 	IMAGE_OPTIMISE='no'
# 	IMAGEDIRECTORY="" #Only needed if 'IMAGE_OPTIMISE' is set to 'yes'
# 	CONVERT_LESS='no'
# 	LESS_FILES_LOCATION="" #Only needed if 'CONVERT_LESS' is set to 'yes'
# 	CSS_OUTPUT_LOCATION="" #Only needed if 'CONVERT_LESS' is set to 'yes'
# 	WEBPACK='no'
# 	TEST_JAVASCRIPT='no'
# 	JAVASCRIPT_FILES_TO_TEST="$PROJECT_LOCATION/adunit/variants/" #Only needed if 'TEST_JAVASCRIPT' is set to 'yes', and you must ammend Section 10 to accomodate for how to find and process your JS files
# 	COMPILE_UNITS='no'
# 	UNITS_LOCATION="$PROJECT_LOCATION/adunit/variants/" #Only needed it 'COMPILE_UNITS' is set to 'yes', and you must ammend Section 11 to accomodate for how to find and process your unit files
# 	RESTART_SERVICE_AFTER_SYNC='yes'
# 	SERVICE_NAME='adservermain'
#	FRONTEND_SYNC_LIST=("adunit" "config" "server" "src" "web-iframe" "web-as" "web-snap" "web-test" "preact-unit" "package.json" "webpack.config.as.js" "webpack.config.js" ".babelrc")
#	BACKEND_SYNC_LIST=("lib")
#	# Use "lib" instead of "tmp-lib" for syncing your JAR files
# 	WHOLE_SYNC=($FRONTEND_SYNC_LIST $BACKEND_SYNC_LIST)
# 	PRESERVE=("web-as/uploads")
# 	POST_PUBLISHING_TASK='no' # If this is set to 'yes', then you must ammend section 16 in order to specify how to handle the tasks
# 	AUTOMATED_TESTING='no'  # If this is set to 'yes', then you must ammend Section 13 in order to specify how to kick-off the testing
# ;;


#################
### Preamble: Check for dependencies
#################
if [[ $(which npm) = "" ]]; then
	printf "\nYou must first install NPM before you can use this tool"
	exit 1
fi

if [[ $(which babel) = "" ]]; then
	printf "\nYou must install babel globally before you can use this tool\nInstall with 'sudo npm install -g babel-cli'"
	exit 1
fi

if [[ $(which babili) = "" ]]; then
	printf "\nYou must install babili globally before you can use this tool\nInstall with 'sudo npm install -g babili'"
	exit 1
fi

if [[ $(which jshint) = "" ]]; then
	printf "\nIn order to test the JS files before Babeling, you must have JShint installed on your machine\nInstall jshint with 'sudo npm install -g jshint'"
	exit 1
fi

if [[ $(which parallel-ssh) = "" ]]; then
	printf "\nIn order to use this publishing script, you will need Parallel-SSH installed on your machine\ninstall Parallel-SSH with 'sudo apt-get install pssh'"
	exit 1
fi

if [[ $(which uglifycss) = "" ]]; then
	printf "\nIn order to Minify CSS, you need to 'sudo npm install -g uglifycss'\n"
	exit 1
fi


#################
### Preamble: Define Arrays and Variables
#################
SUPPORTED_PROJECTS=('adserver','calstat','datalogger','egbot','myloop','portal','profiler','sogive','youagain')
USAGE=$(printf "\n./project-publisher.sh PROJECTNAME TEST/PRODUCTION frontend|backend|everything ?notests\n\nAvailable Projects\n\n\t$SUPPORTED_PROJECTS\n")
#SYNC_LIST=()
PSYNC='parallel-rsync -h /tmp/target.list.txt --user=winterwell --recursive -x -L -x -P -x -h -x --delete-before'
PSSH='parallel-ssh -t 100000000 -h /tmp/target.list.txt --user=winterwell'
DO_NOT_SYNC_LIST='/tmp/do_not_sync_list.txt'


##################
### Preamble: Check that this script is executed correctly
##################
if [[ $1 = '' ]]; then
		printf "$USAGE"
	exit 0
fi


#################
### Section 01: Get the name of the project and handle invalid first arguments
#################
case $1 in
	adserver|ADSERVER)
		PROJECT='adserver'
		PRODUCTION_SERVERS=(gl-es-01.soda.sh gl-es-02.soda.sh adnode-01.soda.sh)
		TEST_SERVERS=(hugh.soda.sh)
		EXPERIMENTAL_SERVERS=(simmons.soda.sh)
		PROJECT_LOCATION="/home/$USER/winterwell/adserver"
		TARGET_DIRECTORY='/home/winterwell/as.good-loop.com'
		IMAGE_OPTIMISE='yes'
		IMAGEDIRECTORY="$PROJECT_LOCATION/web-as/vert"
		CONVERT_LESS='yes'
		LESS_FILES_LOCATION="$PROJECT_LOCATION/adunit/style/base.less"
		CSS_OUTPUT_LOCATION="$PROJECT_LOCATION/web-as/unit.css"
		WEBPACK='no'
		TEST_JAVASCRIPT='yes'
		JAVASCRIPT_FILES_TO_TEST="$PROJECT_LOCATION/adunit/variants/"
		COMPILE_UNITS='yes'
		UNITS_LOCATION="$PROJECT_LOCATION/adunit/variants/"
		RESTART_SERVICE_AFTER_SYNC='yes'
		SERVICE_NAME=('adservermain')
		FRONTEND_SYNC_LIST=("adunit" "server" "src" "web-as" "web-test" "preact-unit" "package.json" "webpack.config.as.js" "webpack.config.js" ".babelrc")
		BACKEND_SYNC_LIST=("lib")
		WHOLE_SYNC=("adunit" "server" "src" "web-as" "web-test" "preact-unit" "package.json" "webpack.config.as.js" "webpack.config.js" ".babelrc" "lib")
		PRESERVE=("config/log.properties")
		POST_PUBLISHING_TASK='yes'
	;;
	calstat|CALSTAT)
		PROJECT='calstat'
		PRODUCTION_SERVERS=(hugh.soda.sh)
		TEST_SERVERS=(hugh.soda.sh)
		PROJECT_LOCATION="/home/$USER/winterwell/calstat"
		TARGET_DIRECTORY='/home/winterwell/calstat'
		IMAGE_OPTIMISE='no'
		CONVERT_LESS='yes'
		LESS_FILES_LOCATION="$PROJECT_LOCATION/src/style"
		CSS_OUTPUT_LOCATION="$PROJECT_LOCATION/web/style"
		WEBPACK='yes'
		TEST_JAVASCRIPT='no'
		COMPILE_UNITS='no'
		RESTART_SERVICE_AFTER_SYNC='yes'
		SERVICE_NAME=('calstat')
		FRONTEND_SYNC_LIST=("config" "src" "web" "ical-count.js" "package.json" "webpack.config.js")
		BACKEND_SYNC_LIST=("lib")
		WHOLE_SYNC=("config" "src" "web" "ical-count.js" "package.json" "webpack.config.js" "lib")
	;;
	egbot|EGBOT)
		PROJECT='egbot'
		PRODUCTION_SERVERS=('robinson.soda.sh')
		TEST_SERVERS=('robinson.soda.sh')
		PROJECT_LOCATION="/home/$USER/winterwell/egbot"
		TARGET_DIRECTORY='/home/winterwell/egbot.good-loop.com'
		IMAGE_OPTIMISE='no'
		IMAGEDIRECTORY="" #Only needed if 'IMAGE_OPTIMISE' is set to 'yes'
		CONVERT_LESS='yes'
		LESS_FILES_LOCATION="$PROJECT_LOCATION/src/style" #Only needed if 'CONVERT_LESS' is set to 'yes'
		CSS_OUTPUT_LOCATION="$PROJECT_LOCATION/web/style" #Only needed if 'CONVERT_LESS' is set to 'yes'
		WEBPACK='yes'
		TEST_JAVASCRIPT='no'
		JAVASCRIPT_FILES_TO_TEST="$PROJECT_LOCATION/adunit/variants/" #Only needed if 'TEST_JAVASCRIPT' is set to 'yes', and you must ammend Section 10 to accomodate for how to find and process your JS files
		COMPILE_UNITS='no'
		UNITS_LOCATION="$PROJECT_LOCATION/adunit/variants/" #Only needed it 'COMPILE_UNITS' is set to 'yes', and you must ammend Section 11 to accomodate for how to find and process your unit files
		RESTART_SERVICE_AFTER_SYNC='yes'
		SERVICE_NAME=('egbot')
		FRONTEND_SYNC_LIST=("config" "doc" "src" "test" "web" "package.json" "webpack.config.js" ".babelrc")
		BACKEND_SYNC_LIST=("data" "data-collection" "lib" "input.txt")
		WHOLE_SYNC=("config" "doc" "src" "test" "web" "package.json" "webpack.config.js" ".babelrc" "data" "data-collection" "lib" "input.txt")
		# Use "lib" instead of "tmp-lib" for syncing your JAR files
		#PRESERVE=("web-as/uploads")
		AUTOMATED_TESTING='no'  # If this is set to 'yes', then you must ammend Section 13 in order to specify how to kick-off the testing
		;;
	lg|LG|datalog|DATALOG|datalogger|DATALOGGER)
		PROJECT='datalogger'
		PRODUCTION_SERVERS=(gl-es-03.soda.sh gl-es-04.soda.sh gl-es-05.soda.sh)
		TEST_SERVERS=(hugh.soda.sh)
		EXPERIMENTAL_SERVERS=(simmons.soda.sh)
		PROJECT_LOCATION="/home/$USER/winterwell/open-code/winterwell.datalog"
		TARGET_DIRECTORY='/home/winterwell/lg.good-loop.com'
		IMAGE_OPTIMISE='no'
		CONVERT_LESS='no'
		WEBPACK='no'
		TEST_JAVASCRIPT='no'
		COMPILE_UNITS='no'
		RESTART_SERVICE_AFTER_SYNC='yes'
		SERVICE_NAME=('lg')
		FRONTEND_SYNC_LIST=("config" "src" "src-js" "web" "package.json" "ssl.gl-es-03.good-loop.com.conf" "ssl.gl-es-03.good-loop.com.params.conf" "ssl.gl-es-04.good-loop.com.conf" "ssl.gl-es-04.good-loop.com.params.conf" "ssl.gl-es-05.good-loop.com.conf" "ssl.gl-es-05.good-loop.com.params.conf" "webpack.config.js")
		BACKEND_SYNC_LIST=("lib" "winterwell.datalog.jar")
		WHOLE_SYNC=("config" "src" "src-js" "web" "package.json" "ssl.gl-es-03.good-loop.com.conf" "ssl.gl-es-03.good-loop.com.params.conf" "ssl.gl-es-04.good-loop.com.conf" "ssl.gl-es-04.good-loop.com.params.conf" "ssl.gl-es-05.good-loop.com.conf" "ssl.gl-es-05.good-loop.com.params.conf" "webpack.config.js" "lib" "winterwell.datalog.jar")
		;;
	my-loop|MY-LOOP|myloop|MYLOOP)
		PROJECT='myloop'
		PRODUCTION_SERVERS=('sandrock.soda.sh' 'gl-es-03.good-loop.com' 'gl-es-04.good-loop.com' 'gl-es-05.good-loop.com')
		TEST_SERVERS=('hugh.soda.sh' 'gl-es-03.good-loop.com' 'gl-es-04.good-loop.com' 'gl-es-05.good-loop.com')
		PROJECT_LOCATION="/home/$USER/winterwell/my-loop"
		TARGET_DIRECTORY='/home/winterwell/my.good-loop.com'
		IMAGE_OPTIMISE='yes'
		IMAGEDIRECTORY="$PROJECT_LOCATION/web/img"
		CONVERT_LESS='yes'
		MINIFY_CSS='yes'
		LESS_FILES_LOCATION="$PROJECT_LOCATION/src/style"
		CSS_OUTPUT_LOCATION="$PROJECT_LOCATION/web/style"
		WEBPACK='yes'
		TEST_JAVASCRIPT='no'
		JAVASCRIPT_FILES_TO_TEST=""
		COMPILE_UNITS='no'
		UNITS_LOCATION=""
		RESTART_SERVICE_AFTER_SYNC='no'
		SERVICE_NAME=('')
		FRONTEND_SYNC_LIST=("config" "src" "web" "package.json" "webpack.config.js" ".babelrc")
		WHOLE_SYNC=("config" "src" "web" "package.json" "webpack.config.js" ".babelrc")
		AUTOMATED_TESTING='no'
	;;
	portal|PORTAL)
		PROJECT='portal'
		PRODUCTION_SERVERS=(heppner.soda.sh)
		TEST_SERVERS=(hugh.soda.sh)
		EXPERIMENTAL_SERVERS=(simmons.soda.sh)
		PROJECT_LOCATION="/home/$USER/winterwell/adserver"
		TARGET_DIRECTORY='/home/winterwell/as.good-loop.com'
		IMAGE_OPTIMISE='no'
		CONVERT_LESS='yes'
		LESS_FILES_LOCATION="$PROJECT_LOCATION/src/style"
		CSS_OUTPUT_LOCATION="$PROJECT_LOCATION/web-portal/style"
		WEBPACK='yes'
		TEST_JAVASCRIPT='no'
		COMPILE_UNITS='no'
		RESTART_SERVICE_AFTER_SYNC='yes'
		SERVICE_NAME=('portalmain')
		FRONTEND_SYNC_LIST=("adunit" "server" "web" "web-portal" "src" "web-portal" "package.json" "webpack.config.js" ".babelrc")
		BACKEND_SYNC_LIST=("lib")
		WHOLE_SYNC=("adunit" "server" "web" "web-portal" "src" "web-portal" "package.json" "webpack.config.js" ".babelrc" "lib")
		PRESERVE=("web-as/uploads")
		AUTOMATED_TESTING='yes'
		POST_PUBLISHING_TASK='yes'
	;;
	profiler|PROFILER)
		PROJECT='profiler'
		PRODUCTION_SERVERS=('gl-es-03.good-loop.com')
		TEST_SERVERS=('hugh.soda.sh')
		PROJECT_LOCATION="/home/$USER/winterwell/code/profiler"
		TARGET_DIRECTORY='/home/winterwell/profiler'
		IMAGE_OPTIMISE='no'
		CONVERT_LESS='no'
		WEBPACK='yes'
		TEST_JAVASCRIPT='no'
		COMPILE_UNITS='no'
		RESTART_SERVICE_AFTER_SYNC='yes'
		SERVICE_NAME=('profilermain')
		FRONTEND_SYNC_LIST=("config" "formunit" "src" "web" "package.json" "webpack.config.js")
		BACKEND_SYNC_LIST=("lib")
		WHOLE_SYNC=("config" "formunit" "src" "web" "package.json" "webpack.config.js" "lib")
	;;
	sogive|SOGIVE|sogive-app|SOGIVE-APP)
		PROJECT='sogive-app'
		PRODUCTION_SERVERS=(heppner.soda.sh)
		TEST_SERVERS=(hugh.soda.sh)
		PROJECT_LOCATION="/home/$USER/winterwell/sogive-app"
		TARGET_DIRECTORY='/home/winterwell/sogive-app'
		IMAGE_OPTIMISE='no'
		CONVERT_LESS='yes'
		LESS_FILES_LOCATION="$PROJECT_LOCATION/src/style"
		LESS_FILES=("$LESS_FILES_LOCATION/main.less" "$LESS_FILES_LOCATION/print.less")
		CSS_OUTPUT_LOCATION="$PROJECT_LOCATION/web/style"
		WEBPACK='yes'
		TEST_JAVASCRIPT='no'
		COMPILE_UNITS='no'
		RESTART_SERVICE_AFTER_SYNC='yes'
		SERVICE_NAME=('sogiveapp')
		FRONTEND_SYNC_LIST=("server" "src" "web" "package.json" "webpack.config.js" ".babelrc")
		BACKEND_SYNC_LIST=("data" "lib")
		WHOLE_SYNC=("server" "src" "web" "package.json" "webpack.config.js" ".babelrc" "data" "lib")
		PRESERVE=("web/uploads")
		AUTOMATED_TESTING='yes'
	;;
	youagain|YOUAGAIN)
		PROJECT='youagain'
		PRODUCTION_SERVERS=(bester.soda.sh)
		TEST_SERVERS=(hugh.soda.sh)
		PROJECT_LOCATION="/home/$USER/winterwell/code/youagain-server"
		TARGET_DIRECTORY='/home/winterwell/youagain'
		IMAGE_OPTIMISE='no'
		CONVERT_LESS='no'
		WEBPACK='yes'
		TEST_JAVASCRIPT='no'
		COMPILE_UNITS='no'
		RESTART_SERVICE_AFTER_SYNC='yes'
		SERVICE_NAME=('youagain')
		PRESERVE=("config/youagain.RSAKeyPair.xml")
		FRONTEND_SYNC_LIST=("config" "web" "src" "package.json" "webpack.config.js")
		BACKEND_SYNC_LIST=("lib")
		WHOLE_SYNC=("config" "web" "src" "package.json" "webpack.config.js" "lib")
	;;
	help|HELP)
		printf "\n$VERSION\n\n$USAGE\n"
		exit 0
	;;
	v|V|version|VERSION)
		printf "\n$VERSION\n"
		exit 0
	;;
	*)
		printf "\nThe project that you specified, $1 , is not currently supported by the\nproject-publisher.sh script, or, you mis-typed it. \n$USAGE"
		exit 0
	;;
esac


####################
### Section 02: Get the type of publish. Test or Production or Local
####################
case $2 in
	experiment|EXPERIMENT)
		TYPE_OF_PUBLISH='experimental'
		TARGETS=${EXPERIMENTAL_SERVERS[@]}
		if [[ $EXPERIMENTAL_SERVERS = '' ]]; then
			printf "\n The project, $PROJECT , has no experimental servers."
			exit 0
		fi
	;;
	test|TEST)
		TYPE_OF_PUBLISH='test'
		TARGETS=${TEST_SERVERS[@]}
		if [[ $TEST_SERVERS = '' ]]; then
			printf "\n The project, $PROJECT , has no test servers."
			exit 0
		fi
	;;
	production|PRODUCTION)
		TYPE_OF_PUBLISH='production'
		TARGETS=${PRODUCTION_SERVERS[@]}
	;;
	local|LOCAL|localhost|LOCALHOST)
		TYPE_OF_PUBLISH='local'
		TARGETS='localhost'
		printf "\nLocalhost publishes do not require this portion of the script to run"
		exit 0
	;;
	*)
		if [[ $2 = '' ]]; then
			printf "\n$USAGE"
			exit 0
		else
			printf "\nYour second argument of, $2 , is either invalid, or not supported by this script\n$USAGE"
			exit 0
		fi
	;;
esac

######################
### Section 2.5: Insane Subsection in which $PROJECT_LOCATION can get re-mapped if this script is run by the teamcity server
######################
case $(printf $HOSTNAME) in
	sandrock)
		case $PROJECT in
			datalogger)
				PROJECT_LOCATION='/home/winterwell/TeamCity/buildAgent/work/c7a16811424bee11/winterwell.datalog'
			;;
		esac
	;;
esac

#####################
### Section 03: Allow for Frontend/Backend/Whole Publishing only
#####################
case $3 in
	frontend|FRONTEND)
		SPECIFIC_PUBLISH_GOAL='frontend'
		LIMITED_PUBLISH='yes'
		SYNC_LIST=${FRONTEND_SYNC_LIST[@]}
	;;
	backend|BACKEND)
		SPECIFIC_PUBLISH_GOAL='backend'
		LIMITED_PUBLISH='yes'
		SYNC_LIST=${BACKEND_SYNC_LIST[]}
	;;
	everything|EVERYTHING)
		SPECIFIC_PUBLISH_GOAL='everything'
		LIMITED_PUBLISH='no'
		SYNC_LIST=${WHOLE_SYNC[@]}
	;;
esac


#####################
### Section 04: Allow skipping of automated testing
#####################
case $4 in
	notests|NOTESTS)
		SKIP_TESTS='yes'
	;;
	*)
		printf "\nYour fourth argument either needs to be 'notests' or nothing at all.\n"
		# exit 0
	;;
esac

#####################
### Section 04: Create the list of target servers, and create the list of excluded items that should be preserved
#####################
function create_target_list {
	if [[ -f /tmp/target.list.txt ]]; then
		rm /tmp/target.list.txt
	fi
	printf '%s\n' ${TARGETS[@]} >> /tmp/target.list.txt

	if [[ -f /tmp/exclude.list.txt ]]; then
		rm /tmp/exclude.list.txt
	fi
	printf '%s\n' ${PRESERVE[@]} >> /tmp/exclude.list.txt
}


#####################
### Section 05: Define the Image Optimisation Function
#####################
function image_optimisation {
	# Check to see if this function is needed
	if [[ $IMAGE_OPTIMISE = 'yes' ]]; then
		# check for dependencies
		GOTOPTIPNG=$(which optipng)
		GOTJPEGOPTIM=$(which jpegoptim)
		if [[ $GOTOPTIPNG = '' ]]; then
			printf "\nThis script tried to find your installation of optipng on your system, and couldn't find it.\n"
			printf "\nInstall optipng with 'sudo apt-get --yes install optipng'\n"
			printf "\n....exiting...\n"
			exit 2
		fi
		if [[ $GOTJPEGOPTIM = '' ]]; then
			printf "\nThis script tried to find your installation of jpegoptim on your system, and couldn't find it.\n"
			printf "\nInstall jpegoptim with 'sudo apt-get --yes install jpegoptim'\n"
			printf "\n...exiting...\n"
			exit 2
		fi
		# check to see if the imagedirectory was specified
		if [[ $IMAGEDIRECTORY = '' ]]; then
			printf "\nYou must adjust this script and add the directory where your image files are kept if you want them to be optimised\n"
			printf "\n...exiting...\n"
			exit 2
		fi
		# check to see if there are existing array text files
		EXISTINGPNGARRAYTXT=$(find $IMAGEDIRECTORY/ -type f -name 'pngarray.txt')
		GOTPNGS=$(find $IMAGEDIRECTORY/ -type f -name '*.png')
		if [[ $EXISTINGPNGARRAYTXT = '' ]]; then
			if [[ $GOTPNGS = '' ]]; then
				printf "\nNo PNG files found in your specified image directory $IMAGEDIRECTORY\n"
				printf "\nAnd no pngarray text file found either, a blank file will be created for future runs of this script.\n"
				touch $IMAGEDIRECTORY/pngarray.txt
				OPTIMISEPNGSTASK='no'
			else
				printf "\nYou have PNG files, but no pngarray.txt file yet.  All PNG files will now be optimised as if this is your first run.\n"
				touch $IMAGEDIRECTORY/pngarray.txt
				OPTIMISEPNGSTASK='yes'
			fi
		elif [[ $GOTPNGS = '' ]]; then
			printf "\nNo PNG files found to optimise\n"
			OPTIMISEPNGSTASK='no'
		else
			printf "\nYou don't yet have a pngarray.txt file in your specified image directory.  This script will create one now for future runs.\n"
			printf "\nAll PNG files will now be optimised and recorded so that they won't be optimised again in the future.\n"
			touch $IMAGEDIRECTORY/pngarray.txt
			OPTIMISEPNGSTASK='yes'
		fi
		EXISTINGJPGARRAYTXT=$(find $IMAGEDIRECTORY/ -type f -name 'jpgarray.txt')
		GOTJPGS=$(find $IMAGEDIRECTORY/ -type f -name '*.jpg')
		if [[ $EXISTINGJPGARRAYTXT = '' ]]; then
			if [[ $GOTJPGS = '' ]]; then
				printf "\nNo JPG files found in your specified image directory $IMAGEDIRECTORY\n"
				printf "\nAnd no jpgarray.txt file found either, a blank file will be created for future runs of this script\n"
				touch $IMAGEDIRECTORY/jpgarray.txt
				OPTIMISEJPGSTASK='no'
			else
				printf "\nYou have JPG files, but no jpgarray.txt file yet.  All JPG files will now be optimised as if this is your first run.\n"
				touch $IMAGEDIRECTORY/jpgarray.txt
				OPTIMISEJPGSTASK='yes'
			fi
		elif [[ $GOTJPGS = '' ]]; then
			printf "\nNo JPG files found to optimise\n"
			OPTIMISEJPGSTASK='no'
		else
			printf "\nYou don't yet have a jpgarray.txt file in your specified image directory. This script will create one now for future runs.\n"
			printf "\nAll JPG files will now be optimised and recorded so that they won't be optimised again in the future.\n"
			touch $IMAGEDIRECTORY/jpgarray.txt
			OPTIMISEJPGSTASK='yes'
		fi
		EXISTINGJPEGARRAYTXT=$(find $IMAGEDIRECTORY/ -type -f -name 'jpegarray.txt')
		GOTJPEGS=$(find $IMAGEDIRECTORY/ -type f -name '*.jpeg')
		if [[ $EXISTINGJPEGARRAYTXT = '' ]]; then
			if [[ $GOTJPEGS = '' ]]; then
				printf "\nNo JPEG files found in your specifiec image directory $IMAGEDIRECTORY\n"
				printf "\nAnd no jpegarray.txt file found either, a blank file will be created for future runs of this script\n"
				touch $IMAGEDIRECTORY/jpegarray.txt
				OPTIMISEJPEGSTASK='no'
			else
				printf "\nYou have JPEG files, but not jpegarray.txt file yet.  All JPEG files will now be optimised as if this is your first run.\n"
				touch $IMAGEDIRECTORY/jpegarray.txt
				OPTIMISEJPEGSTASK='yes'
			fi
		elif [[ $GOTJPEGS = '' ]]; then
			printf "\nNo JPEG files found to optimise\n"
			OPTIMISEJPEGSTASK='no'
		else
			printf "\nYou don't yet have a jpegarray.txt file in your specified image directory. This script will create one now for future runs.\n"
			printf "\nAll JPEG files will not be optimised and recorded so that they won't be optimised again in the future.\n"
			touch $IMAGEDIRECTORY/jpegarray.txt
			OPTIMISEJPEGSTASK='yes'
		fi

		#check for newarray.txt files to be killed
		GOTNEWPNGARRAYFILE=$(find $IMAGEDIRECTORY/ -type f -name 'newpngarray.txt')
		if [[ $GOTNEWPNGARRAYFILE != '' ]]; then
			rm $IMAGEDIRECTORY/newpngarray.txt
		fi
		GOTNEWJPGARRAYFILE=$(find $IMAGEDIRECTORY/ -type f -name 'newjpgarray.txt')
		if [[ $GOTNEWJPGARRAYFILE != '' ]]; then
			rm $IMAGEDIRECTORY/newjpgarray.txt
		fi
		GOTNEWJPEGARRAYFILE=$(find $IMAGEDIRECTORY/ -type f -name 'newjpegarray.txt')
		if [[ $GOTNEWJPEGARRAYFILE != '' ]]; then
			rm $IMAGEDIRECTORY/newjpegarray.txt
		fi

		#Perform the optimisations and update the array files

		## For PNGs
		if [[ $OPTIMISEPNGSTASK = 'yes' ]]; then
			mapfile -t OPTIMISEDPNGS < $IMAGEDIRECTORY/pngarray.txt
			for file in $(find $IMAGEDIRECTORY/ -type f -name '*.png'); do
				PNGMD5OUTPUT=$(md5sum $file)
				printf '%s\n' "$PNGMD5OUTPUT" >> $IMAGEDIRECTORY/newpngarray.txt
			done
			mapfile -t PNGARRAY < $IMAGEDIRECTORY/newpngarray.txt
			UNIQUEPNGS=$(diff $IMAGEDIRECTORY/pngarray.txt $IMAGEDIRECTORY/newpngarray.txt | grep ">" | awk '{print $3}')
			# I want to build an array [list] of PNG files that are new to the project [and therefore un-optimised].
			# I define my array as, the DIFFerence between the old/pre-existing pngarray.txt file and the newpngarray.txt file
			# I then use grep to only give me lines where there are new PNG files listed, and I use awk to give me clean filenames.
			if [[ ${UNIQUEPNGS[*]} = '' ]]; then
				printf "\nNo new PNG files to optimise\n"
			else
				for png in ${UNIQUEPNGS[*]}; do
					optipng $png
				done
			fi
			rm $IMAGEDIRECTORY/pngarray.txt
			touch $IMAGEDIRECTORY/pngarray.txt
			for file in $(find $IMAGEDIRECTORY/ -type f -name '*.png'); do
				PNGMD5OUTPUT=$(md5sum $file)
				printf '%s\n' "$PNGMD5OUTPUT" >> $IMAGEDIRECTORY/pngarray.txt
			done
		fi

		## For JPGs
		if [[ $OPTIMISEJPGSTASK = 'yes' ]]; then
			mapfile -t OPTIMISEDJPGS < $IMAGEDIRECTORY/jpgarray.txt
			for file in $(find $IMAGEDIRECTORY/ -type f -name '*.jpg'); do
				JPGMD5OUTPUT=$(md5sum $file)
				printf '%s\n' "$JPGMD5OUTPUT" >> $IMAGEDIRECTORY/newjpgarray.txt
			done
			mapfile -t JPGARRAY < $IMAGEDIRECTORY/newjpgarray.txt
			UNIQUEJPGS=$(diff $IMAGEDIRECTORY/jpgarray.txt $IMAGEDIRECTORY/newjpgarray.txt | grep ">" | awk '{print $3}')
			if [[ ${UNIQUEJPGS[*]} = '' ]]; then
				printf "\nNo new JPG files to optimise\n"
			else
				for jpg in ${UNIQUEJPGS[*]}; do
					jpegoptim $jpg
				done
			fi
			rm $IMAGEDIRECTORY/jpgarray.txt
			touch $IMAGEDIRECTORY/jpgarray.txt
			for file in $(find $IMAGEDIRECTORY/ -type f -name '*.jpg'); do
				JPGMD5OUTPUT=$(md5sum $file)
				printf '%s\n' "$JPGMD5OUTPUT" >> $IMAGEDIRECTORY/jpgarray.txt
			done
		fi

		## For JPEGs
		if [[ $OPTIMISEJPEGSTASK = 'yes' ]]; then
			mapfile -t OPTIMISEDJPEGS < $IMAGEDIRECTORY/jpegarray.txt
			for file in $(find $IMAGEDIRECTORY/ -type f -name '*.jpeg'); do
				JPEGMD5OUTPUT=$(md5sum $file)
				printf '%s\n' "$JPEGMD5OUTPUT" >> $IMAGEDIRECTORY/newjpegarray.txt
			done
			mapfile -t JPEGARRAY < $IMAGEDIRECTORY/newjpegarray.txt
			UNIQUEJPEGS=$(diff $IMAGEDIRECTORY/jpegarray.txt $IMAGEDIRECTORY/newjpegarray.txt | grep ">" | awk '{print $3}')
			if [[ ${UNIQUEJPEGS[*]} = '' ]]; then
				printf "No new JPEG files to optimise"
			else
				for jpeg in ${UNIQUEJPEGS[*]}; do
					jpegoptim $jpeg
				done
			fi
			rm $IMAGEDIRECTORY/jpegarray.txt
			touch $IMAGEDIRECTORY/jpegarray.txt
			for file in $(find $IMAGEDIRECTORY/ -type f -name '*.jpeg'); do
				JPEGMD5OUTPUT=$(md5sum $file)
				printf '%s\n' "$JPEGMD5OUTPUT" >> $IMAGEDIRECTORY/jpegarray.txt
			done
		fi
	fi
}


##################################
### Section 06: Define the Webpack Function
##################################
function webpack {
	if [[ $WEBPACK = yes ]]; then
		printf "\nGetting NPM Dependencies ..."
		$PSSH "cd $TARGET_DIRECTORY && npm i"
		printf "\nWebpacking ..."
		case $PROJECT in
			portal)
				$PSSH "cd $TARGET_DIRECTORY && npm run build"
			;;
			*)
				$PSSH "cd $TARGET_DIRECTORY && webpack --progress -p"
			;;
		esac
	fi
}


##################################
### Section 07: Define the Functions that can start and stop a process on the server
##################################
function stop_proc {
	if [[ $RESTART_SERVICE_AFTER_SYNC = 'yes' ]]; then
		for service in ${SERVICE_NAME[@]}; do
			printf "\nStopping $SERVICE_NAME on $TARGETS\n"
			$PSSH "sudo service $SERVICE_NAME stop"
		done
	fi
}

function start_proc {
	if [[ $RESTART_SERVICE_AFTER_SYNC = 'yes' ]]; then
		for service in ${SERVICE_NAME[@]}; do
			printf "\nStarting $SERVICE_NAME on $TARGETS\n"
			$PSSH "sudo service $SERVICE_NAME start"
		done
	fi
}


##################################
### Section 08: Defining the 'Convert Less Files' function
##################################
function convert_less_files {
	if [[ $CONVERT_LESS = 'yes' ]]; then
		if [[ $LESS_FILES_LOCATION = "" ]]; then
			printf "\nYour specified project $PROJECT , has the parameter 'CONVERT_LESS' set to 'yes', but no input directory has been set\nExiting process\n"
			exit 0
		elif
			[[ $CSS_OUTPUT_LOCATION = "" ]]; then
			printf "\nYour specified project $PROJECT , has the parameter 'CONVERT_LESS' set to 'yes', and an input directory IS specified,\nbut no output directory has been specified\nExiting process\n"
			exit 0
		fi
		case $PROJECT in
			adserver)
				lessc $LESS_FILES_LOCATION $CSS_OUTPUT_LOCATION
			;;
			*)
				if [ ! "$LESS_FILES" ]; then 
					LESS_FILES=$(find $LESS_FILES_LOCATION -type f -iname "*.less")
				fi
				for file in ${LESS_FILES[@]}; do
					printf "\nconverting $file"
					lessc "$file" "${file%.less}.css"
				done
				mv $LESS_FILES_LOCATION/*.css $CSS_OUTPUT_LOCATION/
			;;
		esac
	fi
}


###################################
### Section 09: Defining the Jar Syncing Function
###################################
# @DA - Why do we move jars from lib to tmp-lib, nuking each in turn?? Thanks, ^DW Dec 2018
# @DW - This script does not, nor has it ever, moved anything from lib to tmp-lib.  ^DA Jan 2019
function move_items_to_lib {
	if [ -d $PROJECT_LOCATION/lib ]; then
		rm -rf $PROJECT_LOCATION/lib/*		
	else
		mkdir $PROJECT_LOCATION/lib
	fi
	cp $PROJECT_LOCATION/tmp-lib/* $PROJECT_LOCATION/lib/
}


#########################################
### Section 10: Sync the Config Files
#########################################
function sync_configs {
	GIT_SHORTHAND="git --git-dir=/home/$USER/winterwell/logins/.git/ --work-tree=/home/$USER/winterwell/logins"
	case $PROJECT in
		adserver|portal)
			printf "\nEnsuring that your Logins are up-to-date...\n"
			$GIT_SHORTHAND gc --prune=now
			$GIT_SHORTHAND pull origin master
			$GIT_SHORTHAND reset --hard FETCH_HEAD
			for config in $(find /home/$USER/winterwell/logins/good-loop/adserver/ -iname "*"); do
				printf "\nsyncing file : $config\n"
				$PSYNC $config $TARGET_DIRECTORY/config/
			done
			printf "\nRenaming dboptions.properties file for specific servers\n"
#			$PSSH "mv $TARGET_DIRECTORY/config/$HOSTNAME.dboptions.properties $TARGET_DIRECTORY/config/dboptions.properties"
			for server in ${TARGETS[@]}; do
				ssh winterwell@$server "mv $TARGET_DIRECTORY/config/$server.dboptions.properties $TARGET_DIRECTORY/config/dboptions.properties"
			done
		;;
		sogive-app)
			printf "\nEnsuring that your Logins are up-to-date...\n"
			$GIT_SHORTHAND gc --prune=now
			$GIT_SHORTHAND pull origin master
			$GIT_SHORTHAND reset --hard FETCH_HEAD
			printf "\nSyncing Config Files ...\n"
			for config in $(find /home/$USER/winterwell/logins/sogive-app/ -iname "*.properties"); do
				printf "\nSyncing $config file ...\n"
				$PSYNC $config $TARGET_DIRECTORY/config/
			done
			case $TYPE_OF_PUBLISH in
			production)
				printf "\nRenaming production config file\n"
				$PSSH 'mv /home/winterwell/sogive-app/config/production.sogive.properties /home/winterwell/sogive-app/config/sogive.properties'
			;;
			test)
				printf "\nRenaming production config file\n"
				$PSSH 'mv /home/winterwell/sogive-app/config/test.sogive.properties /home/winterwell/sogive-app/config/sogive.properties'
			;;
			esac
		;;
	esac
}


##########################################
### Section 11: test the JS files for syntax errors
##########################################
function test_js {
	if [[ $TEST_JAVASCRIPT = 'yes' ]]; then
		printf "\nTesting the JS files for syntax errors...\n"
		case $PROJECT in
			adserver)
				JS_FILE_LIST=$(find $JAVASCRIPT_FILES_TO_TEST -mindepth 1 \( -name "*.js" ! -name "babeled*" ! -name "all*" \) -type f)
				for jsfile in ${JS_FILE_LIST[*]}; do
					TESTINGVJSFILE=$(jshint --verbose $jsfile | grep -E E[0-9]+.$)
					if [[ $TESTINGVJSFILE = "" ]]; then
						printf "\n$jsfile is OK!\n"
					else
						printf "\n$jsfile has syntax errors.\n"
						printf "\nexiting publishing process...\n"
						exit 3
					fi
				done
			;;
			*)
				printf "\n Unknown Project specified.  I don't know where the JS files are, the ones that need to be tested"
				exit 0
			;;
		esac
	fi
}


#########################################
### Section 12: Compile the Variants
#########################################
# No longer a thing - since adunit shifted to preact, webpack + one invocation of lessc does everything
#function compile_variants {}


##########################################
### Section 13: Defining the Sync
##########################################
function sync_project {
	for item in ${SYNC_LIST[@]}; do
		if [[ $item = 'lib' ]]; then
			move_items_to_lib
			printf "\nSyncing JAR Files ...\n"
			cd $PROJECT_LOCATION && $PSYNC $item $TARGET_DIRECTORY
		elif
			[[ $item = 'node_modules' ]]; then
			continue
		else
			printf "\nSyncing $item ...\n"
			cd $PROJECT_LOCATION && $PSYNC $item $TARGET_DIRECTORY
		fi
	done
}


##########################################
### Section 14: Automated Testing
##########################################
function run_automated_tests {
	if [[ $SKIP_TESTS = 'yes' ]]; then
		exit 1
	elif [[ $AUTOMATED_TESTING = 'yes' ]]; then
		printf "\nRunning Automated Tests for $PROJECTNAME on the $2 site"
		case $PROJECT in
			sogive-app)
				cd $PROJECT_LOCATION/puppeteer-tests
				bash run-tests.sh $TYPE_OF_PUBLISH
			;;
			portal)
				cd $PROJECT_LOCATION/puppeteer-tests
				bash run-tests.sh $TYPE_OF_PUBLISH
			;;
		esac
	fi
}


##########################################
### Section 15: Cleaning the tmp-lib directory for safety (future publishes are safer if all JARs are new and fresh)
##########################################
function clean_tmp_lib {
	if [[ -d $PROJECT_LOCATION/tmp-lib ]]; then
		printf "\nCleaning tmp-lib directory\n"
		rm -rf $PROJECT_LOCATION/tmp-lib/*
	fi
}


###########################################
### Section 16: Defining the process used in order to preserve files/directories before a destructive sync
###########################################
function preserve_items {
	for item in ${PRESERVE[@]}; do
		printf "\nPreserving $item\n"
		$PSSH "if [[ -d /tmp/$item ]]; then continue; else mkdir -p /tmp/$item; fi"
		$PSSH "cd $TARGET_DIRECTORY && rsync -rRhP $item /tmp"
	done
}

function restore_preserved {
	for item in ${PRESERVE[@]}; do
		printf "\nRestoring $item\n"
		$PSSH "cd /tmp && rsync -rRhP $item $TARGET_DIRECTORY/"
	done
}


###########################################
### Section 17: Defining a function in-which post-publishing-tasks can be run
###########################################

function run_post_publish_tasks {
	if [[ $POST_PUBLISHING_TASK = 'yes' ]]; then
		printf "\nRunning post-publishing tasks\n"
		case $PROJECT in
			portal)
				case $TYPE_OF_PUBLISH in
					test)
						$PSSH "sudo service baose restart"
					;;
					production)
						rsync $PROJECT_LOCATION/lib/* winterwell@gl-es-01.soda.sh:/home/winterwell/as.good-loop.com/lib/
						ssh winterwell@gl-es-03.soda.sh "cp /home/winterwell/as.good-loop.com/config/adserver.properties /home/winterwell/as.good-loop.com/config/batchallocateorphanspendevents.properties"
						ssh winterwell@gl-es-03.soda.sh "sudo service baose restart"
					;;
					experiment)
						$PSSH "sudo service baose restart"
					;;
				esac
			;;
			adserver)
				case $SPECIFIC_PUBLISH_GOAL in
					frontend)
						printf "\n\tGetting NPM Dependencies for the Ad Unit\n"
						$PSSH "cd $TARGET_DIRECTORY/adunit && npm i"
						printf "\n\tWebpacking the Ad Unit\n"
						$PSSH "cd $TARGET_DIRECTORY/adunit && npm run build"
						printf "\n\tConverting LESS for the Ad Unit\n"
						$PSSH "lessc $TARGET_DIRECTORY/adunit/style/base.less $TARGET_DIRECTORY/web-as/unit.css"
					;;
					everything)
						printf "\n\tGetting NPM Dependencies for the Ad Unit\n"
						$PSSH "cd $TARGET_DIRECTORY/adunit && npm i"
						printf "\n\tWebpacking the Ad Unit\n"
						$PSSH "cd $TARGET_DIRECTORY/adunit && npm run build"
						printf "\n\tConverting LESS for the Ad Unit\n"
						$PSSH "lessc $TARGET_DIRECTORY/adunit/style/base.less $TARGET_DIRECTORY/web-as/unit.css"
					;;
					backend)
						printf "\n"
					;;
				esac
			;;
		esac
	fi
}


##########################################
### Section 18: Defining the Function for minifying CSS
##########################################
function minify_css {
	for css in $(find $CSS_OUTPUT_LOCATION -type f -iname "*.css"); do
		mv $css $css.original
		uglifycss $css.original > $css
	done
}

##########################################
### Section 19: Performing the Actual Publish
##########################################
printf "\nCreating Target List\n"
create_target_list
stop_proc
preserve_items
case $SPECIFIC_PUBLISH_GOAL in
	everything)
		image_optimisation
		convert_less_files
		minify_css
		test_js
		#compile_variants
		printf "\nSyncing $PROJECT to $TARGETS\n"
		printf "\nSyncing Configs\n"
		sync_configs
		sync_project
		webpack
	;;
	frontend)
		image_optimisation
		convert_less_files
		minify_css
		test_js
		#compile_variants
		printf "\nSyncing $PROJECT to $TARGETS\n"
		printf "\nSyncing Configs\n"
		sync_configs
		sync_project
		webpack
	;;
	backend)
		sync_project
	;;
esac
restore_preserved
printf "\nPublishing Process has completed\n"
run_post_publish_tasks
start_proc
clean_tmp_lib
run_automated_tests
