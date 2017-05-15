import json
import os
import pickle
import random
import redis
import sys
import yaml
import statsd


from bson.json_util import dumps
from datetime import datetime

stream = open("../config/config.yml", "r")
load = yaml.load(stream)
config = load['default']['backend_server']

#import common packages in parent directory
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'common'))

import mongodb_client
import news_recommendation_service_client
from cloudAMQP_client import CloudAMQPClient
import log_client
import elastic_client

es = elastic_client.get_elastic();

#es = Elasticsearch([{'host': config['elasticsearch']['ELASTICSEARCH_HOST'], 'port': config['elasticsearch']['ELASTICSEARCH_PORT'],'http_auth':'elastic:changeme'}])

REDIS_HOST = config['operations']['REDIS_HOST']
REDIS_PORT = config['operations']['REDIS_PORT']

NEWS_TABLE_NAME = config['operations']['NEWS_TABLE_NAME']
CLICK_LOGS_TABLE_NAME = config['operations']['CLICK_LOGS_TABLE_NAME']

NEWS_LIMITS = config['operations']['NEWS_LIMITS']
NEWS_LIST_BATCH_SIZE = config['operations']['NEWS_LIST_BATCH_SIZE']
USER_NEWS_TIME_OUT_IN_SECONDS = config['operations']['USER_NEWS_TIME_OUT_IN_SECONDS']

LOG_CLICKS_TASK_QUEUE_URL = config['operations']['LOG_CLICKS_TASK_QUEUE_URL']
LOG_CLICKS_TASK_QUEUE_NAME = config['operations']['LOG_CLICKS_TASK_QUEUE_NAME']

LOG_GRAPHITE_TASK_QUEUE_URL = config['operations']['LOG_GRAPHITE_TASK_QUEUE_URL']
LOG_GRAPHITE_TASK_QUEUE_NAME = config['operations']['LOG_GRAPHITE_TASK_QUEUE_NAME']

redis_client = redis.StrictRedis(REDIS_HOST, REDIS_PORT, db=0)
clickLog_cloudAMQP_client = CloudAMQPClient(LOG_CLICKS_TASK_QUEUE_URL, LOG_CLICKS_TASK_QUEUE_NAME)
graphitelog_cloudAMQP_client = CloudAMQPClient(LOG_GRAPHITE_TASK_QUEUE_URL, LOG_GRAPHITE_TASK_QUEUE_NAME)
db = mongodb_client.get_db()

#load news list
def getNewsSummariesForUser(user_id, page_num):
    #print 'operations: getNewsSummariesForUser'
    page_num = int(page_num)
    begin_index = (page_num - 1) * NEWS_LIST_BATCH_SIZE
    end_index = page_num * NEWS_LIST_BATCH_SIZE
    # print 'getNewsSummariesForUser, pageNum: %s' % page_num
    # print 'begin_index: %s' % begin_index
    # print 'end_index: %s' % end_index
    #the final lisr of news to be returned
    sliced_news = []

    #Get preference for the user_id
    preference = news_recommendation_service_client.getPreferenceForUser(user_id)
    topPreference = None
    if preference is not None and len(preference) > 0:
        topPreference = preference[0]

    if redis_client.get(user_id) is not None:
        #print "len %s" % len(redis_client.get(user_id))
        #print "end_index %s" % end_index
        news_digests = pickle.loads(redis_client.get(user_id))
        sliced_news_digests = news_digests[begin_index:end_index]
        #print sliced_news_digests
        sliced_news = list(db[NEWS_TABLE_NAME].find({'digest':{'$in':sliced_news_digests}}).sort([('publishedAt', -1)]))
        if preference is not None and len(preference) > 0:
            #Sort news by preference
            level = config['operations']['CLASS_NUMBER']
            for prefer in preference:
                level-=1
                for news in sliced_news:
                    if(news['class'] == prefer):
                        news['level'] = level
                        if news['publishedAt'].date() == datetime.today().date():
                            news['level'] += 0.5
                        #print "news list: %s" % news

            sliced_news.sort(key=lambda x: x['level'], reverse=True)
    else:
        total_news = list(db[NEWS_TABLE_NAME].find().sort([('publishedAt', -1)]).limit(NEWS_LIMITS))
        if preference is not None and len(preference) > 0:
            #Sort news by preference
            level = config['operations']['CLASS_NUMBER']
            for prefer in preference:
                level-=1
                for news in total_news:
                    if(news['class'] == prefer):
                        news['level'] = level
                        if news['publishedAt'].date() == datetime.today().date():
                            news['level'] += 0.5
                        #print "news list: %s" % news

            total_news.sort(key=lambda x: x['level'], reverse=True)

        total_news_digest = map(lambda x:x['digest'], total_news)

        redis_client.set(user_id, pickle.dumps(total_news_digest))
        redis_client.expire(user_id, USER_NEWS_TIME_OUT_IN_SECONDS)

        sliced_news = total_news[begin_index:end_index]

    for news in sliced_news:
        log_client.logger.debug('Create News class [%s] label, Current Top Preference is [%s]' % (news['class'], topPreference))
        #print 'Create News class [%s] label, Current Top Preference is [%s]' % (news['class'], topPreference)
        #remove text field to save bandwidth
        del news['text']
        if news['publishedAt'].date() == datetime.today().date():
            news['time'] = 'today'
        else:
            news['time'] = news['publishedAt'].date().strftime("%A %d. %B %Y")

        if news['class'] == topPreference and news['time'] == 'today':
            news['reason'] = 'Recommend'

    return json.loads(dumps(sliced_news))

def logNewsClickForUser(user_id, news_id):
    log_client.logger.debug("log clicks to db and amqp...")
    #print "log clicks to db and amqp..."
    message = {'userId': user_id, 'newsId': news_id, 'timestamp': datetime.utcnow()}
    #back up incase queue fail
    db = mongodb_client.get_db()
    db[CLICK_LOGS_TABLE_NAME].insert(message)

    # Send log task to machine learning service for prediction
    message = {'userId': user_id, 'newsId': news_id, 'timestamp': str(datetime.utcnow())}
    clickLog_cloudAMQP_client.sendMessage(message);


# TODO: save preference to database, get preference from database
def getPreferenceForUser(user_id):
    #print "get preference for user: %s" % user_id
    db = mongodb_client.get_db()
    preference = db['users'].find_one({ 'email': user_id })
    if('preference' not in preference):
        preference['preference'] = {'prefer':'9,8,7', 'ban':'1,2,3'}
    return json.loads(dumps(preference['preference']))


def logDataForGraphite(process_name):
    #print 'process_name: %s' % process_name
    #graphitelog_cloudAMQP_client.sendMessage(process_name);
    counter = statsd.Counter(process_name)
    counter+=1

def getSearchNewsSummariesForUser(user_id, page_num, search_key):
    #connect to our cluster
    page_num = int(page_num)
    begin_index = (page_num - 1) * NEWS_LIST_BATCH_SIZE
    end_index = page_num * NEWS_LIST_BATCH_SIZE
    # print 'getSearchNewsSummariesForUser, pageNum: %s' % page_num
    # print 'begin_index: %s' % begin_index
    # print 'end_index: %s' % end_index
    #the final lisr of news to be returned
    sliced_news = []
    #Get preference for the user_id
    preference = news_recommendation_service_client.getPreferenceForUser(user_id)
    topPreference = None
    if preference is not None and len(preference) > 0:
        topPreference = preference[0]
    if redis_client.get(search_key) is not None:
        #print "len %s" % len(redis_client.get(search_key))
        #print "end_index %s" % end_index
        news_digests = pickle.loads(redis_client.get(search_key))
        #print '9999999999999999999999999999999999999news_digests %s' % news_digests
        #print '000000000000000000000000000000000redis sliced_news begin_index end_index: %s %s %s' % (sliced_news_digests,begin_index,end_index)
        tmp_total_news = list(db[NEWS_TABLE_NAME].find({'digest':{'$in':news_digests}}).sort([('publishedAt', -1)]))
        sliced_news = tmp_total_news[begin_index:end_index]
    else:
        try:
            #print es
            result = es.search(index="news", body={"size":80, "query": {"more_like_this":
                                { "fields" : ["title", "description", "text", "class"],
                                "like" : search_key,"min_term_freq" : 1,
                                "max_query_terms": 100}}})
        except Exception as e:
            print str(e)
        hits = result['hits']['hits']
        #print '============================hits: %s' % hits
        total_news=[]
        #print 'len of hits %s' % len(hits)
        if hits is not None and len(hits)>0:
            for i in hits:
                #print i['_source']
                total_news.append(i['_source'])
            #total_news = list(total_news)
            #print '0000000000000000000000000000000000000total_news: %s' % len(total_news)
            total_news_digest = map(lambda x:x['digest'], total_news)
            total_news = list(db[NEWS_TABLE_NAME].find({'digest':{'$in':total_news_digest}}).sort([('publishedAt', -1)]))

            #print '1111111111111111111111111111111111111total_news: %s' % len(total_news)
            #print '222222222222222222222222222222222222total_news_digest %s' % total_news_digest
            redis_client.set(search_key, pickle.dumps(total_news_digest))
            redis_client.expire(search_key, USER_NEWS_TIME_OUT_IN_SECONDS)
            sliced_news = total_news[begin_index:end_index]
            #print '333333333333333++++++++++++++++before sliced_news begin end %s %s %s' % (sliced_news,begin_index, end_index)
        else:
            return json.loads(dumps(total_news));
    #print '++++++++++++++++++++++++++++++++++++++++++++++++++++++++++'
    #print '++++++++++++++++before sliced_news %s' % sliced_news
    for news in sliced_news:
        log_client.logger.debug('Create News class [%s] label, Current Top Preference is [%s]' % (news['class'], topPreference))
        #print 'Create News class [%s] label, Current Top Preference is [%s]' % (news['class'], topPreference)
        #remove text field to save bandwidth
        del news['text']
        if news['publishedAt'].date() == datetime.today().date():
            news['time'] = 'today'
        else:
            news['time'] = news['publishedAt'].date().strftime("%A %d. %B %Y")

        if news['class'] == topPreference and news['time'] == 'today':
            news['reason'] = 'Recommend'
    #print '--------------------------after sliced_news %s' % sliced_news
    return json.loads(dumps(sliced_news))
