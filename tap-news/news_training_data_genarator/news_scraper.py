#!/usr/bin/python
# -*- coding: utf-8 -*-

import os
import sys
import redis
import hashlib
import datetime

from newspaper import Article
import news_api_client

import csv
import re


CSV_FILE = 'labeled_news.csv'

NEW_SOURCES = [
                'cnn',
                'bbc-news',
                'the-new-york-times'
                'google-news',
                'techradar',
                'usa-today',
                'buzzfeed',
                'fox-sports'

            ]
source_map = {
    'polygon':'Entertainment',
    'buzzfeed':'Entertainment',
    'espn':'Sports',
    'four-four-two':'Sports',
    'fox-sports':'Sports',
    'nfl-news':'Sports',
    'ars-technica':'Technology',
    'engadget':'Technology',
    'gruenderszene':'Technology',
    'recode':'Technology',
    'techradar':'Technology',
    'the-verge':'Technology'
    }

class_map = {
  'Colleges & Schools':'1',
  'Environmental':'2',
  'World':'3',
  'Entertainment':'4',
  'Media':'5',
  'Politics & Government':'6',
  'Regional News':'7',
  'Religion':'8',
  'Sports':'9',
  'Technology':'10',
  'Traffic':'11',
  'Weather':'12',
  'Economic & Corp':'13',
  'Advertisements':'14',
  'Crime':'15',
  'Other':'16',
  'Magazine' :'17'
}


redis_client = redis.StrictRedis('localhost', 6379, db=1)

tmp_map = {}
def reverseMap(map_source):
    for tmp1 in map_source:
        for tmp2 in map_source[tmp1]:
            tmp_map[tmp2] = tmp1

def getNewsClassifyByUrl(url):
    # TODO: need more infomation about key world in url
    url_classify_map={
        'Politics & Government' : [ 'politics', 'Trump', 'Government','federal' ],
        'Colleges & Schools': ['college', 'school'],
        'Environmental':['Environmental'],
        'World':['World'],
        'Entertainment':['Entertainment'],
        'Media':['Media'],
        'Regional News':['Regional'],
        'Religion':['Religion'],
        'Sports':['Sport'],
        'Technology':['Technology'],
        'Traffic':['Traffic'],
        'Weather':['Weather'],
        'Economic & Corp':['Economic', 'Corp'],
        'Advertisements':['Advertisement'],
        'Crime':['Crime'],
        'Magazine' :['Magazine'],
        'Other':['life','money']
    }

    if tmp_map is None or len(tmp_map)==0:
        reverseMap(url_classify_map)

    for pattern in tmp_map:
        #print 'Looking for "%s" in "%s"' % (pattern, url)
        if re.search(pattern,  url, flags=re.IGNORECASE):
            return tmp_map[pattern]

    return None


while True:
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
            redis_client.expire(news_digest, 86400)

            msg = news
            if msg is None or not isinstance(msg, dict):
                print 'message is broken'
                continue

            task = msg

            article = Article(task['url'])
            article.download()
            article.parse()

            task['text'] = article.text

            text = str(task['text'].encode('utf-8'))

            #text = task['text']
            title = str(task['title'].encode('utf-8'))
            url = task['url']
            source = str(task['source'].encode('utf-8'))
            #print 'url: %s, text: %s, source: %s' % (url, text, source)


            with open(CSV_FILE, 'a') as csvfile:
                spamwriter = csv.writer(csvfile, delimiter=',')
                if source in source_map:
                    spamwriter.writerow([class_map[source_map[source]], title, text, source])
                    print '(Source Judge)Write to csv classify %s: %s, source %s' %(class_map[source_map[source]],source_map[source],source)
                else:
                    classifyInfo = getNewsClassifyByUrl(url)
                    if classifyInfo is not None:
                        spamwriter.writerow([class_map[classifyInfo], title, text, source])
                        print '(Url Regular expression Judge)Write to csv classify %s: %s, source %s' %(class_map[classifyInfo],classifyInfo,source)
                    else:
                        nums_of_new_news-=1
                        print 'Can not get classsify information via url %s  -> Ignore' %(url)

    print "Fetched %d new classsified news for topic model training." % nums_of_new_news
    if nums_of_new_news == 0:
        print 'No more news, please check later...'
        break
