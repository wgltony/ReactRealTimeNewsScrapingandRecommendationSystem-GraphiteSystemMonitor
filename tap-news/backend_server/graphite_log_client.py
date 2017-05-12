#!/usr/bin/python
# -*- coding: utf-8 -*-

import os
import sys
import yaml
import statsd

stream = open("../config/config.yml", "r")
load = yaml.load(stream)
config = load['default']['backend_server']

#import common package in parent directory
sys.path.append(os.path.join(os.path.dirname(__file__),'..','common'))
#sys.path.append(os.path.join(os.path.dirname(__file__),'./','scrapers'))
import log_client
#import cnn_news_scraper
from cloudAMQP_client import CloudAMQPClient

LOG_GRAPHITE_TASK_QUEUE_URL = config['operations']['LOG_GRAPHITE_TASK_QUEUE_URL']
LOG_GRAPHITE_TASK_QUEUE_NAME = config['operations']['LOG_GRAPHITE_TASK_QUEUE_NAME']

SLEEP_TIME_IN_SECONDS = config['operations']['SLEEP_TIME_IN_SECONDS']

graphitelog_cloudAMQP_client = CloudAMQPClient(LOG_GRAPHITE_TASK_QUEUE_URL, LOG_GRAPHITE_TASK_QUEUE_NAME)

def handle_message(msg):
    if msg is None:
        log_client.logger.info('message is broken')
        #print 'message is broken'
        return

    counter = statsd.Counter(msg)
    counter+=1


while True:
    #fetch message from queue
    if graphitelog_cloudAMQP_client is not None:
        msg = graphitelog_cloudAMQP_client.getMessage()
        if msg is not None:
            #print 'msg: %s' % msg
            #handle message
            try:
                handle_message(msg)
            except Exception as e:
                log_client.logger.error(str(e))
                pass
        #print 'fetch 0 log message...'
        #graphitelog_cloudAMQP_client.sleep(SLEEP_TIME_IN_SECONDS)
