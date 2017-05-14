#!/usr/bin/python
# -*- coding: utf-8 -*-

import os
import sys
import yaml

from newspaper import Article

stream = open("../config/config.yml", "r")
load = yaml.load(stream)
config = load['default']['news_pipeline']

#import common package in parent directory
sys.path.append(os.path.join(os.path.dirname(__file__),'..','common'))
#sys.path.append(os.path.join(os.path.dirname(__file__),'./','scrapers'))

#import cnn_news_scraper
from cloudAMQP_client import CloudAMQPClient
import log_client

DEDUPE_NEWS_TASK_QUEUE_URL = config['news_fetcher']['DEDUPE_NEWS_TASK_QUEUE_URL']
DEDUPE_NEWS_TASK_QUEUE_NAME = config['news_fetcher']['DEDUPE_NEWS_TASK_QUEUE_NAME']
SCRAPE_NEWS_TASK_QUEUE_URL = config['news_fetcher']['SCRAPE_NEWS_TASK_QUEUE_URL']
SCRAPE_NEWS_TASK_QUEUE_NAME = config['news_fetcher']['SCRAPE_NEWS_TASK_QUEUE_NAME']

SLEEP_TIME_IN_SECONDS = config['news_fetcher']['SLEEP_TIME_IN_SECONDS']

dedupe_news_queue_client = CloudAMQPClient(DEDUPE_NEWS_TASK_QUEUE_URL, DEDUPE_NEWS_TASK_QUEUE_NAME)
scrape_news_queue_client = CloudAMQPClient(SCRAPE_NEWS_TASK_QUEUE_URL, SCRAPE_NEWS_TASK_QUEUE_NAME)

def handle_message(msg):
    if msg is None or not isinstance(msg, dict):
        log_client.logger.info('message is broken')
        #print 'message is broken'
        return

    task = msg
    '''text = None

    if(task['source'] == 'cnn'):
        print 'Scraping CNN news'
        text = cnn_news_scraper.extract_news(task['url'])
    else:
        print 'News source [%s] is not supported.' % task['source']'''

    article = Article(task['url'])
    article.download()
    article.parse()

    task['text'] = article.text
    #print 'send news to dedupe queue... %s' % task
    dedupe_news_queue_client.sendMessage(task)


while True:
    #fetch message from queue
    if scrape_news_queue_client is not None:
        msg = scrape_news_queue_client.getMessage()
        if msg is not None:
            #handle message
            try:
                handle_message(msg)
            except Exception as e:
                log_client.logger.error(str(e))
                pass

        scrape_news_queue_client.sleep(SLEEP_TIME_IN_SECONDS)
