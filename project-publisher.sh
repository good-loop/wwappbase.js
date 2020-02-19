#!/bin/bash

VERSION='Version=2.2.1'

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
#	FRONTEND_SYNC_LIST=("adunit" "config" "server" "src" "web-iframe" "web-as" "web-snap" "web-test" "preact-unit" "package.json" "webpack.config.as.js" "webpack.config.js")
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

if [[ $(which jshint) = "" ]]; then
	printf "\nIn order to test the JS files before Babeling, you must have JShint installed on your machine\nInstall jshint with 'sudo npm install -g jshint'"
	exit 1
fi

if [[ $(which uglifycss) = "" ]]; then
	printf "\nIn order to Minify CSS, you need to 'sudo npm install -g uglifycss'\n"
	exit 1
fi


#################
### Preamble: Define Arrays and Variables
#################
SUPPORTED_PROJECTS=('adserver','calstat','datalogger','egbot','media','moneyscript','myloop','portal','profiler','sogive','youagain')
USAGE=$(printf "\n./project-publisher.sh PROJECTNAME TEST/PRODUCTION frontend|backend|everything ?notests\n\nAvailable Projects\n\n\t$SUPPORTED_PROJECTS\n")
#SYNC_LIST=()
DO_NOT_SYNC_LIST='/tmp/do_not_sync_list.txt'

# Batch SSH = bssh
function bssh {
	for server in ${TARGETS[@]}; do
		ssh winterwell@$server $1 &
	wait
	done
}


# Define function to handle rsync error codes and error counts
RSYNC_ERROR_COUNT='0'
function handle_rsync_exit_code {
    case ${PIPESTATUS[0]} in
        0)
        printf "\n\tSuccessfully synced $sync_item to $server\n"
        ;;
        1)
        printf "\n\tRsync reported a Syntax or Usage error when trying to sync $sync_item to $server\n"
        RSYNC_ERROR_COUNT=$((RSYNC_ERROR_COUNT+1))
        ;;
        2)
        printf "\n\tRsync reports that there is a Protocol incompatibility when trying to sync $sync_item to $server\n"
        RSYNC_ERROR_COUNT=$((RSYNC_ERROR_COUNT+1))
        ;;
        3)
        printf "\n\tRsync reports that there were errors while selecting either the input or output files/dir when trying to sync $sync_item to $server\n"
        RSYNC_ERROR_COUNT=$((RSYNC_ERROR_COUNT+1))
        ;;
        4)
        printf "\n\tRsync reports that the requested action was not supported when trying to sync $sync_item to $server\n"
        RSYNC_ERROR_COUNT=$((RSYNC_ERROR_COUNT+1))
        ;;
        5)
        printf "\n\tRsync encountered an error starting the client-server protocol when trying to sync $sync_item to $server\n"
        RSYNC_ERROR_COUNT=$((RSYNC_ERROR_COUNT+1))
        ;;
        6)
        printf "\n\tDaemon unable to append to log-file when trying to sync $sync_item to $server\n"
        RSYNC_ERROR_COUNT=$((RSYNC_ERROR_COUNT+1))
        ;;
        10)
        printf "\n\tRsync reports that there was an error in socket I/O when trying to sync $sync_item to $server\n"
        RSYNC_ERROR_COUNT=$((RSYNC_ERROR_COUNT+1))
        ;;
        11)
        printf "\n\tRsync reports that there was an error in the file's I/O when trying to sync $sync_item to $server\n"
        RSYNC_ERROR_COUNT=$((RSYNC_ERROR_COUNT+1))
        ;;
        12)
        printf "\n\tRsync had an error in the protocol data stream when trying to sync $sync_item to $server\n"
        RSYNC_ERROR_COUNT=$((RSYNC_ERROR_COUNT+1))
        ;;
        13)
        printf "\n\tRsync had and error with program diagnostics when trying to sync $sync_item to $server\n"
        RSYNC_ERROR_COUNT=$((RSYNC_ERROR_COUNT+1))
        ;;
        14)
        printf "\n\tRsync had an error in IPC code when trying to sync $sync_item to $server\n"
        RSYNC_ERROR_COUNT=$((RSYNC_ERROR_COUNT+1))
        ;;
        20)
        printf "\n\tRsync received SIGUSR1 or SIGINT  -- probably from you, or a root user when trying to sync $sync_item to $server\n"
        RSYNC_ERROR_COUNT=$((RSYNC_ERROR_COUNT+1))
        ;;
        21)
        printf "\n\tRsync received some error returned by waitpid() when trying to sync $sync_item to $server\n"
        RSYNC_ERROR_COUNT=$((RSYNC_ERROR_COUNT+1))
        ;;
        22)
        printf "\n\tRsync encountered an error allocating core memory buffers when trying to sync $sync_item to $server\n"
        RSYNC_ERROR_COUNT=$((RSYNC_ERROR_COUNT+1))
        ;;
        23)
        printf "\n\tRsync only could perform a partial transfer because of an unknown error when trying to sync $sync_item to $server\n"
        RSYNC_ERROR_COUNT=$((RSYNC_ERROR_COUNT+1))
        ;;
        24)
        printf "\n\tRsync could only partially transfer some files because the source files/dir changed during transfer when trying to sync $sync_item to $server\n"
        RSYNC_ERROR_COUNT=$((RSYNC_ERROR_COUNT+1))
        ;;
        30)
        printf "\n\tRsync timed-out in data send/receive when trying to sync $sync_item to $server\n"
        RSYNC_ERROR_COUNT=$((RSYNC_ERROR_COUNT+1))
        ;;
        35)
        printf "\n\tRsync timed-out waiting for the daemon to connect when trying to sync $sync_item to $server\n"
        RSYNC_ERROR_COUNT=$((RSYNC_ERROR_COUNT+1))
        ;;
        255)
        printf "\n\tRsync threw out a 255 error, which usually means that you do not have automatic SSH access to $server without the need for human intervention,\n\t\tPlease manually SSH into $server and ensure that you can do so without any problem\n"
        RSYNC_ERROR_COUNT=$((RSYNC_ERROR_COUNT+1))
    esac
}


# Batch Rsync = brsync
function brsync {
	for sync_item in ${SYNC_LIST[@]}; do
		for server in ${TARGETS[@]}; do
			printf "\nSyncing $sync_item to $server\n"
			RSYNC_CMD="rsync -rL --exclude 'node_modules' --exclude '*.java' --delete-before $sync_item winterwell@$server:/$TARGET_DIRECTORY/ | handle_rsync_exit_code >> /tmp/$SYNC_LOG_OUTPUT &"
			$RSYNC_CMD
		done
	wait
	done
}


# for sync_item in ${SYNC_LIST[@]}; do
# something that prints all of the sync_items including the contents of directories;
# match those filenames to entries found in the $SYNC_LOG_OUTPUT file.
# Print where that file went to (which server[s]), and/or if it failed.
# Use that information to create a summary of the sync.
# print somthing like, "160 files to be sync'ed || 160 files sync'ed successfully to 4 Targets"
function generate_sync_results {
	# Preamble, clear out any old sync-list text files
	SYNC_LIST_TEXT='/tmp/sync.list.txt'
	if [ f = $SYNC_LIST_TEXT ]; then
		rm $SYNC_LIST_TEXT
		touch $SYNC_LIST_TEXT
	fi
	#Job 01, make a list of ALL of the files that were explicitly told to be sync'ed, make this list via an rsync dry-run
	for sync_item in ${SYNC_LIST[@]}; do
		for server in ${TARGETS[@]}; do
			rsync -rL --exclude 'node_modules' --exclude "*.java" --delete-before --dry-run $sync_item winterwell@$server:/$TARGET_DIRECTORY >> $SYNC_LIST_TEXT
		done
	done
	#Job 02, attempt to find matches between the output of the dry-run, and the output of the actual sync.  If a match is found, then that item is confirmed as sync'ed successfully.
	mapfile -t SYNC_LIST_TEXT_ARRAY < $SYNC_LIST_TEXT
	mapfile -t SYNC_LOG_ARRAY < /tmp/$SYNC_LOG_OUTPUT
	
}
# 
#
#
#

# Analyze the results of the brsync process and print a summary of errors if necessary:
function analyze_sync_results {
	if [[ $RSYNC_ERROR_COUNT -ne 0 ]]; then
    	printf "\nThere were some errors during the syncing process:\n"
    	cat $SYNC_LOG_OUTPUT | grep -iv "success"
	fi
}


##################
### Preamble: Check that this script is executed correctly
##################
if [[ $1 = '' ]]; then
		printf "$USAGE"
	exit 0
fi


##################
### Preamble : clear out old sync log
##################
SYNC_LOG_OUTPUT='/tmp/sync_log_output.txt'
if [ -f $SYNC_LOG_OUTPUT ]; then
    rm $SYNC_LOG_OUTPUT
    touch $SYNC_LOG_OUTPUT
else
	touch $SYNC_LOG_OUTPUT
fi


#################
### Section 01: Get the name of the project and handle invalid first arguments
#################
case $1 in
	adserver|ADSERVER)
		PROJECT='adserver'
		PRODUCTION_SERVERS=(gl-es-01.soda.sh gl-es-02.soda.sh adnode-01.soda.sh adnode-02.soda.sh)
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
		FRONTEND_SYNC_LIST=("adunit" "server" "src" "web-apps" "web-as" "web-test" "preact-unit" "package.json" "webpack.config.as.js" "webpack.config.js" )
		BACKEND_SYNC_LIST=("lib")
		WHOLE_SYNC=("adunit" "server" "src" "web-apps" "web-as" "web-test" "preact-unit" "package.json" "webpack.config.as.js" "webpack.config.js" "lib")
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
		FRONTEND_SYNC_LIST=("config" "src" "web" "package.json" "webpack.config.js")
		BACKEND_SYNC_LIST=("lib")
		WHOLE_SYNC=("config" "src" "web" "package.json" "webpack.config.js" "lib")
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
		FRONTEND_SYNC_LIST=("config" "doc" "src" "test" "web" "package.json" "webpack.config.js")
		BACKEND_SYNC_LIST=("data" "data-collection" "lib" "input.txt")
		WHOLE_SYNC=("config" "doc" "src" "test" "web" "package.json" "webpack.config.js" "data" "data-collection" "lib" "input.txt")
		# Use "lib" instead of "tmp-lib" for syncing your JAR files
		#PRESERVE=("web-as/uploads")
		AUTOMATED_TESTING='no'  # If this is set to 'yes', then you must ammend Section 13 in order to specify how to kick-off the testing
		;;
	lg|LG|datalog|DATALOG|datalogger|DATALOGGER)
		PROJECT='datalogger'
		PRODUCTION_SERVERS=(gl-es-03.soda.sh gl-es-04.soda.sh gl-es-05.soda.sh datalognode-01.good-loop.com)
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
		FRONTEND_SYNC_LIST=("config" "src" "web" "package.json" "ssl.gl-es-03.good-loop.com.conf" "ssl.gl-es-03.good-loop.com.params.conf" "ssl.gl-es-04.good-loop.com.conf" "ssl.gl-es-04.good-loop.com.params.conf" "ssl.gl-es-05.good-loop.com.conf" "ssl.gl-es-05.good-loop.com.params.conf" "webpack.config.js")
		BACKEND_SYNC_LIST=("lib" "winterwell.datalog.jar")
		WHOLE_SYNC=("config" "src" "web" "package.json" "ssl.gl-es-03.good-loop.com.conf" "ssl.gl-es-03.good-loop.com.params.conf" "ssl.gl-es-04.good-loop.com.conf" "ssl.gl-es-04.good-loop.com.params.conf" "ssl.gl-es-05.good-loop.com.conf" "ssl.gl-es-05.good-loop.com.params.conf" "webpack.config.js" "lib" "winterwell.datalog.jar")
		;;
	moneyscript|MONEYSCRIPT)
		PROJECT='moneyscript'
		PRODUCTION_SERVERS=('robinson.soda.sh')
		TEST_SERVERS=('hugh.soda.sh')
		PROJECT_LOCATION="/home/$USER/winterwell/code/moneyscript"
		TARGET_DIRECTORY='/home/winterwell/moneyscript'
		IMAGE_OPTIMISE='no'
		# 	IMAGEDIRECTORY="" #Only needed if 'IMAGE_OPTIMISE' is set to 'yes'
		CONVERT_LESS='yes'
		LESS_FILES_LOCATION="$PROJECT_LOCATION/src/style" #Only needed if 'CONVERT_LESS' is set to 'yes'
		CSS_OUTPUT_LOCATION="$PROJECT_LOCATION/web/style" #Only needed if 'CONVERT_LESS' is set to 'yes'
		WEBPACK='yes'
		TEST_JAVASCRIPT='no'
		# 	JAVASCRIPT_FILES_TO_TEST="$PROJECT_LOCATION/adunit/variants/" #Only needed if 'TEST_JAVASCRIPT' is set to 'yes', and you must ammend Section 10 to accomodate for how to find and process your JS files
		# 	COMPILE_UNITS='no'
		# 	UNITS_LOCATION="$PROJECT_LOCATION/adunit/variants/" #Only needed it 'COMPILE_UNITS' is set to 'yes', and you must ammend Section 11 to accomodate for how to find and process your unit files
		RESTART_SERVICE_AFTER_SYNC='yes'
		SERVICE_NAME='moneyscript'
		FRONTEND_SYNC_LIST=("config" "src" "test" "web" "package.json" "webpack.config.dev.js" "webpack.config.js")
		BACKEND_SYNC_LIST=("lib")
		#	# Use "lib" instead of "tmp-lib" for syncing your JAR files
		WHOLE_SYNC=("config" "src" "test" "web" "package.json" "webpack.config.dev.js" "webpack.config.js" "lib")
		# 	PRESERVE=("web-as/uploads")
		POST_PUBLISHING_TASK='no' # If this is set to 'yes', then you must ammend section 16 in order to specify how to handle the tasks
		AUTOMATED_TESTING='no'  # If this is set to 'yes', then you must ammend Section 13 in order to specify how to kick-off the testing
	;;
	media|MEDIA)
		PROJECT='media'
		PRODUCTION_SERVERS=(medianode-01.good-loop.com medianode-02.good-loop.com medianode-03.good-loop.com)
		TEST_SERVERS=('hugh.soda.sh')
		PROJECT_LOCATION="/home/$USER/winterwell/media"
		TARGET_DIRECTORY='/home/winterwell/media.good-loop.com'
		IMAGE_OPTIMISE='no'
		IMAGEDIRECTORY="" #Only needed if 'IMAGE_OPTIMISE' is set to 'yes'
		CONVERT_LESS='no'
		LESS_FILES_LOCATION="" #Only needed if 'CONVERT_LESS' is set to 'yes'
		CSS_OUTPUT_LOCATION="" #Only needed if 'CONVERT_LESS' is set to 'yes'
		WEBPACK='no'
		TEST_JAVASCRIPT='no'
		JAVASCRIPT_FILES_TO_TEST="$PROJECT_LOCATION/adunit/variants/" #Only needed if 'TEST_JAVASCRIPT' is set to 'yes', and you must ammend Section 10 to accomodate for how to find and process your JS files
		COMPILE_UNITS='no'
		UNITS_LOCATION="$PROJECT_LOCATION/adunit/variants/" #Only needed it 'COMPILE_UNITS' is set to 'yes', and you must ammend Section 11 to accomodate for how to find and process your unit files
		RESTART_SERVICE_AFTER_SYNC='yes'
		SERVICE_NAME='mediaserver'
		FRONTEND_SYNC_LIST=("config" "src")
		BACKEND_SYNC_LIST=("lib")
		# Use "lib" instead of "tmp-lib" for syncing your JAR files
		WHOLE_SYNC=("config" "lib" "src")
		#PRESERVE=()
		POST_PUBLISHING_TASK='no' # If this is set to 'yes', then you must ammend section 16 in order to specify how to handle the tasks
		AUTOMATED_TESTING='no'  # If this is set to 'yes', then you must ammend Section 13 in order to specify how to kick-off the testing
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
		FRONTEND_SYNC_LIST=("config" "src" "web" "package.json" "webpack.config.js")
		WHOLE_SYNC=("config" "src" "web" "package.json" "webpack.config.js")
		AUTOMATED_TESTING='no'
	;;
	portal|PORTAL)
		PROJECT='portal'
		PRODUCTION_SERVERS=('heppner.soda.sh')
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
		FRONTEND_SYNC_LIST=("adunit" "server" "web" "web-portal" "src" "web-portal" "package.json" "webpack.config.js")
		BACKEND_SYNC_LIST=("lib")
		WHOLE_SYNC=("adunit" "server" "web" "web-portal" "src" "web-portal" "package.json" "webpack.config.js" "lib")
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
		SERVICE_NAME=('sogive')
		FRONTEND_SYNC_LIST=("server" "src" "web" "package.json" "webpack.config.js")
		BACKEND_SYNC_LIST=("data" "lib")
		WHOLE_SYNC=("server" "src" "web" "package.json" "webpack.config.js" "data" "lib")
		PRESERVE=("web/uploads")
		AUTOMATED_TESTING='yes'
		POST_PUBLISHING_TASK='yes'
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
### Section 03.5: Sort Files and Dirs
#####################
SYNC_FILES=()
SYNC_DIRS=()
function sort_files_and_dirs {
	CURR_LOCATION=$PWD
	cd $PROJECT_LOCATION
	printf "\n\tSorting list of items to be synced ...\n"
	for item in ${SYNC_LIST[@]}; do
		if [ -f $item ]; then
			SYNC_FILES+=("$item")
		elif [ -d $item ]; then
			SYNC_DIRS+=("$item")
		fi
	done
	printf "\n\tList of Files to sync:\n"
    printf '%s\n' "${SYNC_FILES[@]}"
	printf "\n\tList of Directories to sync:\n"
    printf '%s\n' "${SYNC_DIRS[@]}"
	printf "\n\tSync items sorted\n"
	cd $CURR_LOCATION
}


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
### Section 04: Create the list of items that should be preserved
#####################
function create_preserved_items_list {
	if [[ -f /tmp/preserved.list.txt ]]; then
		rm /tmp/preserved.list.txt
	fi
	if [[ ${#PRESERVE[@]} -ne 0 ]]; then
		printf "\nCreating list of items to preserve\n"
		printf '%s\n' ${PRESERVE[@]} >> /tmp/preserved.list.txt
	fi
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

################
### REVISE PLEASE : 2020-01-29
################
##################################
### Section 06: Define the Webpack Function
##################################
function webpack {
	if [[ $WEBPACK = yes ]]; then
		printf "\nGetting NPM Dependencies ..."
		bssh "cd $TARGET_DIRECTORY && npm i"
		printf "\nWebpacking ..."
		case $PROJECT in
			portal)
				bssh "cd $TARGET_DIRECTORY && npm run compile"
			;;
			myloop)
				bssh "cd $TARGET_DIRECTORY && npm run compile"
			;;
			moneyscript)
				bssh "cd $TARGET_DIRECTORY && npm run compile"
			;;
			sogive-app)
				bssh "cd $TARGET_DIRECTORY && npm run compile"
			;;
			*)
				bssh "cd $TARGET_DIRECTORY && webpack --progress -p"
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
			bssh "sudo service $SERVICE_NAME stop"
		done
	fi
}

# Start the $SERVICE_NAME
function start_proc {
	if [[ $RESTART_SERVICE_AFTER_SYNC = 'yes' ]]; then
		for service in ${SERVICE_NAME[@]}; do
			printf "\nStarting $SERVICE_NAME on $TARGETS\n"
			bssh "sudo service $SERVICE_NAME start"
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
				bssh "cd $PROJECT_LOCATION/adunit && bash buildcss.sh"
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

################
### REVISE PLEASE : sync file to each target, then report success/failure, then continue in the loop
################
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
				for server in ${TARGETS[@]}; do
					rsync $config winterwell@$server:$TARGET_DIRECTORY/config/ &
				wait
				done
			done
			printf "\nRenaming dboptions.properties file for specific servers\n"
#			bssh "mv $TARGET_DIRECTORY/config/$HOSTNAME.dboptions.properties $TARGET_DIRECTORY/config/dboptions.properties"
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
				for server in ${TARGETS[@]}; do
					rsync $config winterwell@$server:/$TARGET_DIRECTORY/config/ &
				done
			wait
			done
			case $TYPE_OF_PUBLISH in
			production)
				printf "\nRenaming production config file\n"
				bssh 'mv /home/winterwell/sogive-app/config/production.sogive.properties /home/winterwell/sogive-app/config/sogive.properties'
			;;
			test)
				printf "\nRenaming production config file\n"
				bssh 'mv /home/winterwell/sogive-app/config/test.sogive.properties /home/winterwell/sogive-app/config/sogive.properties'
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
		fi
	done
	cd $PROJECT_LOCATION && brsync
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
				cd $PROJECT_LOCATION
				/usr/local/bin/npm i
				/usr/bin/node runtest.js
			;;
			portal)
				cd $PROJECT_LOCATION
				/usr/local/bin/npm i
				/usr/bin/node runtest.js
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
		bssh "if [[ -d /tmp/$item ]]; then continue; else mkdir -p /tmp/$item; fi"
		bssh "cd $TARGET_DIRECTORY && cp -r $item /tmp"
	done
}

function restore_preserved {
	for item in ${PRESERVE[@]}; do
		printf "\nRestoring $item\n"
		bssh "cd /tmp && cp -r $item $TARGET_DIRECTORY/"
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
						bssh "sudo service baose restart"
					;;
					production)
						rsync $PROJECT_LOCATION/lib/* winterwell@gl-es-01.soda.sh:/home/winterwell/as.good-loop.com/lib/
						ssh winterwell@gl-es-03.soda.sh "cp /home/winterwell/as.good-loop.com/config/adserver.properties /home/winterwell/as.good-loop.com/config/batchallocateorphanspendevents.properties"
						ssh winterwell@gl-es-03.soda.sh "sudo service baose restart"
					;;
					experiment)
						bssh "sudo service baose restart"
					;;
				esac
			;;
			adserver)
				case $SPECIFIC_PUBLISH_GOAL in
					frontend)
						printf "\n\tGetting NPM Dependencies for the Ad Unit\n"
						bssh "cd $TARGET_DIRECTORY/adunit && npm i"
						printf "\n\tWebpacking the Ad Unit\n"
						bssh "cd $TARGET_DIRECTORY/adunit && npm run build"
						printf "\n\tConverting LESS for the Ad Unit\n"
						bssh "lessc $TARGET_DIRECTORY/adunit/style/base.less $TARGET_DIRECTORY/web-as/unit.css"
					;;
					everything)
						printf "\n\tGetting NPM Dependencies for the Ad Unit\n"
						bssh "cd $TARGET_DIRECTORY/adunit && npm i"
						printf "\n\tWebpacking the Ad Unit\n"
						bssh "cd $TARGET_DIRECTORY/adunit && npm run build"
						printf "\n\tConverting LESS for the Ad Unit\n"
						bssh "lessc $TARGET_DIRECTORY/adunit/style/base.less $TARGET_DIRECTORY/web-as/unit.css"
					;;
					backend)
						printf "\n"
					;;
				esac
			;;
			sogive-app)
				for server in ${TARGETS[@]}; do
					rsync $PROJECT_LOCATION/config/version.properties winterwell@$server:$TARGET_DIRECTORY/config/
				done
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
create_preserved_items_list
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
analyze_sync_results
run_automated_tests
