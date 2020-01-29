#!/bin/bash
CURR_DIR=$PWD
cd ~/winterwell/open-code/winterwell.datalog/
SYNC_LIST=("config" "src" "web" "package.json" "ssl.gl-es-03.good-loop.com.conf" "ssl.gl-es-03.good-loop.com.params.conf" "ssl.gl-es-04.good-loop.com.conf" "ssl.gl-es-04.good-loop.com.params.conf" "ssl.gl-es-05.good-loop.com.conf" "ssl.gl-es-05.good-loop.com.params.conf" "webpack.config.js" "lib" "winterwell.datalog.jar")


SYNC_FILES=()
SYNC_DIRS=()
function sort_files_and_dirs {
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
}

sort_files_and_dirs
cd $CURR_DIR