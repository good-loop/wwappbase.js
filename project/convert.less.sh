# !/bin/env bash

WATCH=$1
GOTINOTIFYTOOLS=`which inotifywait`
DIR=`pwd`;
PROJECT=`basename $DIR`
echo "PROJECT: $PROJECT"
#PROJECTPATH=/home/$USER/winterwell/code/$PROJECT
#PROJECTPATH=/home/$USER/winterwell/$PROJECT
PROJECTPATH=$DIR
WEB=$PROJECTPATH/web
OUTDIR=$WEB/style

# the TOPLESS files are the top level files referenced in index.html
TOPLESS[0]=$PROJECTPATH/src/style/main.less;
TOPLESS[1]=$PROJECTPATH/src/style/print.less;

# Function definition: run through all specified LESS files
convert_less() {
	for file in "${TOPLESS[@]}"; do
			if [ -e "$file" ]; then
				echo -e "Converting $file..."
				F=`basename $file`
				echo lessc "$file" "$OUTDIR/${F%.less}.css"
				lessc "$file" "$OUTDIR/${F%.less}.css"
			else
				echo "less file not found: $file"				
			fi
	done
}

# Run once
convert_less

# Watch?
if [[ $WATCH == 'watch' ]]; then
	if [ "$GOTINOTIFYTOOLS" = "" ]; then
    	echo "In order to watch and continuously convert less files, you will first need to install inotify-tools on this system"
    	echo ""
    	echo "run sudo apt-get install inotify-tools in order to install"
    	exit 0
	else
	while true
	do
		inotifywait -r -e modify,attrib,close_write,move,create,delete $WEB/style && \
		convert_less
	done
	fi
fi
