#!/usr/bin/python
# -*- coding: utf-8 -*-

import datetime
import os
import sys
import yaml

from dateutil import parser
from sklearn.feature_extraction.text import TfidfVectorizer

stream = open("../config/config.yml", "r")
load = yaml.load(stream)
config = load['default']['news_pipeline']

#import common package in parent directory
sys.path.append(os.path.join(os.path.dirname(__file__),'..','common'))

import mongodb_client
import news_topic_modeling_service_client
from cloudAMQP_client import CloudAMQPClient
import log_client

DEDUPE_NEWS_TASK_QUEUE_URL = config['news_deduper']['DEDUPE_NEWS_TASK_QUEUE_URL']
DEDUPE_NEWS_TASK_QUEUE_NAME = config['news_deduper']['DEDUPE_NEWS_TASK_QUEUE_NAME']

ELASTICSEARCH_INDEX_TASK_QUEUE_URL = config['news_deduper']['ELASTICSEARCH_INDEX_TASK_QUEUE_URL']
ELASTICSEARCH_INDEX_TASK_QUEUE_NAME = config['news_deduper']['ELASTICSEARCH_INDEX_TASK_QUEUE_NAME']

SLEEP_TIME_IN_SECONDS = config['news_deduper']['SLEEP_TIME_IN_SECONDS']

NEWS_TABLE_NAME = config['news_deduper']['NEWS_TABLE_NAME']

SAME_NEWS_SIMILARITY_THRESHOLD = config['news_deduper']['SAME_NEWS_SIMILARITY_THRESHOLD']

dedupe_cloudAMQP_client = CloudAMQPClient(DEDUPE_NEWS_TASK_QUEUE_URL, DEDUPE_NEWS_TASK_QUEUE_NAME)

elasticsearch_index_cloudAMQP_client = CloudAMQPClient(ELASTICSEARCH_INDEX_TASK_QUEUE_URL, ELASTICSEARCH_INDEX_TASK_QUEUE_NAME)

from bs4 import BeautifulSoup
import re
import nltk
from nltk.corpus import stopwords
try:
    nltk.download("wordnet")  # Download text data sets, including stop words
except Exception as e:
    log_client.logger.error(str(e))



from nltk.stem import PorterStemmer
from nltk.stem import WordNetLemmatizer
from nltk.tokenize import sent_tokenize, word_tokenize
ps = PorterStemmer()
wnl = WordNetLemmatizer()

def data_clean( raw_review ):
    # Function to convert a raw review to a string of words
    # The input is a single string (a raw movie review), and
    # the output is a single string (a preprocessed movie review)
    #
    # 1. Remove HTML
    review_text = BeautifulSoup(raw_review).get_text()
    #
    # 2. Remove non-letters number
    letters_only = re.sub("[^a-zA-Z0-9]", " ", review_text)
    #
    # 3. Convert to lower case, split into individual words
    words = letters_only.lower().split()
    # 4. In Python, searching a set is much faster than searching
    #   a list, so convert the stop words to a set
    stops = set(stopwords.words("english"))
    #
    # 5. Remove stop words 35.33
    meaningful_words = [w for w in words if not w in stops]
    #
    # 6. Stem words(bad result) 24
    stemming_words = [ps.stem(w) for w in meaningful_words]
    #
    # 7.lemmatize_words  30
    lemmatize_words = [wnl.lemmatize(w) for w in stemming_words]
    # 7. Join the words back into one string separated by space,
    # and return the result.
    return  ( " ".join( stemming_words )).encode('utf-8')




def handle_message(msg):
    #print '======================Handle Message sklearn================================='
    if msg is None or not isinstance(msg, dict):
        log_client.logger.warn('message is broken')
        #print 'message is broken'
        return
    tmp_msg = msg
    task = msg
    text = str(task['text'].encode('utf-8'))

    if text is None:
        log_client.logger.warn('message is empty')
        #print 'text is empty'
        return

    #get all recent news based on publishedAt
    published_at = parser.parse(task['publishedAt'])
    published_at_day_begin = datetime.datetime(published_at.year, published_at.month, published_at.day-1, 0,0,0,0)
    published_at_day_end = published_at_day_begin + datetime.timedelta(days=2)

    #print 'from %s to %s' % (published_at_day_begin, published_at_day_end)

    db = mongodb_client.get_db()
    recent_news_list = list(db[NEWS_TABLE_NAME].find({'publishedAt':{'$gte':published_at_day_begin, '$lt':published_at_day_end}}))

    if recent_news_list is not None and len(recent_news_list) > 0:
        #print 'start compare'
        documents = [str(news['text'].encode('utf-8')) for news in recent_news_list]
        documents.insert(0, text)

        #calculate similarity matrix
        tfidf = TfidfVectorizer().fit_transform(documents)
        pairwise_sim = tfidf * tfidf.T

        #print pairwise_sim.A
        rows, _ = pairwise_sim.shape

        for row in range(1, rows):
            if pairwise_sim[row, 0] > SAME_NEWS_SIMILARITY_THRESHOLD:
                #print 'Duplicate news, Ignore'
                log_client.logger.info('Duplicate news, Ignore')
                return


    # Classify news
    title = task['title']
    text = task['text']
    data = title + text
    data = data_clean(data)
    if title is not None:
        topic = news_topic_modeling_service_client.classify(data)
        task['class'] = topic

    try:
        #msg['publishedAt'] = parser.parse(msg['publishedAt'])
        #print 'send news to db and elasticsearch queue... msg: %s' % (msg)
        elasticsearch_index_cloudAMQP_client.sendMessage(msg)
    except Exception as e:
        log_client.logger.error(str(e))

    task['publishedAt'] = parser.parse(task['publishedAt'])
    db[NEWS_TABLE_NAME].replace_one({'digest': task['digest']}, task, upsert=True)





while True:
    #elasticsearch_index_cloudAMQP_client.sendMessage('[{news1234}]')
    if dedupe_cloudAMQP_client is not None:
        msg = dedupe_cloudAMQP_client.getMessage()
        if msg is not None:
            try:
                handle_message(msg)
            except Exception as e:
                log_client.logger.error(str(e))
                pass
        dedupe_cloudAMQP_client.sleep(SLEEP_TIME_IN_SECONDS)
