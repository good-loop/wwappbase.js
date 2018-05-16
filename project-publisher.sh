#!/bin/bash

#Project Publisher -- For Good-Loop, SoGive, and WW projects.
#
#
SUPPORTED_PROJECTS=('adserver','datalogger','portal','profiler','sogive-app','youagain')
USAGE=$(printf "\n./project-publisher.sh PROJECTNAME TEST/PRODUCTION\n\nAvailable Projects\n\n\t$SUPPORTED_PROJECTS\n")

if [[ $1 = '' ]]; then
    printf "$USAGE"
fi


#################
### Preamble: Check for dependencies
#################
if [ $(which npm) = "" ]; then
	echo "You must first install NPM before you can use this tool"
	exit 1
fi

if [ $(which babel) = "" ]; then
	echo -e "You must install babel globally before you can use this tool\nInstall with 'sudo npm install -g babel-cli'"
	exit 1
fi

if [ $(which babili) = "" ]; then
	echo -e "You must install babili globally before you can use this tool\nInstall with 'sudo npm install -g babili'"
	exit 1
fi

if [ $(which jshint) = "" ]; then
	echo -e "In order to test the JS files before Babeling, you must have JShint installed on your machine"
	echo -e "Install jshint with 'sudo npm install -g jshint'"
	exit 1
fi

if [ $(which parallel-ssh) = "" ]; then
	echo -e "In order to use this publishing script, you will need Parallel-SSH installed on your machine"
	echo -e "install Parallel-SSH with 'sudo apt-get install pssh'"
	exit 1
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
		SERVICE_NAME='adservermain'
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
		SERVICE_NAME='lg'
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
		SERVICE_NAME='portalmain'
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
		SERVICE_NAME='profilermain'
    ;;
    sogive|SOGIVE)
        PROJECT='sogive-app'
        PRODUCTION_SERVERS=('heppner.soda.sh')
        TEST_SERVERS=('hugh.soda.sh')
		PROJECT_LOCATION="~/winterwell/sogive-app"
        TARGET_DIRECTORY='/home/winterwell/sogive-app/'
        IMAGE_OPTIMISE='no'
		TEST_JAVASCRIPT='no'
		CONVERT_LESS='yes'
		LESS_FILES_LOCATION="$PROJECT_LOCATION/web/style"
        WEBPACK='yes'
    ;;
    sogive-app|SOGIVE-APP)
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
		SERVICE_NAME='sogiveapp'
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
		SERVICE_NAME='youagain'
    ;;
    *)
        printf "\nThe project that you specified, $1 , is not currently supported by the\nproject-publisher.sh script, or, you mis-typed it. \n$USAGE"
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
### Section 03: Create the list of target servers
#####################
function create_target_list {
	rm /tmp/target.list.txt
	printf '%s\n' ${TARGETS[@]} >> /tmp/target.list.txt
}


#####################
### Section 04: Define the Image Optimisation Function
#####################
function image_optimisation {
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
}

##################################
### Section 05: Define the Webpack Function
##################################
function webpack {
    ##### Section 04.01 : Update the node_modules directory from the package.json file
    parallel-ssh -h /tmp/target.list.txt --user winterwell "cd $TARGET_DIRECTORY && npm i"
    ##### Section 04.02 : Webpack the project for production usage
    parallel-ssh -h /tmp/target.list.txt --user winterwell "cd $TARGET_DIRECTORY && webpack --progress -p"
}

##################################
### Section 06: Define the 'restart_proc' Function
##################################
function restart_proc {
	if [[ $SERVICE_NAME = '' ]]; then
		$RESTART_SERVICE='false'
	else
		$RESTART_SERVICE='true'
	fi
	if [[ $RESTART_SERVICE = 'true' ]]; then
		parallel-ssh -h /tmp/target.list.txt --user winterwell "sudo service $SERVICE_NAME restart"
	fi
}

##################################
### Section 07: Defining the 'Convert Less Files' function
##################################
function convert_less_files {
	LESS_FILES=$(find $PROJECT_LOCATION/ -type f -iname "*.less")
	for $file in ${LESS_FILES[@]}; do
		printf"converting $file\n"
		lessc "$file" "${file%.less}.css"
}


#########################################
### Esoteric Section: Adserver Section 01: need specific config files
#########################################
function sync_dboptions_files {
	for name in ${TARGETS[@]}; do
		ssh winterwell@$name 'rm /home/winterwell/as.good-loop.com/config/dboptions.properties'
		ssh winterwell@$name 'touch /home/winterwell/as.good-loop.com/config/dboptions.properties'
		if [[ $name = 'gl-es-01.soda.sh' ]]; then
			scp ~/winterwell/logins/good-loop/adserver/gl-es-01.dboptions.properties winterwell@$name:/home/winterwell/as.good-loop.com/config/dboptions.properties
		elif [[ $name = 'gl-es-02.soda.sh' ]]; then
			scp ~/winterwell/logins/good-loop/adserver/gl-es-02.dboptions.properties winterwell@$name:/home/winterwell/as.good-loop.com/config/dboptions.properties
		elif [[ $name = 'hugh.soda.sh' ]]; then
			scp ~/winterwell/logins/good-loop/adserver/hugh.dboptions.properties winterwell@$name:/home/winterwell/as.good-loop.com/config/dboptions.properties
		fi
	done
}

##########################################
### Esoteric Section: Adserver Section 02: test the JS files for syntax errors
##########################################
function test_js {
	printf "\nTesting the JS files for syntax errors...\n"
	VARIANTJAVASCRIPTFILES=$(find adunit/variants/ -mindepth 1 \( -name "*.js" ! -name "babeled*" ! -name "all*" \) -type f)
	for variantjsfile in ${VARIANTJAVASCRIPTFILES[*]}; do
		TESTINGVJSFILE=$(jshint --verbose $variantjsfile | grep -E E[0-9]+.$)
		if [[ $TESTINGVJSFILE = "" ]]; then
			printf "\n$variantjsfile is OK!\n"
		else
			printf "\n$variantjsfile has syntax errors.\n"
			printf "\nexiting publishing process...\n"
			exit 3
		fi
	done
}

#########################################
### Esoteric Section: Adserver Section 03: compile the variants
#########################################
function compile_variants {
	VARIANTDIRS=()
	for variant in $(find adunit/variants/ -maxdepth 1 -mindepth 1 -type d | awk -F '/' '{print $3}'); do
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
}

##########################################
### Esoteric Section: Adserver Section 04: Performing the sync process
##########################################
function adserver_sync {
	printf "\nSyncing Jars to all targets...\n"
	mv $PROJECT_LOCATION/tmp-lib $PROJECT_LOCATION/lib
	parallel-rsync -h /tmp/target.list.txt --user=winterwell --recursive $PROJECT_LOCATION/lib /home/winterwell/as.good-loop.com/
	mv $PROJECT_LOCATION/lib $PROJECT_LOCATION/tmp-lib
	printf "\ncleaning the bin directory on all targets\n"
	parallel-ssh -h /tmp/target.list.txt --user winterwell 'rm -rf /home/winterwell/as.good-loop.com/bin/*'
	printf "\nensuring exact parity of variant directories\n"
	if [[ $PUBLISH_TYPE = 'production' ]]; then
		PORTAL_SERVER='heppner.soda.sh'
	elif
		[[ $PUBLISH_TYPE = 'test' ]]; then
		PORTAL_SERVER='hugh.soda.sh'
	elif
		[[ $PUBLISH_TYPE = 'local' ]]; then
		PORTAL_SERVER="$LOCALHOST"
	fi
	printf "\n\t> Sub-process: Ensuring Variants parity across both Portal and Adservers...\n"
	ssh winterwell@$PORTAL_SERVER 'rm -rf /home/winterwell/as.good-loop.com/adunit/*'
	rsync -rhP adunit/* winterwell@$PORTAL_SERVER:/home/winterwell/as.good-loop.com/adunit/
	ssh winterwell@$PORTAL_SERVER 'service portalmain restart'
	printf "\n\t> Portal Variants Directory now in sync\n"
	printf "\n\t> Continuing to sync Variants to Adservers\n"
	parallel-ssh -h /tmp/target.list.txt --user=winterwell 'rm -rf /home/winterwell/as.good-loop.com/adunit/*'
	parallel-rsync -h /tmp/target.list.txt --user=winterwell --recursive $PROJECT_LOCATION/adunit/ /home/winterwell/as.good-loop.com/adunit/
	printf "\ncleaning the adunit/build directory on all targets\n"
	parallel-ssh -h /tmp/target.list.txt --user winterwell 'rm -rf /home/winterwell/as.good-loop.com/adunit/build/*'
	printf "\ncleaning out the config directory on all targets\n"
	parallel-ssh -h /tmp/target.list.txt --user winterwell 'rm -rf /home/winterwell/as.good-loop.com/config/*'
	printf "\nSyncing contents of config directory to all targets\n"
	parallel-rsync -h /tmp/target.list.txt --user=winterwell --recursive $PROJECT_LOCATION/config /home/winterwell/as.good-loop.com/
	printf "\nSyncing contents of web-as directory to all targets\n"
	parallel-rsync -h /tmp/target.list.txt --user=winterwell --recursive $PROJECT_LOCATION/web-as /home/winterwell/as.good-loop.com/
	if [[ $PUBLISH_TYPE = 'test' ]]; then
		printf "\nSyncing the web-test directory...\n"
		parallel-rsync -h /tmp/target.list.txt --user=winterwell --recursive $PROJECT_LOCATION/web-test /home/winterwell/as.good-loop.com/
	fi
	printf "\nMoving properties files into place\n"
	parallel-ssh -h /tmp/target.list.txt --user=winterwell 'cp /home/winterwell/dboptions.properties /home/winterwell/as.good-loop.com/config/'
}