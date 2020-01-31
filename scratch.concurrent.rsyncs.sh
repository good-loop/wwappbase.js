#!/bin/bash

#TODO

# Get the names of the targets
PRODUCTION_SERVERS=("gl-es-03.soda.sh" "gl-es-04.soda.sh" "gl-es-05.soda.sh" "datalognode-01.good-loop.com")
TARGET_SERVERS=${PRODUCTION_SERVERS[@]}
# Count the number of targets
NUM_REMOTE_TARGETS=${#TARGET_SERVERS[@]}

# Cite the directories and files that should be sync'ed
#WHOLE_SYNC=("config" "src" "src-js" "web" "package.json" "ssl.gl-es-03.good-loop.com.conf" "ssl.gl-es-03.good-loop.com.params.conf" "ssl.gl-es-04.good-loop.com.conf" "ssl.gl-es-04.good-loop.com.params.conf" "ssl.gl-es-05.good-loop.com.conf" "ssl.gl-es-05.good-loop.com.params.conf" "webpack.config.js" "lib" "winterwell.datalog.jar")
WHOLE_SYNC=("test.dummy.txt.1" "test.dummy.txt.2" "test.dummy.txt.3" "test.dummy.txt.4")

# Where should the files be put on the remote host
TARGET_DIRECTORY='/home/winterwell/lg.good-loop.com'


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

# DEBUG-TOOL : Form the rsync commands as plaintext, but do not execute them.
# if [[ -f /tmp/rsync.commands.output.txt ]]; then
# 		rm /tmp/rsync.commands.output.txt
# 	fi
# for sync_item in ${WHOLE_SYNC[@]}; do
#     for server in ${TARGET_SERVERS[@]}; do
#         printf "rsync -rhP --delete-before $sync_item winterwell@$server:$TARGET_DIRECTORY/ & " >> /tmp/rsync.commands.output.txt
#     done
#     wait
#     printf "\n\tBatch Break\n" >> /tmp/rsync.commands.output.txt
# done


# clear out the 'lib' directory before performing a sync
# for server in ${TARGET_SERVERS[@]}; do
#   ssh winterwell@$server "rm -rf $TARGET_DIRECTORY/lib/*.jar"
#done

# Form the rsync commands as real-commands, and execute them
# for sync_item in ${WHOLE_SYNC[@]}; do
#   for server in ${TARGET_SERVERS[@]}; do
#         rsync -rhP --delete-before $sync_item winterwell@$server:/$TARGET_DIRECTORY/ & 
#     done
#   wait
#   handle_rsync_exit_code
# done
# 
# printf "\nsyncing loops have completed\n"
# printf "\nRsync error count was $RSYNC_ERROR_COUNT\N"



###################
###### Experimental batched rsync for having pretty output
###################
for sync_item in ${WHOLE_SYNC[@]}; do
	for server in ${TARGET_SERVERS[@]}; do
		printf "\nSyncing $sync_item to $server\n"
		rsync $sync_item winterwell@$server:$TARGET_DIRECTORY/ | handle_rsync_exit_code &
	done
wait
done