#!/bin/bash


# Get the names of the targets
PRODUCTION_SERVERS=(gl-es-03.soda.sh gl-es-04.soda.sh gl-es-05.soda.sh)
TARGET_SERVERS=${PRODUCTION_SERVERS[@]}
# Count the number of targets
NUM_REMOTE_TARGETS=${#TARGET_SERVERS[@]}

# Cite the directories and files that should be sync'ed
WHOLE_SYNC=("config" "src" "src-js" "web" "package.json" "ssl.gl-es-03.good-loop.com.conf" "ssl.gl-es-03.good-loop.com.params.conf" "ssl.gl-es-04.good-loop.com.conf" "ssl.gl-es-04.good-loop.com.params.conf" "ssl.gl-es-05.good-loop.com.conf" "ssl.gl-es-05.good-loop.com.params.conf" "webpack.config.js" "lib" "winterwell.datalog.jar")

# Where should the files be put on the remote host
TARGET_DIRECTORY='/home/winterwell/lg.good-loop.com'

# DEBUG-TOOL : Form the rsync commands as plaintext, but do not execute them.
if [[ -f /tmp/rsync.commands.phase01.txt ]]; then
		rm /tmp/rsync.commands.phase01.txt
	fi
for sync_item in ${WHOLE_SYNC[@]}; do
    for server in ${TARGET_SERVERS[@]}; do
        printf "rsync -rhP $sync_item winterwell@$server:$TARGET_DIRECTORY/ & " >> /tmp/rsync.commands.phase01.txt
    done
    wait
    printf "\n\tBatch Break\n" >> /tmp/rsync.commands.phase01.txt
done



# Form the rsync commands as real-commands, and execute them
# for sync_item in ${WHOLE_SYNC[@]}; do
#   for server in ${TARGET_SERVERS[@]}; do
#         rsync -rhP $sync_item winterwell@$server:/$TARGET_DIRECTORY/ & 
#     done
#   wait
#   printf "\n\tRsync background process to sync $sync_item has finished\n"
# done
# 
# echo "all done"