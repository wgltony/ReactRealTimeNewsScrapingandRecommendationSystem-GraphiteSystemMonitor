import pyjsonrpc
import json
import os
import sys
import operations
import yaml
import random

from bson.json_util import dumps


stream = open("../config/config.yml", "r")
load = yaml.load(stream)
config = load['default']['backend_server']

SERVER_HOST = config['service']['SERVER_HOST']
SERVER_PORT = config['service']['SERVER_PORT']

#import common packages in parent directory
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'common'))

import mongodb_client
import log_client

class RequestHandler(pyjsonrpc.HttpRequestHandler):
    """Test method"""
    @pyjsonrpc.rpcmethod
    def add(self, a, b):
        print "add is called with %d and %d" % (a, b)
        return a + b

    @pyjsonrpc.rpcmethod
    def getNewsSummariesForUser(self, user_id, page_num):
        try:
            return operations.getNewsSummariesForUser(user_id, page_num)
        except Exception as e:
            log_client.logger.error(str(e))

    @pyjsonrpc.rpcmethod
    def getSearchNewsSummariesForUser(self, user_id, page_num, search_key):
        try:
            return operations.getSearchNewsSummariesForUser(user_id, page_num, search_key)
        except Exception as e:
            log_client.logger.error(str(e))

    @pyjsonrpc.rpcmethod
    def logNewsClickForUser(self, user_id, news_id):
        try:
            return operations.logNewsClickForUser(user_id, news_id)
        except Exception as e:
            log_client.logger.error(str(e))

    @pyjsonrpc.rpcmethod
    def getPreferenceForUser(self, user_id):
        try:
            return operations.getPreferenceForUser(user_id)
        except Exception as e:
            log_client.logger.error(str(e))

    @pyjsonrpc.rpcmethod
    def logDataForGraphite(self, process_name):
        try:
            return operations.logDataForGraphite(process_name)
        except Exception as e:
            log_client.logger.error(str(e))



http_server = pyjsonrpc.ThreadingHttpServer(
server_address= (SERVER_HOST, SERVER_PORT),
RequestHandlerClass= RequestHandler
)

log_client.logger.info("Starting HTTP server on %s:%d" % (SERVER_HOST, SERVER_PORT))
#print "Starting HTTP server on %s:%d" % (SERVER_HOST, SERVER_PORT)

http_server.serve_forever()
