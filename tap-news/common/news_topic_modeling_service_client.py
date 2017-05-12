import pyjsonrpc
import yaml
import log_client

stream = open("../config/config.yml", "r")
load = yaml.load(stream)
config = load['default']['common']

URL = config['news_topic_modeling_service_client']['URL']

client = pyjsonrpc.HttpClient(url=URL)

def classify(text):
    try:
        topic = client.call('classify', text)
        log_client.logger.info("Topic: %s" % str(topic))
    except Exception as e:
        log_client.logger.error(str(e))
    return topic
