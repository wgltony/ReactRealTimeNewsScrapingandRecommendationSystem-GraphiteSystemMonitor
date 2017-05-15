from elasticsearch import Elasticsearch
import yaml
import log_client

stream = open("../config/config.yml", "r")
load = yaml.load(stream)
config = load['default']['common']

ELASTICSEARCH_CONNECT = config['elasticsearch']


def get_elastic():
    try:
        es = Elasticsearch([ELASTICSEARCH_CONNECT])
        log_client.logger.info("elastic connected %s" % es)
    except Exception as e:
        log_client.logger.error(str(e))
    return es
