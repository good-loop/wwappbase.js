# Record git status and log into a manifest file, to help in debugging
# Use-case: This shows what code the server is running

LOGFILE=web/build/npm-compile.gitlog.txt

echo '## ' `pwd` > $LOGFILE
echo "" >> $LOGFILE 
git status >> $LOGFILE 
echo "" >> $LOGFILE 
git log -1 >> $LOGFILE 

echo "" >> $LOGFILE 
echo "---------------" >> $LOGFILE 
echo "" >> $LOGFILE 

echo '## wwappbase.js' >> $LOGFILE
echo "" >> $LOGFILE 
git status >> $LOGFILE 
echo "" >> $LOGFILE 
git --git-dir ../wwappbase.js/.git log -1 >> $LOGFILE

echo "Wrote git manifest: $LOGFILE"
