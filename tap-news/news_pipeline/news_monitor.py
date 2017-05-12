#!/usr/bin/python
# -*- coding: utf-8 -*-

import os
import sys
import redis
import hashlib
import datetime
import yaml

stream = open("../config/config.yml", "r")
load = yaml.load(stream)
config = load['default']['news_pipeline']

sys.path.append(os.path.join(os.path.dirname(__file__),'..','common'))

import news_api_client
from cloudAMQP_client import CloudAMQPClient
import log_client

REDIS_HOST = config['news_monitor']['REDIS_HOST']
REDIS_PORT = config['news_monitor']['REDIS_PORT']

NEWS_TIME_OUT_IN_SECONDS = config['news_monitor']['NEWS_TIME_OUT_IN_SECONDS']
SLEEP_TIME_IN_SECONDS = config['news_monitor']['SLEEP_TIME_IN_SECONDS']

SCRAPE_NEWS_TASK_QUEUE_URL = config['news_monitor']['SCRAPE_NEWS_TASK_QUEUE_URL']
SCRAPE_NEWS_TASK_QUEUE_NAME = config['news_monitor']['SCRAPE_NEWS_TASK_QUEUE_NAME']

NEW_SOURCES = config['news_monitor']['NEW_SOURCES']


redis_client = redis.StrictRedis(REDIS_HOST, REDIS_PORT)
cloudAMQP_client = CloudAMQPClient(SCRAPE_NEWS_TASK_QUEUE_URL, SCRAPE_NEWS_TASK_QUEUE_NAME)

while True:
    try:
        news_list = news_api_client.getNewsFromSource(NEW_SOURCES)

        nums_of_new_news = 0

        for news in news_list:
            news_digest = hashlib.md5(news['title'].encode('utf-8')).digest().encode('base64')   #or sha1

            if redis_client.get(news_digest) is None:
                nums_of_new_news = nums_of_new_news + 1
                news['digest'] = news_digest

                if news['publishedAt'] is None:
                    news['publishedAt'] = datetime.datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ')

                redis_client.set(news_digest, news)
                redis_client.expire(news_digest, NEWS_TIME_OUT_IN_SECONDS)
                cloudAMQP_client.sendMessage(news)
        log_client.logger.info("Fetched %d new news." % nums_of_new_news)
        #print "Fetched %d new news." % nums_of_new_news
    except Exception as e:
        print e
        log_client.logger.error(str(e))
        pass

    cloudAMQP_client.sleep(SLEEP_TIME_IN_SECONDS)
