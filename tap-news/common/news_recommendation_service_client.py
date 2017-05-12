import pyjsonrpc
import yaml
import log_client

stream = open("../config/config.yml", "r")
load = yaml.load(stream)
config = load['default']['common']

URL = config['news_recommendation_service_client']['URL']

client = pyjsonrpc.HttpClient(url=URL)

def getPreferenceForUser(userId):
    try:
        preference = client.call('getPreferenceForUser', userId)
        log_client.logger.info("Fecth user preference model...")
    except Exception as e:
        log_client.logger.error(str(e))
    return preference
