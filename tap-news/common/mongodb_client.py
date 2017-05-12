from pymongo import MongoClient
import yaml
import log_client

stream = open("../config/config.yml", "r")
load = yaml.load(stream)
config = load['default']['common']

MONGO_DB_HOST = config['mongodb']['MONGO_DB_HOST']
MONGO_DB_PORT = config['mongodb']['MONGO_DB_PORT']
DB_NAME = config['mongodb']['DB_NAME']

client = MongoClient("%s:%d" % (MONGO_DB_HOST, MONGO_DB_PORT))

def get_db(db=DB_NAME):
    try:
        db = client[db]
        log_client.logger.info("MongoDB %s connected" % DB_NAME)
    except Exception as e:
        log_client.logger.error(str(e))
    return db
