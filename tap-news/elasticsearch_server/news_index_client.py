#!/usr/bin/python
# -*- coding: utf-8 -*-

import datetime
import os
import sys
import yaml

from dateutil import parser

stream = open("../config/config.yml", "r")
load = yaml.load(stream)
config = load['default']

#import common package in parent directory
sys.path.append(os.path.join(os.path.dirname(__file__),'..','common'))

from cloudAMQP_client import CloudAMQPClient
import log_client
import elastic_client

es = elastic_client.get_elastic();

ELASTICSEARCH_INDEX_TASK_QUEUE_URL = config['elasticsearch']['ELASTICSEARCH_INDEX_TASK_QUEUE_URL']
ELASTICSEARCH_INDEX_TASK_QUEUE_NAME = config['elasticsearch']['ELASTICSEARCH_INDEX_TASK_QUEUE_NAME']

SLEEP_TIME_IN_SECONDS = config['elasticsearch']['SLEEP_TIME_IN_SECONDS']

elasticsearch_index_cloudAMQP_client = CloudAMQPClient(ELASTICSEARCH_INDEX_TASK_QUEUE_URL, ELASTICSEARCH_INDEX_TASK_QUEUE_NAME)

#print elasticsearch_index_cloudAMQP_client

def handle_message(msg):
    #print '------------------------------------msg: %s' % msg
    if msg is None or not isinstance(msg, dict):
        log_client.logger.warn('message is broken')
        #print 'message is broken'
        return
    log_client.logger.info('handle message from queue to elasticsearch')
    #print "handle message from queue to elasticsearch index %s" % msg
    try:
        print "send data to elastic index service..."
        es.index(index='news',doc_type='news', body=msg)
    except Exception as e:
        print "error~~~~~~~~~~~~~~~~~~~~~ %s" % str(e)
        log_client.logger.error(str(e))


while True:
    if elasticsearch_index_cloudAMQP_client is not None:
        msg = elasticsearch_index_cloudAMQP_client.getMessage()
        if msg is not None:
            #print 'elas get message from queue %s' % msg
            try:
                handle_message(msg)
            except Exception as e:
                log_client.logger.error(str(e))
                pass
        elasticsearch_index_cloudAMQP_client.sleep(SLEEP_TIME_IN_SECONDS)
    #print 'fetch 0 news.....'
