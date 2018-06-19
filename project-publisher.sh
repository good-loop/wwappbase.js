#!/bin/bash

#################
### Preamble: Check for dependencies
#################
if [ $(which npm) = "" ]; then
	printf "\nYou must first install NPM before you can use this tool"
	exit 1
fi

if [ $(which babel) = "" ]; then
	printf "\nYou must install babel globally before you can use this tool\nInstall with 'sudo npm install -g babel-cli'"
	exit 1
fi

if [ $(which babili) = "" ]; then
	printf "\nYou must install babili globally before you can use this tool\nInstall with 'sudo npm install -g babili'"
	exit 1
fi

if [ $(which jshint) = "" ]; then
	printf "\nIn order to test the JS files before Babeling, you must have JShint installed on your machine\nInstall jshint with 'sudo npm install -g jshint'"
	exit 1
fi

if [ $(which parallel-ssh) = "" ]; then
	printf "\nIn order to use this publishing script, you will need Parallel-SSH installed on your machine\ninstall Parallel-SSH with 'sudo apt-get install pssh'"
	exit 1
fi


#################
### Preamble: Define Arrays and Variables
#################
SUPPORTED_PROJECTS=('adserver','datalogger','portal','profiler','sogive-app','youagain')
USAGE=$(printf "\n./project-publisher.sh PROJECTNAME TEST/PRODUCTION\n\nAvailable Projects\n\n\t$SUPPORTED_PROJECTS\n")
DO_NOT_SYNC=()
SYNC_LIST=()
PSYNC=$(parallel-rsync -h /tmp/target.list.txt --user=winterwell --recursive --extra-arg -L --extra-arg --delete-before --extra-arg --exclude=$DO_NOT_SYNC_LIST)
PSSH=$(parallel-ssh -h /tmp/target.list.txt --user=winterwell)
DO_NOT_SYNC_LIST='/tmp/do_not_sync_list.txt'


##################
### Preamble: Check that this script is executed correctly
##################
if [[ $1 = '' ]]; then
    printf "$USAGE"
fi



#################
### Section 01: Get the name of the project and handle invalid first arguments
#################
case $1 in
    adserver|ADSERVER)
        PROJECT='adserver'
        PRODUCTION_SERVERS=('gl-es-01.soda.sh','gl-es-02.soda.sh')
        TEST_SERVERS=('hugh.soda.sh')
		PROJECT_LOCATION="~/winterwell/adserver"
        TARGET_DIRECTORY='/home/winterwell/as.good-loop.com/'
        IMAGE_OPTIMISE='yes'
        IMAGEDIRECTORY="/home/$USER/winterwell/adserver/web-as/vert/"
		CONVERT_LESS='no'
        WEBPACK='no'
		TEST_JAVASCRIPT='yes'
		JAVASCRIPT_FILES_TO_TEST=$(find adunit/variants/ -mindepth 1 \( -name "*.js" ! -name "babeled*" ! -name "all*" \) -type f)
		COMPILE_UNITS='yes'
		UNITS_TO_COMPILE=$(find adunit/variants/ -maxdepth 1 -mindepth 1 -type d | awk -F '/' '{print $3}')
		SERVICE_NAME='adservermain'
		DO_NOT_SYNC=(".git" "bin" "boblog" "dummy-pub" "node_modules" "puppeteer-tests" "safeframe-stuff" "web-portal" "as-player.png" "backup-portal-uploads.sh" "bob.log" "com.winterwell.web.app.PublisheProjectTask.log" "compile-units.sh" "convert.less.sh" "good-loop-live-demo.png" "package.json" "pom.bob.xml" "publish-adserver.sh" "publish-adserver.sh.orig" "publish-portal.sh" "rectangle-brand-funded.png" "rectangle-countdown.png" "rectangle-default" "run-me-first.sh" "testas-player.png" "update-showcase.sh" "update-templates.sh" "uploads.backup.sh" "watch.sh" "watch-as.sh" "webpack.config.as.js" "webpack.config.dev.js" "webpack.config.js" ".babelrc" ".classpath" ".eslintrc.js" ".gitignore" ".jshintrc" ".project")
    ;;
    datalogger|DATALOGGER)
        PROJECT='datalogger'
        PRODUCTION_SERVERS=('gl-es-03.soda.sh','gl-es-04.soda.sh','gl-es-05.soda.sh')
        TEST_SERVERS=('hugh.soda.sh')
		PROJECT_LOCATION="~/winterwell/open-code/winterwell.datalog"
        TARGET_DIRECTORY='/home/winterwell/lg.good-loop.com/'
        IMAGE_OPTIMISE='no'
		CONVERT_LESS='no'
        WEBPACK='no'
		TEST_JAVASCRIPT='no'
		COMPILE_UNITS='no'
		SERVICE_NAME='lg'
		DO_NOT_SYNC=("bin" "bin.test" "boblog" "build" "bob.log" "build-less.sh" "cluster-jar-sync.sh" "cluster-sync.sh" "com.winterwell.web.app.PublishProjectTask.log" "package.json" "pom.bob.xml" "publish-lg.sh" "restart.lg.process.sh" "ssl.*.conf" "watch.sh" "webpack.config.js" ".classpath" ".eslintrc.js" ".gitignore" ".project")
    ;;
    portal|PORTAL)
        PROJECT='portal'
        PRODUCTION_SERVERS=('heppner.soda.sh')
        TEST_SERVERS=('hugh.soda.sh')
		PROJECT_LOCATION="~/winterwell/adserver"
        TARGET_DIRECTORY='/home/winterwell/as.good-loop.com'
        IMAGE_OPTIMISE='no'
		CONVERT_LESS='yes'
		LESS_FILES_LOCATION="$PROJECT_LOCATION/web-portal/style"
        WEBPACK='yes'
		TEST_JAVASCRIPT='no'
		COMPILE_UNITS='no'
		SERVICE_NAME='portalmain'
		DO_NOT_SYNC=(".git" "bin" "boblog" "dummy-pub" "node_modules" "puppeteer-tests" "safeframe-stuff" "as-player.png" "backup-portal-uploads.sh" "bob.log" "com.winterwell.web.app.PublisheProjectTask.log" "good-loop-live-demo.png" "pom.bob.xml" "publish-adserver.sh" "publish-adserver.sh.orig" "publish-portal.sh" "rectangle-brand-funded.png" "rectangle-countdown.png" "rectangle-default" "run-me-first.sh" "testas-player.png" "update-showcase.sh" "update-templates.sh" "uploads.backup.sh" "watch.sh" "watch-as.sh"".classpath" ".eslintrc.js" ".gitignore" ".jshintrc" ".project")
    ;;
    profiler|PROFILER)
        PROJECT='profiler'
        PRODUCTION_SERVERS=('hugh.soda.sh')
        TEST_SERVERS=('none')
		PROJECT_LOCATION="~/winterwell/code/profiler"
        TARGET_DIRECTORY='/home/winterwell/profiler/'
        IMAGE_OPTIMISE='no'
		CONVERT_LESS='no'
        WEBPACK='no'
		TEST_JAVASCRIPT='no'
		COMPILE_UNITS='no'
		SERVICE_NAME='profilermain'
		DO_NOT_SYNC=("bin" "boblog" "build" "src" "test" "bob.log" "com.winterwell.web.app.PublishProjectTask.log" "compile-units.sh" "pom.bob.xml" "publish-profiler.sh" "ssl.*.conf" ".classpath" ".gitignore" ".project")
    ;;
    sogive|SOGIVE|sogive-app|SOGIVE-APP)
        PROJECT='sogive-app'
        PRODUCTION_SERVERS=('heppner.soda.sh')
        TEST_SERVERS=('hugh.soda.sh')
		PROJECT_LOCATION="~/winterwell/sogive-app"
        TARGET_DIRECTORY='/home/winterwell/sogive-app/'
        IMAGE_OPTIMISE='no'
		CONVERT_LESS='yes'
		LESS_FILES_LOCATION="$PROJECT_LOCATION/web/style"
        WEBPACK='yes'
		TEST_JAVASCRIPT='no'
		COMPILE_UNITS='no'
		SERVICE_NAME='sogiveapp'
		DO_NOT_SYNC=("bin" "boblog" "node_modules" "test" ".git" ".vscode" "backup-uploads.sh" "bob.log" "click-through.test.sogive.org.png" "com.winterwell.web.app.PublishProjectTask" "eg-charities.md" "eurostar-30s-720p.m4v" "get-jar-dependencies.sh" "headless-setup.sh" "org.sogive.server.SoGiveServer.log" "pom.bob.xml" "publish-sogiveapp.sh" "README.md" "run-me-first.sh" "simple-search.test.sogive.org.png" "sogive.log" "sogive.log.*" "test.sogive.org.png" "watch.sh" ".classpath" ".eslintrc.js" ".flowconfig" ".gitignore" ".project")
		AUTOMATED_TESTING='yes'
		AUTOMATED_TESTING_COMMAND="bash $PROJECT_LOCATION/test/run-tests.sh $2"
    ;;
    youagain|YOUAGAIN)
        PROJECT='youagain'
        PRODUCTION_SERVERS=('bester.soda.sh')
        TEST_SERVERS=('none')
		PROJECT_LOCATION="~/winterwell/code/youagain-server"
        TARGET_DIRECTORY='/home/winterwell/youagain/'
        IMAGE_OPTIMISE='no'
		CONVERT_LESS='no'
        WEBPACK='no' #for now
		TEST_JAVASCRIPT='no'
		COMPILE_UNITS='no'
		SERVICE_NAME='youagain'
		DO_NOT_SYNC=("bin" "boblog" "build" "node_modules" "test" "bob.log" "com.winterwell.web.app.PublishProjectTask.log" "convert.less.sh" "dummy.txt" "pom.bob.xml" "publish-youagain.sh" "publish-youagain.sh.old" "README.md" "ssl.*.conf" "watch.sh" "youagain-server.log" "youagain-server.log.*" "youagain-server.sh" ".classpath" ".eslintrc.js" ".gitignore" ".project")
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
    test|TEST)
        TYPE_OF_PUBLISH='test'
        TARGETS=$TEST_SERVERS
    ;;
    production|PRODUCTION)
        TYPE_OF_PUBLISH='production'
        TARGETS=$PRODUCTION_SERVERS
    ;;
    local|LOCAL|localhost|LOCALHOST)
        TYPE_OF_PUBLISH='local'
        TARGETS='localhost'
    ;;
    *)
        printf "\nThe second argument of, $2 , is either invalid, or is not supported by this script\n$USAGE"
    ;;
esac


#####################
### Section 03: Create the list of target servers AND create list of items that should not be sync'ed
#####################
function create_target_list {
	rm /tmp/target.list.txt
	printf '%s\n' ${TARGETS[@]} >> /tmp/target.list.txt
}

function create_do_not_sync_list {
	rm /tmp/do_not_sync_list.txt
	printf '%s\n' ${DO_NOT_SYNC[@]} >> /tmp/do_not_sync_list.txt
}



#####################
### Section 04: Define the Image Optimisation Function
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
				printf "$PNGMD5OUTPUT" >> $IMAGEDIRECTORY/newpngarray.txt
			done
			mapfile -t PNGARRAY < $IMAGEDIRECTORY/newpngarray.txt
			UNIQUEPNGS=$(diff $IMAGEDIRECTORY/pngarray.txt $IMAGEDIRECTORY/newpngarray.txt | grep ">" | awk '{print $3}')
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
				printf "$PNGMD5OUTPUT" >> $IMAGEDIRECTORY/pngarray.txt
			done
		fi

		## For JPGs
		if [[ $OPTIMISEJPGSTASK = 'yes' ]]; then
			mapfile -t OPTIMISEDJPGS < $IMAGEDIRECTORY/jpgarray.txt
			for file in $(find $IMAGEDIRECTORY/ -type f -name '*.jpg'); do
				JPGMD5OUTPUT=$(md5sum $file)
				printf "$JPGMD5OUTPUT" >> $IMAGEDIRECTORY/newjpgarray.txt
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
				printf "$JPGMD5OUTPUT" >> $IMAGEDIRECTORY/jpgarray.txt
			done
		fi

		## For JPEGs
		if [[ $OPTIMISEJPEGSTASK = 'yes' ]]; then
			mapfile -t OPTIMISEDJPEGS < $IMAGEDIRECTORY/jpegarray.txt
			for file in $(find $IMAGEDIRECTORY/ -type f -name '*.jpeg'); do
				JPEGMD5OUTPUT=$(md5sum $file)
				printf "$JPEGMD5OUTPUT" >> $IMAGEDIRECTORY/newjpegarray.txt
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
				printf "$JPEGMD5OUTPUT" >> $IMAGEDIRECTORY/jpegarray.txt
			done
		fi
	fi
}

##################################
### Section 05: Define the Webpack Function
##################################
function webpack {
    ##### Section 04.01 : Update the node_modules directory from the package.json file
    $PSSH "cd $TARGET_DIRECTORY && npm i"
    ##### Section 04.02 : Webpack the project for production usage
    $PSSH "cd $TARGET_DIRECTORY && webpack --progress -p"
}

##################################
### Section 06: Define the Functions that can start and stop a process on the server
##################################
function stop_proc {
	if [[ $SERVICE_NAME = '' ]]; then
		$RESTART_SERVICE='false'
	else
		$RESTART_SERVICE='true'
	fi
	if [[ $RESTART_SERVICE = 'true' ]]; then
		$PSSH "sudo service $SERVICE_NAME stop"
	fi
}

function start_proc {
	if [[ $SERVICE_NAME = '' ]]; then
		$RESTART_SERVICE='false'
	else
		$RESTART_SERVICE='true'
	fi
	if [[ $RESTART_SERVICE = 'true' ]]; then
		$PSSH "sudo service $SERVICE_NAME start"
	fi
}

##################################
### Section 07: Defining the 'Convert Less Files' function
##################################
function convert_less_files {
	if [[ $CONVERT_LESS = 'yes' ]]; then
		LESS_FILES=$(find $PROJECT_LOCATION/ -type f -iname "*.less")
		for $file in ${LESS_FILES[@]}; do
			printf"converting $file\n"
			lessc "$file" "${file%.less}.css"
		done
	fi
}

###################################
### Section 08: Defining the Jar Syncing Function
###################################
function rename_tmp_lib {
	$PSSH "cd $TARGET_DIRECTORY && mv tmp-lib lib"
}


#########################################
### Section 09: Sync the Config Files
#########################################
function sync_configs {
	if [[ $PROJECT = 'adserver' ]]; then
		$PSYNC /home/$USER/winterwell/logins/good-loop/adserver/*.properties $TARGET_DIRECTORY/config/
	fi
	if [[ $PROJECT = 'sogive-app' ]]; then
		$PSYNC /home/$USER/winterwell/logins/sogive-app/*.properties $TARGET_DIRECTORY/config/
	fi
}



##########################################
### Section 10: test the JS files for syntax errors
##########################################
function test_js {
	if [[ $TEST_JAVASCRIPT = 'yes' ]]; then
		printf "\nTesting the JS files for syntax errors...\n"
		for jsfile in ${JAVASCRIPT_FILES_TO_TEST[*]}; do
			TESTINGVJSFILE=$(jshint --verbose $jsfile | grep -E E[0-9]+.$)
			if [[ $TESTINGVJSFILE = "" ]]; then
				printf "\n$jsfile is OK!\n"
			else
				printf "\n$jsfile has syntax errors.\n"
				printf "\nexiting publishing process...\n"
				exit 3
			fi
		done
	fi
}

#########################################
### Section 11: Compile the Variants
#########################################
function compile_variants {
	if [[ $COMPILE_UNITS = 'yes' ]]; then
		#### Compile Adserver Units
		if [[ $PROJECT = 'adserver' ]]; then
			VARIANTDIRS=()
			for variant in ${UNITS_TO_COMPILE[*]}; do
				VARIANTDIRS+=("$variant")
			done
			printf "\n${VARIANTDIRS[*]}\n"
			printf "\nFound \e[1m${#VARIANTDIRS[@]}\e[0m ad-unit variants to compile.\n"

			VARIANTLIST='~/winterwell/adserver/adunit/js/base.html.js'
			LESSLIST='~/winterwell/adserver/adunit/style/base.less'
			COLOUR=$RANDOM

			for variant in ${VARIANTDIRS[*]}; do
				# Build up the list of .html.js files we'll compile together later
				if [ -f ~/winterwell/adserver/adunit/variants/$variant/unit.html.js -a -f ~/winterwell/adserver/adunit/variants/$variant/unit.less ]; then
					VARIANTLIST="$VARIANTLIST ~/winterwell/adserver/adunit/variants/$variant/unit.html.js"
					LESSLIST="$LESSLIST ~/winterwell/adserver/adunit/variants/$variant/unit.less"
				else
					printf "\nVariant dir \e[1m\e[3$(( $COLOUR % 7 + 1))m$variant\e[0m is missing unit.html.js or unit.less, skipping\n"
				fi
				COLOUR=$(($COLOUR + 1))
			done

			cat $LESSLIST > ~/winterwell/adserver/adunit/style/all_intermediate.less
			lessc ~/winterwell/adserver/adunit/style/all_intermediate.less web-as/all.css
			rm ~/winterwell/adserver/adunit/style/all_intermediate.less

			# Compiling all JS (all variants at once) to single file
			VARIANTLIST="$VARIANTLIST ~/winterwell/adserver/adunit/js/unit.act.js ~/winterwell/adserver/adunit/js/unit.js"

			if [ ! -d ~/winterwell/adserver/adunit/compiled ]; then
				mkdir -p ~/winterwell/adserver/adunit/compiled
			fi

			printf "\nCompiling all variants to one miraculous file\n"
			printf "\n\tBabeling ES6 sources...\n"
			babel --quiet $VARIANTLIST --out-file ~/winterwell/adserver/adunit/compiled/babeled-unit.js
			printf "\n\tIncluding non-ES6 files...\n"
			cat ~/winterwell/adserver/adunit/lib/zepto.min.js ~/winterwell/adserver/adunit/lib/js.cookie.js ~/winterwell/adserver/adunit/lib/datalog.js ~/winterwell/adserver/adunit/compiled/babeled-unit.js > ~/winterwell/adserver/adunit/compiled/all_debug.js

			## Minify JS and remove intermediate files
			printf "\n\tMinifying...\n"
			babili --quiet ~/winterwell/adserver/adunit/compiled/all_debug.js --out-file ~/winterwell/adserver/adunit/compiled/all.js
			rm ~/winterwell/adserver/adunit/compiled/babeled-unit.js


			#Other directories containing JS files that need to be babel'ed:
			OTHERJSDIRS=("~/winterwell/adserver/web-as")
			OTHERJSFILES=()
			for jsfile in $(find ${OTHERJSDIRS[@]} -maxdepth 1 -type f \( -iname '*.js' ! -iname '*.babeled.js' \) | rev | cut -c 4-128 | rev); do
				printf "\nBabeling \e[3$(($COLOUR % 7 + 1))m$jsfile.js ...\n\e[0m\n"
				babel --quiet $jsfile.js --out-file "$jsfile.babeled.js"
				COLOUR=$(($COLOUR + 1))
			done

			#Other directories containing LESS files that need to be converted:
			OTHERDIRS=("~/winterwell/adserver/web-portal")
			OTHERDIRS+=("~/winterwell/adserver/web-as")
			LESSFILES=()
			for lessfile in $(find ${OTHERDIRS[@]} -type f -name '*.less'); do
				LESSFILES+=("$lessfile")
			done
			for lessfile in ${LESSFILES[*]}; do
				printf "\nconverting $lessfile ...\n"
				lessc "$lessfile" "${lessfile%.less}.css"
			done
			printf "\nDone compiling ad-unit variants.\n"
		fi
	fi	
}

##########################################
### Section 12: Defining the Sync
##########################################
function sync_whole_project {
	$PSYNC $PROJECT_LOCATION $TARGET_DIRECTORY
}

##########################################
### Section 13: Automated Testing
##########################################
function run_automated_tests {
	if [[ $AUTOMATED_TESTING = 'yes' ]]; then
		$AUTOMATED_TESTING_COMMAND
	fi
}

##########################################
### Section 14: Performing the Actual Publish
##########################################
printf "\nCreating Target List"
$create_target_list
printf "\nCreating List of Excluded Items from Sync"
$create_do_not_sync_list
printf "\nStopping Service on Server(s)"
$stop_proc
$image_optimisation
$convert_less_files
$test_js
$compile_variants
printf "\nSyncing Project"
$sync_whole_project
printf "\nSyncing Configs"
$sync_configs
printf "\nRenaming lib directory"
$rename_tmp_lib
$webpack
printf "\nStarting Process"
$start_proc
printf "\nPublishing Process has completed\n"
$run_automated_tests