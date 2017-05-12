import pyinotify
import operations
import re
import os

wm = pyinotify.WatchManager()
mask = pyinotify.IN_MODIFY

class EventHandler (pyinotify.ProcessEvent):

    def __init__(self, file_path, *args, **kwargs):
        super(EventHandler, self).__init__(*args, **kwargs)
        self.file_path = file_path
        self._last_position = 0
        logpats = r'I2G\(JV\)'
        self._logpat = re.compile(logpats)

    def process_IN_MODIFY(self, event):
        #print "File changed: ", event.pathname
        if self._last_position > os.path.getsize(self.file_path):
            self._last_position = 0
        with open(self.file_path) as f:
            f.seek(self._last_position)
            loglines = f.readlines()
            self._last_position = f.tell()
            groups = (line.strip() for line in loglines)
            for g in groups:
                if g:
                    searchAndRecordToGraphite(g)

def searchAndRecordToGraphite(msg):
    if re.search('debug',  msg, flags=re.IGNORECASE):
        operations.logDataForGraphite('debug')
    elif re.search('info',  msg, flags=re.IGNORECASE):
        operations.logDataForGraphite('info')
    elif re.search('error',  msg, flags=re.IGNORECASE):
        operations.logDataForGraphite('error')
    elif re.search('warn',  msg, flags=re.IGNORECASE):
        operations.logDataForGraphite('warn')
    elif re.search('critical',  msg, flags=re.IGNORECASE):
        operations.logDataForGraphite('critical')


node_server_handler = EventHandler('../web_server/node.log')
node_server_notifier = pyinotify.Notifier(wm, node_server_handler)

wm.add_watch(node_server_handler.file_path, mask)
node_server_notifier.loop()
